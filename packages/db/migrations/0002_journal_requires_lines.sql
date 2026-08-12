-- =============================================================================
-- GUARANTEE 1, completed: a journal with no lines cannot commit.
--
-- HAND-WRITTEN. Drizzle Kit does not generate triggers.
--
-- `assert_journal_balanced()` already contained a no-lines check, but its
-- trigger is AFTER INSERT ON ledger_entries — with zero lines nothing inserts,
-- so the check never ran in exactly the case it described, and an empty
-- journal_entries row committed. docs/DATABASE.md §2.1 claimed otherwise.
--
-- The check has to hang off journal_entries instead, and it has to be deferred:
-- postJournal() inserts the journal header first and its lines afterwards
-- inside the same transaction, so at statement time there are legitimately no
-- lines yet. DEFERRABLE INITIALLY DEFERRED moves the test to COMMIT.
--
-- The unreachable branch inside assert_journal_balanced() is left in place.
-- It is correct, it costs one EXISTS on a path that already scans the lines,
-- and removing a money-path check to tidy up is not a trade worth making.
-- =============================================================================

CREATE OR REPLACE FUNCTION assert_journal_has_lines()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM ledger_entries WHERE journal_id = NEW.id) THEN
        RAISE EXCEPTION 'Journal % has no lines', NEW.id
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NULL;
END;
$$;
--> statement-breakpoint

CREATE CONSTRAINT TRIGGER journal_entries_have_lines
    AFTER INSERT ON journal_entries
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION assert_journal_has_lines();
