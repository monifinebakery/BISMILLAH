-- Migration: Create UMKM Financial Tables
-- Created: 2025-01-27
-- Description: Tabel untuk fitur finansial UMKM (savings goals, debt tracking, expense budgets)

-- =============================================
-- 1. SAVINGS GOALS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS "public"."savings_goals" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "target_amount" numeric(15,2) NOT NULL,
    "target_month" text NOT NULL, -- format: 'YYYY-MM'
    "description" text,
    "status" text DEFAULT 'active'::text NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    
    -- Constraints
    CONSTRAINT "savings_goals_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "savings_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    CONSTRAINT "savings_goals_target_amount_positive" CHECK ("target_amount" > 0),
    CONSTRAINT "savings_goals_status_valid" CHECK ("status" IN ('active', 'completed', 'cancelled')),
    CONSTRAINT "savings_goals_target_month_format" CHECK ("target_month" ~ '^\d{4}-\d{2}$'),
    CONSTRAINT "savings_goals_user_month_unique" UNIQUE ("user_id", "target_month")
);

-- Indexes for savings_goals
CREATE INDEX IF NOT EXISTS "idx_savings_goals_user_id" ON "public"."savings_goals" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_savings_goals_status" ON "public"."savings_goals" ("status");
CREATE INDEX IF NOT EXISTS "idx_savings_goals_target_month" ON "public"."savings_goals" ("target_month");
CREATE INDEX IF NOT EXISTS "idx_savings_goals_user_status" ON "public"."savings_goals" ("user_id", "status");

-- =============================================
-- 2. DEBT TRACKING TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS "public"."debt_tracking" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "type" text NOT NULL, -- 'hutang' atau 'piutang'
    "contact_name" text NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "description" text,
    "due_date" date NOT NULL,
    "status" text DEFAULT 'belum_bayar'::text NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    
    -- Constraints
    CONSTRAINT "debt_tracking_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "debt_tracking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    CONSTRAINT "debt_tracking_amount_positive" CHECK ("amount" > 0),
    CONSTRAINT "debt_tracking_type_valid" CHECK ("type" IN ('hutang', 'piutang')),
    CONSTRAINT "debt_tracking_status_valid" CHECK ("status" IN ('belum_bayar', 'sudah_bayar')),
    CONSTRAINT "debt_tracking_due_date_future" CHECK ("due_date" >= CURRENT_DATE - INTERVAL '1 year')
);

-- Indexes for debt_tracking
CREATE INDEX IF NOT EXISTS "idx_debt_tracking_user_id" ON "public"."debt_tracking" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_debt_tracking_type" ON "public"."debt_tracking" ("type");
CREATE INDEX IF NOT EXISTS "idx_debt_tracking_status" ON "public"."debt_tracking" ("status");
CREATE INDEX IF NOT EXISTS "idx_debt_tracking_due_date" ON "public"."debt_tracking" ("due_date");
CREATE INDEX IF NOT EXISTS "idx_debt_tracking_user_type" ON "public"."debt_tracking" ("user_id", "type");
CREATE INDEX IF NOT EXISTS "idx_debt_tracking_user_status" ON "public"."debt_tracking" ("user_id", "status");
CREATE INDEX IF NOT EXISTS "idx_debt_tracking_contact_name" ON "public"."debt_tracking" ("contact_name");

-- =============================================
-- 3. EXPENSE BUDGETS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS "public"."expense_budgets" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "category" text NOT NULL,
    "monthly_limit" numeric(15,2) NOT NULL,
    "alert_threshold" numeric(5,2) DEFAULT 80.00 NOT NULL, -- persentase untuk alert (0-100)
    "status" text DEFAULT 'active'::text NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    
    -- Constraints
    CONSTRAINT "expense_budgets_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "expense_budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    CONSTRAINT "expense_budgets_monthly_limit_positive" CHECK ("monthly_limit" > 0),
    CONSTRAINT "expense_budgets_alert_threshold_range" CHECK ("alert_threshold" >= 0 AND "alert_threshold" <= 100),
    CONSTRAINT "expense_budgets_status_valid" CHECK ("status" IN ('active', 'inactive')),
    CONSTRAINT "expense_budgets_user_category_unique" UNIQUE ("user_id", "category")
);

-- Indexes for expense_budgets
CREATE INDEX IF NOT EXISTS "idx_expense_budgets_user_id" ON "public"."expense_budgets" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_expense_budgets_category" ON "public"."expense_budgets" ("category");
CREATE INDEX IF NOT EXISTS "idx_expense_budgets_status" ON "public"."expense_budgets" ("status");
CREATE INDEX IF NOT EXISTS "idx_expense_budgets_user_status" ON "public"."expense_budgets" ("user_id", "status");

