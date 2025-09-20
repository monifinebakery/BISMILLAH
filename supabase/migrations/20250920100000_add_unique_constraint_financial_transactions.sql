-- Add unique constraint to prevent duplicate financial transactions
-- This helps prevent race conditions when creating transactions concurrently

-- First, clean up any existing duplicates
DELETE FROM financial_transactions a
WHERE a.ctid <> (
    SELECT min(b.ctid)
    FROM financial_transactions b
    WHERE a.user_id = b.user_id 
    AND a.description = b.description
    AND a.type = b.type
    AND a.amount = b.amount
    AND a.date = b.date
);

-- Add unique constraint on (user_id, description) for income transactions to prevent race conditions
-- For expense transactions, we allow duplicates as they might be legitimate
ALTER TABLE financial_transactions 
ADD CONSTRAINT unique_income_transactions 
UNIQUE (user_id, description, type) 
DEFERRABLE INITIALLY DEFERRED;

-- Add comment to explain the constraint
COMMENT ON CONSTRAINT unique_income_transactions ON financial_transactions 
IS 'Prevents race conditions in financial transaction creation for income transactions';