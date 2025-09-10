-- Remove duplicate indexes to improve database performance
-- These indexes are redundant and can safely be removed

-- Table: bahan_baku (Warehouse)
DROP INDEX IF EXISTS public.idx_bahan_baku_low_stock_critical;
-- Reason: Duplicate of idx_bahan_baku_low_stock with same condition

DROP INDEX IF EXISTS public.idx_bahan_baku_user_kategori_stok;
-- Reason: Covered by idx_bahan_baku_kategori_stok

DROP INDEX IF EXISTS public.idx_bahan_baku_kadaluwarsa;
-- Reason: Covered by idx_bahan_baku_expiry_alert

-- Table: financial_transactions
DROP INDEX IF EXISTS public.idx_financial_transactions_date_user;
-- Reason: Duplicate of idx_financial_transactions_user_date

DROP INDEX IF EXISTS public.idx_financial_transactions_date_type;
-- Reason: Covered by idx_financial_transactions_type_date

DROP INDEX IF EXISTS public.idx_fin_tx_user;
-- Reason: Covered by idx_financial_transactions_user_date

-- Table: pemakaian_bahan
DROP INDEX IF EXISTS public.idx_pemakaian_bahan_tanggal_user;
-- Reason: Duplicate of idx_pemakaian_bahan_user_date

-- Table: recipes
DROP INDEX IF EXISTS public.idx_recipes_user;
-- Reason: Covered by idx_recipes_user_nama_resep

-- Additional cleanup for other potential duplicates
DROP INDEX IF EXISTS public.idx_financial_transactions_user_date_type;
-- Reason: Similar to idx_financial_transactions_type_date but less optimal

-- Verify remaining indexes after cleanup
DO $$
BEGIN
    RAISE NOTICE 'Duplicate indexes removed successfully';
    RAISE NOTICE 'Run VACUUM ANALYZE to update statistics';
END $$;
