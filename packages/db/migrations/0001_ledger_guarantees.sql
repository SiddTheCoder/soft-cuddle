-- =============================================================================
-- Ledger guarantees, postable-account guard, and reporting views.
--
-- HAND-WRITTEN. Drizzle Kit does not generate triggers, constraint functions,
-- or views, and a regeneration must never drop them. Translated verbatim from
-- docs/schema.sql SECTIONS 2 and 13.
--
-- Do not weaken anything in this file. docs/RULES.md §3.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
--> statement-breakpoint

-- -----------------------------------------------------------------------------
-- GUARANTEE 1: every journal must balance, per currency.
-- Deferred so lines can be inserted one at a time inside a transaction;
-- checked at COMMIT.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION assert_journal_balanced()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_journal_id BIGINT := COALESCE(NEW.journal_id, OLD.journal_id);
    v_currency   CHAR(3);
    v_diff       BIGINT;
BEGIN
    FOR v_currency, v_diff IN
        SELECT currency,
               SUM(CASE WHEN direction = 'debit'
                        THEN amount_minor ELSE -amount_minor END)
        FROM ledger_entries
        WHERE journal_id = v_journal_id
        GROUP BY currency
    LOOP
        IF v_diff <> 0 THEN
            RAISE EXCEPTION
                'Journal % is unbalanced in %: debits minus credits = % paisa',
                v_journal_id, v_currency, v_diff
                USING ERRCODE = 'check_violation';
        END IF;
    END LOOP;

    IF NOT EXISTS (SELECT 1 FROM ledger_entries WHERE journal_id = v_journal_id) THEN
        RAISE EXCEPTION 'Journal % has no lines', v_journal_id
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NULL;
END;
$$;
--> statement-breakpoint

CREATE CONSTRAINT TRIGGER ledger_entries_balanced
    AFTER INSERT ON ledger_entries
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION assert_journal_balanced();
--> statement-breakpoint

-- -----------------------------------------------------------------------------
-- GUARANTEE 2: append-only. No UPDATE, no DELETE, ever.
-- Corrections are reversing journals.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reject_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION
        '% on % is not permitted. Post a reversing journal entry instead.',
        TG_OP, TG_TABLE_NAME
        USING ERRCODE = 'insufficient_privilege';
END;
$$;
--> statement-breakpoint

CREATE TRIGGER ledger_entries_immutable
    BEFORE UPDATE OR DELETE ON ledger_entries
    FOR EACH ROW EXECUTE FUNCTION reject_mutation();
--> statement-breakpoint

-- journal_entries allows exactly one mutation: stamping reversed_by_journal_id.
CREATE OR REPLACE FUNCTION journal_entries_guard()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Journal entries cannot be deleted'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF ROW(NEW.*) IS DISTINCT FROM ROW(OLD.*) THEN
        IF OLD.reversed_by_journal_id IS NOT NULL
           OR NEW.journal_no          IS DISTINCT FROM OLD.journal_no
           OR NEW.fiscal_period_id    IS DISTINCT FROM OLD.fiscal_period_id
           OR NEW.source              IS DISTINCT FROM OLD.source
           OR NEW.occurred_at         IS DISTINCT FROM OLD.occurred_at
           OR NEW.posted_at           IS DISTINCT FROM OLD.posted_at
        THEN
            RAISE EXCEPTION
                'Only reversed_by_journal_id may be set on a posted journal'
                USING ERRCODE = 'insufficient_privilege';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;
--> statement-breakpoint

CREATE TRIGGER journal_entries_immutable
    BEFORE UPDATE OR DELETE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION journal_entries_guard();
--> statement-breakpoint

-- -----------------------------------------------------------------------------
-- GUARANTEE 3: nothing posts into a closed period.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION assert_period_open()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_status period_status;
BEGIN
    SELECT status INTO v_status
    FROM fiscal_periods WHERE id = NEW.fiscal_period_id;

    IF v_status IN ('closed', 'locked') AND NEW.source <> 'period_close' THEN
        RAISE EXCEPTION 'Fiscal period % is %; cannot post',
            NEW.fiscal_period_id, v_status
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$;
--> statement-breakpoint

CREATE TRIGGER journal_entries_period_open
    BEFORE INSERT ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION assert_period_open();
--> statement-breakpoint

-- Postable-account guard
CREATE OR REPLACE FUNCTION assert_account_postable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM accounts
        WHERE code = NEW.account_code AND is_postable AND is_active
    ) THEN
        RAISE EXCEPTION 'Account % is not postable or not active', NEW.account_code
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$;
--> statement-breakpoint

CREATE TRIGGER ledger_entries_postable
    BEFORE INSERT ON ledger_entries
    FOR EACH ROW EXECUTE FUNCTION assert_account_postable();
--> statement-breakpoint

-- Raw provider events and the audit log are append-only too.
CREATE TRIGGER provider_events_immutable
    BEFORE DELETE ON provider_events
    FOR EACH ROW EXECUTE FUNCTION reject_mutation();
--> statement-breakpoint

CREATE TRIGGER audit_logs_immutable
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION reject_mutation();
--> statement-breakpoint

-- =============================================================================
-- REPORTING VIEWS
-- =============================================================================

CREATE OR REPLACE VIEW v_trial_balance AS
SELECT
    a.code,
    a.name,
    a.class,
    fp.fiscal_year,
    SUM(CASE WHEN le.direction = 'debit'  THEN le.amount_minor ELSE 0 END) AS debit_minor,
    SUM(CASE WHEN le.direction = 'credit' THEN le.amount_minor ELSE 0 END) AS credit_minor,
    SUM(CASE WHEN le.direction = 'debit'  THEN le.amount_minor
             ELSE -le.amount_minor END)
        * CASE WHEN a.normal_balance = 'debit' THEN 1 ELSE -1 END AS balance_minor
FROM accounts a
JOIN ledger_entries  le ON le.account_code = a.code
JOIN journal_entries je ON je.id = le.journal_id
JOIN fiscal_periods  fp ON fp.id = je.fiscal_period_id
GROUP BY a.code, a.name, a.class, a.normal_balance, fp.fiscal_year;
--> statement-breakpoint

CREATE OR REPLACE VIEW v_product_pl AS
SELECT
    le.product_id,
    fp.fiscal_year,
    fp.period_no,
    a.class,
    a.code,
    a.name,
    SUM(CASE WHEN le.direction = 'credit' THEN le.amount_minor
             ELSE -le.amount_minor END) AS amount_minor
FROM ledger_entries  le
JOIN accounts        a  ON a.code = le.account_code
JOIN journal_entries je ON je.id = le.journal_id
JOIN fiscal_periods  fp ON fp.id = je.fiscal_period_id
WHERE a.class IN ('revenue','direct_cost','expense')
GROUP BY le.product_id, fp.fiscal_year, fp.period_no, a.class, a.code, a.name;
--> statement-breakpoint

-- Sanity check: this must always return zero rows.
CREATE OR REPLACE VIEW v_unbalanced_journals AS
SELECT journal_id, currency,
       SUM(CASE WHEN direction = 'debit' THEN amount_minor
                ELSE -amount_minor END) AS difference_minor
FROM ledger_entries
GROUP BY journal_id, currency
HAVING SUM(CASE WHEN direction = 'debit' THEN amount_minor
                ELSE -amount_minor END) <> 0;