-- =============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE "public"."savings_goals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."debt_tracking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."expense_budgets" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for savings_goals
CREATE POLICY "Users can view their own savings goals" ON "public"."savings_goals"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own savings goals" ON "public"."savings_goals"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own savings goals" ON "public"."savings_goals"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own savings goals" ON "public"."savings_goals"
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for debt_tracking
CREATE POLICY "Users can view their own debt tracking" ON "public"."debt_tracking"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own debt tracking" ON "public"."debt_tracking"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debt tracking" ON "public"."debt_tracking"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debt tracking" ON "public"."debt_tracking"
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for expense_budgets
CREATE POLICY "Users can view their own expense budgets" ON "public"."expense_budgets"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expense budgets" ON "public"."expense_budgets"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expense budgets" ON "public"."expense_budgets"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expense budgets" ON "public"."expense_budgets"
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 5. TRIGGERS FOR UPDATED_AT
-- =============================================

-- Trigger for savings_goals
CREATE OR REPLACE TRIGGER "trigger_savings_goals_updated_at"
    BEFORE UPDATE ON "public"."savings_goals"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Trigger for debt_tracking
CREATE OR REPLACE TRIGGER "trigger_debt_tracking_updated_at"
    BEFORE UPDATE ON "public"."debt_tracking"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Trigger for expense_budgets
CREATE OR REPLACE TRIGGER "trigger_expense_budgets_updated_at"
    BEFORE UPDATE ON "public"."expense_budgets"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_updated_at_column"();

-- =============================================
-- 6. COMMENTS
-- =============================================

COMMENT ON TABLE "public"."savings_goals" IS 'Target tabungan bulanan untuk UMKM';
COMMENT ON COLUMN "public"."savings_goals"."target_month" IS 'Format: YYYY-MM, contoh: 2025-01';
COMMENT ON COLUMN "public"."savings_goals"."status" IS 'Status: active, completed, cancelled';

COMMENT ON TABLE "public"."debt_tracking" IS 'Tracking hutang dan piutang UMKM';
COMMENT ON COLUMN "public"."debt_tracking"."type" IS 'hutang = kita yang ngutang, piutang = orang yang ngutang ke kita';
COMMENT ON COLUMN "public"."debt_tracking"."status" IS 'Status: belum_bayar, sudah_bayar';

COMMENT ON TABLE "public"."expense_budgets" IS 'Budget pengeluaran per kategori untuk expense alerts';
COMMENT ON COLUMN "public"."expense_budgets"."alert_threshold" IS 'Persentase threshold untuk alert (0-100)';
COMMENT ON COLUMN "public"."expense_budgets"."status" IS 'Status: active, inactive';

-- =============================================
-- 7. SAMPLE DATA FUNCTIONS
-- =============================================

-- Function to get savings progress
CREATE OR REPLACE FUNCTION get_savings_progress(p_user_id uuid, p_target_month text)
RETURNS TABLE(
    target_amount numeric,
    current_savings numeric,
    progress_percentage numeric,
    remaining_amount numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_target_amount numeric;
    v_current_savings numeric;
BEGIN
    -- Get target amount
    SELECT sg.target_amount INTO v_target_amount
    FROM savings_goals sg
    WHERE sg.user_id = p_user_id 
      AND sg.target_month = p_target_month
      AND sg.status = 'active';
    
    -- Calculate current savings from financial_transactions
    SELECT COALESCE(SUM(
        CASE 
            WHEN ft.type = 'income' THEN ft.amount
            WHEN ft.type = 'expense' THEN -ft.amount
            ELSE 0
        END
    ), 0) INTO v_current_savings
    FROM financial_transactions ft
    WHERE ft.user_id = p_user_id
      AND to_char(ft.date, 'YYYY-MM') = p_target_month;
    
    -- Return results
    RETURN QUERY SELECT 
        COALESCE(v_target_amount, 0),
        COALESCE(v_current_savings, 0),
        CASE 
            WHEN v_target_amount > 0 THEN ROUND((v_current_savings / v_target_amount) * 100, 2)
            ELSE 0
        END,
        COALESCE(v_target_amount - v_current_savings, 0);
END;
$$;

-- Function to get debt summary
CREATE OR REPLACE FUNCTION get_debt_summary(p_user_id uuid)
RETURNS TABLE(
    total_hutang numeric,
    total_piutang numeric,
    net_position numeric,
    overdue_count integer,
    due_this_week_count integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        COALESCE(SUM(CASE WHEN dt.type = 'hutang' AND dt.status = 'belum_bayar' THEN dt.amount ELSE 0 END), 0) as total_hutang,
        COALESCE(SUM(CASE WHEN dt.type = 'piutang' AND dt.status = 'belum_bayar' THEN dt.amount ELSE 0 END), 0) as total_piutang,
        COALESCE(SUM(CASE WHEN dt.type = 'piutang' AND dt.status = 'belum_bayar' THEN dt.amount ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN dt.type = 'hutang' AND dt.status = 'belum_bayar' THEN dt.amount ELSE 0 END), 0) as net_position,
        COUNT(CASE WHEN dt.due_date < CURRENT_DATE AND dt.status = 'belum_bayar' THEN 1 END)::integer as overdue_count,
        COUNT(CASE WHEN dt.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND dt.status = 'belum_bayar' THEN 1 END)::integer as due_this_week_count
    FROM debt_tracking dt
    WHERE dt.user_id = p_user_id;
END;
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;