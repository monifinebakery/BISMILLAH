/*
  # Add initiated_manual_send status to followup_logs

  1. Changes
    - Update the check constraint on followup_logs.status to include 'initiated_manual_send'
  
  2. Purpose
    - Allow tracking of manually initiated follow-up messages via wa.me links
    - Distinguish between automated and manual follow-up actions
*/

-- Drop the existing constraint
ALTER TABLE public.followup_logs
DROP CONSTRAINT IF EXISTS followup_logs_status_check;

-- Add the updated constraint with the new status
ALTER TABLE public.followup_logs
ADD CONSTRAINT followup_logs_status_check
CHECK (status IN ('pending', 'sent', 'failed', 'initiated_manual_send'));