/*
  # Follow-up Templates Migration

  1. New Tables
    - `followup_templates` - Stores templates for order follow-ups
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - Template name
      - `subject` (text) - Subject line for emails
      - `body` (text) - Template content
      - `type` (text) - Communication channel (email, sms, whatsapp)
      - `steps` (jsonb) - Structured follow-up steps with timing
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `followup_templates` table
    - Add policies for users to manage their own templates
  
  3. Performance
    - Add index on user_id for faster queries
*/

-- Create table for follow-up templates
CREATE TABLE IF NOT EXISTS public.followup_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'whatsapp')),
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for follow-up logs
CREATE TABLE IF NOT EXISTS public.followup_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL,
  template_id UUID NOT NULL REFERENCES public.followup_templates(id),
  step_number INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  recipient TEXT NOT NULL,
  message TEXT NOT NULL,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.followup_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for followup_templates
CREATE POLICY "Users can view their own templates" 
  ON public.followup_templates 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates" 
  ON public.followup_templates 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" 
  ON public.followup_templates 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" 
  ON public.followup_templates 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for followup_logs
CREATE POLICY "Users can view their own follow-up logs" 
  ON public.followup_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own follow-up logs" 
  ON public.followup_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own follow-up logs" 
  ON public.followup_logs 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_followup_templates_user_id ON public.followup_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_followup_logs_user_id ON public.followup_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_followup_logs_order_id ON public.followup_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_followup_logs_template_id ON public.followup_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_followup_logs_scheduled_for ON public.followup_logs(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_followup_logs_status ON public.followup_logs(status);

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_followup_templates_updated_at
  BEFORE UPDATE ON public.followup_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_followup_logs_updated_at
  BEFORE UPDATE ON public.followup_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraint for order_id in followup_logs
ALTER TABLE public.followup_logs
ADD CONSTRAINT followup_logs_order_id_fkey
FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;