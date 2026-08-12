CREATE TYPE "public"."account_class" AS ENUM('asset', 'liability', 'equity', 'revenue', 'direct_cost', 'expense');--> statement-breakpoint
CREATE TYPE "public"."normal_balance" AS ENUM('debit', 'credit');--> statement-breakpoint
CREATE TYPE "public"."product_kind" AS ENUM('saas', 'agency', 'corporate');--> statement-breakpoint
CREATE TYPE "public"."period_status" AS ENUM('open', 'reconciliation_required', 'closed', 'locked');--> statement-breakpoint
CREATE TYPE "public"."entry_direction" AS ENUM('debit', 'credit');--> statement-breakpoint
CREATE TYPE "public"."journal_source" AS ENUM('payment', 'refund', 'invoice', 'revenue_recognition', 'settlement', 'expense', 'payroll', 'manual', 'reversal', 'opening_balance', 'period_close');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'issued', 'partially_paid', 'paid', 'void', 'written_off');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('pending', 'delivered', 'failed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."refund_status" AS ENUM('requested', 'approved', 'pending', 'succeeded', 'failed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('created', 'provider_selected', 'pending', 'succeeded', 'failed', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."txn_status" AS ENUM('created', 'pending', 'succeeded', 'failed', 'cancelled', 'expired', 'partially_refunded', 'refunded', 'reversed', 'reconciliation_required');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trialing', 'active', 'past_due', 'grace', 'suspended', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."recon_status" AS ENUM('open', 'matched', 'mismatched', 'resolved');--> statement-breakpoint
CREATE TABLE "accounts" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"class" "account_class" NOT NULL,
	"normal_balance" "normal_balance" NOT NULL,
	"parent_code" text,
	"is_postable" boolean DEFAULT true NOT NULL,
	"is_contra" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"reconcile_source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_code_numeric" CHECK ("accounts"."code" ~ '^[1-6][0-9]{3}$')
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"kind" "product_kind" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fiscal_periods" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "fiscal_periods_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"fiscal_year" text NOT NULL,
	"period_no" smallint NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" "period_status" DEFAULT 'open' NOT NULL,
	"closed_at" timestamp with time zone,
	"closed_by" bigint,
	CONSTRAINT "fiscal_periods_year_no_key" UNIQUE("fiscal_year","period_no"),
	CONSTRAINT "period_range_valid" CHECK ("fiscal_periods"."ends_at" > "fiscal_periods"."starts_at"),
	CONSTRAINT "period_no_valid" CHECK ("fiscal_periods"."period_no" BETWEEN 1 AND 12)
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "journal_entries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"journal_no" text NOT NULL,
	"fiscal_period_id" bigint NOT NULL,
	"source" "journal_source" NOT NULL,
	"source_table" text,
	"source_id" text,
	"description" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"posted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"posted_by" bigint,
	"reverses_journal_id" bigint,
	"reversed_by_journal_id" bigint,
	CONSTRAINT "journal_entries_journal_no_key" UNIQUE("journal_no"),
	CONSTRAINT "no_self_reversal" CHECK ("journal_entries"."reverses_journal_id" IS DISTINCT FROM "journal_entries"."id")
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ledger_entries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"journal_id" bigint NOT NULL,
	"line_no" smallint NOT NULL,
	"account_code" text NOT NULL,
	"direction" "entry_direction" NOT NULL,
	"amount_minor" bigint NOT NULL,
	"currency" char(3) DEFAULT 'NPR' NOT NULL,
	"product_id" text,
	"customer_id" bigint,
	"memo" text,
	CONSTRAINT "ledger_entries_journal_line_key" UNIQUE("journal_id","line_no"),
	CONSTRAINT "amount_positive" CHECK ("ledger_entries"."amount_minor" > 0),
	CONSTRAINT "currency_iso" CHECK ("ledger_entries"."currency" ~ '^[A-Z]{3}$')
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "applications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"product_id" text NOT NULL,
	"name" text NOT NULL,
	"client_id" text NOT NULL,
	"secret_hash" text NOT NULL,
	"secret_last4" text NOT NULL,
	"scopes" text[] DEFAULT '{}' NOT NULL,
	"webhook_url" text,
	"webhook_secret" text,
	"is_live" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"rotated_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "applications_client_id_unique" UNIQUE("client_id"),
	CONSTRAINT "scopes_known" CHECK ("applications"."scopes" <@ ARRAY['payment:create','payment:read','invoice:create','invoice:read','refund:request','customer:read']::TEXT[])
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "customers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"product_id" text NOT NULL,
	"external_ref" text,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"pan" text,
	"address" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_product_external_key" UNIQUE("product_id","external_ref")
);
--> statement-breakpoint
CREATE TABLE "invoice_lines" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "invoice_lines_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"invoice_id" bigint NOT NULL,
	"line_no" smallint NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(12, 3) DEFAULT '1' NOT NULL,
	"unit_price_minor" bigint NOT NULL,
	"amount_minor" bigint NOT NULL,
	"revenue_account" text NOT NULL,
	CONSTRAINT "invoice_lines_invoice_line_key" UNIQUE("invoice_id","line_no"),
	CONSTRAINT "line_amount_positive" CHECK ("invoice_lines"."amount_minor" >= 0)
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "invoices_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"invoice_no" text NOT NULL,
	"fiscal_year" text NOT NULL,
	"sequence_no" bigint NOT NULL,
	"product_id" text NOT NULL,
	"application_id" bigint,
	"customer_id" bigint NOT NULL,
	"external_ref" text,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"subtotal_minor" bigint NOT NULL,
	"discount_minor" bigint DEFAULT 0 NOT NULL,
	"tax_minor" bigint DEFAULT 0 NOT NULL,
	"total_minor" bigint NOT NULL,
	"paid_minor" bigint DEFAULT 0 NOT NULL,
	"tds_withheld_minor" bigint DEFAULT 0 NOT NULL,
	"currency" char(3) DEFAULT 'NPR' NOT NULL,
	"service_starts_at" timestamp with time zone,
	"service_ends_at" timestamp with time zone,
	"issued_at" timestamp with time zone,
	"due_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_fiscal_sequence_key" UNIQUE("fiscal_year","sequence_no"),
	CONSTRAINT "invoices_invoice_no_key" UNIQUE("invoice_no"),
	CONSTRAINT "invoices_application_external_key" UNIQUE("application_id","external_ref"),
	CONSTRAINT "amounts_non_negative" CHECK ("invoices"."subtotal_minor" >= 0 AND "invoices"."discount_minor" >= 0 AND "invoices"."tax_minor" >= 0 AND "invoices"."paid_minor" >= 0 AND "invoices"."tds_withheld_minor" >= 0),
	CONSTRAINT "total_consistent" CHECK ("invoices"."total_minor" = "invoices"."subtotal_minor" - "invoices"."discount_minor" + "invoices"."tax_minor"),
	CONSTRAINT "no_overpayment" CHECK ("invoices"."paid_minor" <= "invoices"."total_minor"),
	CONSTRAINT "service_window_valid" CHECK ("invoices"."service_ends_at" IS NULL OR "invoices"."service_starts_at" IS NULL OR "invoices"."service_ends_at" > "invoices"."service_starts_at")
);
--> statement-breakpoint
CREATE TABLE "payment_providers" (
	"id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"min_amount_minor" bigint DEFAULT 0 NOT NULL,
	"max_amount_minor" bigint,
	"supports_refund" boolean DEFAULT false NOT NULL,
	"supports_callback" boolean DEFAULT false NOT NULL,
	"requires_polling" boolean DEFAULT true NOT NULL,
	"poll_interval_sec" integer DEFAULT 60 NOT NULL,
	"poll_timeout_sec" integer DEFAULT 3600 NOT NULL,
	"balance_account" text NOT NULL,
	"fee_account" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "limits_sane" CHECK ("payment_providers"."max_amount_minor" IS NULL OR "payment_providers"."max_amount_minor" > "payment_providers"."min_amount_minor")
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"key" text NOT NULL,
	"application_id" bigint NOT NULL,
	"endpoint" text NOT NULL,
	"request_hash" text NOT NULL,
	"response_status" smallint,
	"response_body" jsonb,
	"locked_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY("application_id","key")
);
--> statement-breakpoint
CREATE TABLE "payment_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" bigint NOT NULL,
	"application_id" bigint,
	"product_id" text NOT NULL,
	"customer_id" bigint NOT NULL,
	"amount_minor" bigint NOT NULL,
	"currency" char(3) DEFAULT 'NPR' NOT NULL,
	"status" "session_status" DEFAULT 'created' NOT NULL,
	"allowed_providers" text[] NOT NULL,
	"selected_provider" text,
	"return_url" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_amount_positive" CHECK ("payment_sessions"."amount_minor" > 0),
	CONSTRAINT "session_expiry_future" CHECK ("payment_sessions"."expires_at" > "payment_sessions"."created_at"),
	CONSTRAINT "session_id_format" CHECK ("payment_sessions"."id" ~ '^cs_(live|test)_[A-Za-z0-9_-]{32,}$')
);
--> statement-breakpoint
CREATE TABLE "provider_events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "provider_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"provider_id" text NOT NULL,
	"provider_event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"signature_valid" boolean NOT NULL,
	"payload" jsonb NOT NULL,
	"headers" jsonb,
	"transaction_id" bigint,
	"processed_at" timestamp with time zone,
	"processing_error" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "provider_events_dedup_key" UNIQUE("provider_id","provider_event_id","event_type")
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "refunds_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"refund_no" text NOT NULL,
	"transaction_id" bigint NOT NULL,
	"amount_minor" bigint NOT NULL,
	"currency" char(3) DEFAULT 'NPR' NOT NULL,
	"reason" text NOT NULL,
	"status" "refund_status" DEFAULT 'requested' NOT NULL,
	"provider_refund_id" text,
	"journal_id" bigint,
	"requested_by" bigint,
	"approved_by" bigint,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "refunds_refund_no_unique" UNIQUE("refund_no"),
	CONSTRAINT "refund_amount_positive" CHECK ("refunds"."amount_minor" > 0),
	CONSTRAINT "refund_needs_second_person" CHECK ("refunds"."status" NOT IN ('approved','pending','succeeded') OR ("refunds"."approved_by" IS NOT NULL AND "refunds"."approved_by" IS DISTINCT FROM "refunds"."requested_by"))
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "transactions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"txn_no" text NOT NULL,
	"session_id" text,
	"invoice_id" bigint NOT NULL,
	"application_id" bigint,
	"product_id" text NOT NULL,
	"customer_id" bigint NOT NULL,
	"provider_id" text NOT NULL,
	"provider_ref" text,
	"provider_txn_id" text,
	"provider_correlation_id" text,
	"status" "txn_status" DEFAULT 'created' NOT NULL,
	"gross_amount_minor" bigint NOT NULL,
	"provider_fee_minor" bigint DEFAULT 0 NOT NULL,
	"net_amount_minor" bigint NOT NULL,
	"refunded_amount_minor" bigint DEFAULT 0 NOT NULL,
	"currency" char(3) DEFAULT 'NPR' NOT NULL,
	"journal_id" bigint,
	"poll_attempts" integer DEFAULT 0 NOT NULL,
	"next_poll_at" timestamp with time zone,
	"last_polled_at" timestamp with time zone,
	"proof_url" text,
	"approved_by" bigint,
	"approved_at" timestamp with time zone,
	"failure_code" text,
	"failure_reason" text,
	"initiated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"succeeded_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_txn_no_unique" UNIQUE("txn_no"),
	CONSTRAINT "transactions_provider_ref_key" UNIQUE("provider_id","provider_ref"),
	CONSTRAINT "transactions_provider_txn_key" UNIQUE("provider_id","provider_txn_id"),
	CONSTRAINT "gross_positive" CHECK ("transactions"."gross_amount_minor" > 0),
	CONSTRAINT "fee_non_negative" CHECK ("transactions"."provider_fee_minor" >= 0),
	CONSTRAINT "net_consistent" CHECK ("transactions"."net_amount_minor" = "transactions"."gross_amount_minor" - "transactions"."provider_fee_minor"),
	CONSTRAINT "refund_within_gross" CHECK ("transactions"."refunded_amount_minor" <= "transactions"."gross_amount_minor"),
	CONSTRAINT "succeeded_needs_time" CHECK ("transactions"."status" <> 'succeeded' OR "transactions"."succeeded_at" IS NOT NULL),
	CONSTRAINT "succeeded_needs_journal" CHECK ("transactions"."status" NOT IN ('succeeded','refunded','partially_refunded') OR "transactions"."journal_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "webhook_deliveries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"application_id" bigint NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"signature" text NOT NULL,
	"status" "delivery_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone,
	"last_status_code" smallint,
	"last_error" text,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_mandates" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payment_mandates_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"customer_id" bigint NOT NULL,
	"provider_id" text NOT NULL,
	"provider_token" text NOT NULL,
	"display_hint" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subscriptions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"product_id" text NOT NULL,
	"application_id" bigint,
	"customer_id" bigint NOT NULL,
	"external_ref" text,
	"plan_code" text NOT NULL,
	"amount_minor" bigint NOT NULL,
	"currency" char(3) DEFAULT 'NPR' NOT NULL,
	"interval_months" smallint DEFAULT 1 NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp with time zone NOT NULL,
	"current_period_end" timestamp with time zone NOT NULL,
	"grace_days" smallint DEFAULT 7 NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_application_external_key" UNIQUE("application_id","external_ref"),
	CONSTRAINT "sub_period_valid" CHECK ("subscriptions"."current_period_end" > "subscriptions"."current_period_start"),
	CONSTRAINT "sub_interval_valid" CHECK ("subscriptions"."interval_months" BETWEEN 1 AND 36)
);
--> statement-breakpoint
CREATE TABLE "reconciliation_items" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "reconciliation_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"run_id" bigint NOT NULL,
	"transaction_id" bigint,
	"provider_ref" text,
	"internal_minor" bigint,
	"provider_minor" bigint,
	"status" "recon_status" DEFAULT 'open' NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "reconciliation_runs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "reconciliation_runs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"provider_id" text NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"internal_total_minor" bigint NOT NULL,
	"provider_total_minor" bigint,
	"bank_total_minor" bigint,
	"difference_minor" bigint,
	"status" "recon_status" DEFAULT 'open' NOT NULL,
	"notes" text,
	"run_by" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "admin_users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"totp_secret" text,
	"totp_enabled" boolean DEFAULT false NOT NULL,
	"role" text DEFAULT 'founder' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email"),
	CONSTRAINT "totp_required" CHECK (NOT "admin_users"."is_active" OR "admin_users"."totp_enabled")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"actor_type" text NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text,
	"before_state" jsonb,
	"after_state" jsonb,
	"ip_address" "inet",
	"user_agent" text,
	"request_id" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_parent_code_accounts_code_fk" FOREIGN KEY ("parent_code") REFERENCES "public"."accounts"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_fiscal_period_id_fiscal_periods_id_fk" FOREIGN KEY ("fiscal_period_id") REFERENCES "public"."fiscal_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_reverses_journal_id_journal_entries_id_fk" FOREIGN KEY ("reverses_journal_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_reversed_by_journal_id_journal_entries_id_fk" FOREIGN KEY ("reversed_by_journal_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_journal_id_journal_entries_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_account_code_accounts_code_fk" FOREIGN KEY ("account_code") REFERENCES "public"."accounts"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_revenue_account_accounts_code_fk" FOREIGN KEY ("revenue_account") REFERENCES "public"."accounts"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_providers" ADD CONSTRAINT "payment_providers_balance_account_accounts_code_fk" FOREIGN KEY ("balance_account") REFERENCES "public"."accounts"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_providers" ADD CONSTRAINT "payment_providers_fee_account_accounts_code_fk" FOREIGN KEY ("fee_account") REFERENCES "public"."accounts"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_sessions" ADD CONSTRAINT "payment_sessions_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_sessions" ADD CONSTRAINT "payment_sessions_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_sessions" ADD CONSTRAINT "payment_sessions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_sessions" ADD CONSTRAINT "payment_sessions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_sessions" ADD CONSTRAINT "payment_sessions_selected_provider_payment_providers_id_fk" FOREIGN KEY ("selected_provider") REFERENCES "public"."payment_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_events" ADD CONSTRAINT "provider_events_provider_id_payment_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."payment_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_events" ADD CONSTRAINT "provider_events_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_journal_id_journal_entries_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_session_id_payment_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."payment_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_provider_id_payment_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."payment_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_journal_id_journal_entries_id_fk" FOREIGN KEY ("journal_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_mandates" ADD CONSTRAINT "payment_mandates_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_mandates" ADD CONSTRAINT "payment_mandates_provider_id_payment_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."payment_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_run_id_reconciliation_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."reconciliation_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_runs" ADD CONSTRAINT "reconciliation_runs_provider_id_payment_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."payment_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_parent_idx" ON "accounts" USING btree ("parent_code");--> statement-breakpoint
CREATE INDEX "fiscal_periods_range_idx" ON "fiscal_periods" USING btree ("starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "journal_entries_period_idx" ON "journal_entries" USING btree ("fiscal_period_id");--> statement-breakpoint
CREATE INDEX "journal_entries_source_idx" ON "journal_entries" USING btree ("source_table","source_id");--> statement-breakpoint
CREATE INDEX "journal_entries_occurred_idx" ON "journal_entries" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "ledger_entries_journal_idx" ON "ledger_entries" USING btree ("journal_id");--> statement-breakpoint
CREATE INDEX "ledger_entries_account_idx" ON "ledger_entries" USING btree ("account_code");--> statement-breakpoint
CREATE INDEX "ledger_entries_product_idx" ON "ledger_entries" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "applications_product_idx" ON "applications" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "customers_email_idx" ON "customers" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "invoices_customer_idx" ON "invoices" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "invoices_status_idx" ON "invoices" USING btree ("status") WHERE "invoices"."status" <> 'paid';--> statement-breakpoint
CREATE INDEX "idempotency_expiry_idx" ON "idempotency_keys" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "sessions_invoice_idx" ON "payment_sessions" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "sessions_expiry_idx" ON "payment_sessions" USING btree ("expires_at") WHERE "payment_sessions"."status" IN ('created','provider_selected','pending');--> statement-breakpoint
CREATE INDEX "provider_events_unprocessed_idx" ON "provider_events" USING btree ("received_at") WHERE "provider_events"."processed_at" IS NULL;--> statement-breakpoint
CREATE INDEX "refunds_txn_idx" ON "refunds" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "txn_invoice_idx" ON "transactions" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "txn_product_idx" ON "transactions" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "txn_status_idx" ON "transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "txn_poll_idx" ON "transactions" USING btree ("next_poll_at") WHERE "transactions"."status" IN ('created','pending');--> statement-breakpoint
CREATE INDEX "webhook_retry_idx" ON "webhook_deliveries" USING btree ("next_attempt_at") WHERE "webhook_deliveries"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "subs_renewal_idx" ON "subscriptions" USING btree ("current_period_end") WHERE "subscriptions"."status" IN ('active','past_due','grace');--> statement-breakpoint
CREATE INDEX "audit_resource_idx" ON "audit_logs" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit_logs" USING btree ("actor_type","actor_id");--> statement-breakpoint
CREATE INDEX "audit_time_idx" ON "audit_logs" USING btree ("occurred_at" DESC NULLS LAST);