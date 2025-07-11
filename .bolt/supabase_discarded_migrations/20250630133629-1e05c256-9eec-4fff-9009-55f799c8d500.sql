
-- Create table for user settings
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_name TEXT NOT NULL DEFAULT 'Toko Roti Bahagia',
  owner_name TEXT NOT NULL DEFAULT 'John Doe',
  email TEXT,
  phone TEXT,
  address TEXT,
  currency TEXT NOT NULL DEFAULT 'IDR',
  language TEXT NOT NULL DEFAULT 'id',
  notifications JSONB NOT NULL DEFAULT '{
    "lowStock": true,
    "newOrder": true,
    "financial": false,
    "email": true,
    "push": false
  }'::jsonb,
  backup_settings JSONB NOT NULL DEFAULT '{
    "auto": false,
    "frequency": "daily",
    "location": "cloud"
  }'::jsonb,
  security_settings JSONB NOT NULL DEFAULT '{
    "twoFactor": false,
    "sessionTimeout": "30",
    "passwordRequirement": "medium"
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Add Row Level Security (RLS)
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user settings
CREATE POLICY "Users can view their own settings" 
  ON public.user_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" 
  ON public.user_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
  ON public.user_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create trigger to update updated_at column
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
