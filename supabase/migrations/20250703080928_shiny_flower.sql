/*
  # Remove Follow-up Tables and References

  1. Changes
    - Drop followup_logs table
    - Drop followup_templates table
    - Remove followup_status_templates column from user_settings table
  
  2. Purpose
    - Clean up database by removing unused follow-up functionality
    - Simplify schema and reduce database size
*/

-- Drop followup_logs table if it exists
DROP TABLE IF EXISTS public.followup_logs;

-- Drop followup_templates table if it exists
DROP TABLE IF EXISTS public.followup_templates;

-- Remove followup_status_templates column from user_settings table if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_settings' AND column_name = 'followup_status_templates'
  ) THEN
    ALTER TABLE public.user_settings DROP COLUMN followup_status_templates;
  END IF;
END $$;