/*
  # Add followup_status_templates to user_settings

  1. Changes
    - Add `followup_status_templates` column to `user_settings` table
    - This column will store a mapping of order statuses to follow-up template IDs
  
  2. Purpose
    - Allow users to configure automatic follow-up templates for each order status
    - Enable automatic follow-up scheduling when order status changes
*/

-- Add followup_status_templates column to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS followup_status_templates JSONB DEFAULT '{}'::jsonb;