/*
  # Initial Schema Setup

  1. New Tables
    - `bahan_baku` - Raw materials inventory
    - `suppliers` - Supplier information
    - `purchases` - Purchase transactions
    - `hpp_recipes` - Recipe management
    - `hpp_results` - HPP calculation results
    - `activities` - User activity log
  
  2. Security
    - Enable RLS on all tables
    - Add policies for CRUD operations
  
  3. Performance
    - Add indexes for common queries
    - Add triggers for updated_at timestamps
*/

-- Create table for bahan baku (raw materials) if not exists
CREATE TABLE IF NOT EXISTS public.bahan_baku (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  nama TEXT NOT NULL,
  kategori TEXT NOT NULL,
  stok NUMERIC NOT NULL DEFAULT 0,
  satuan TEXT NOT NULL,
  minimum NUMERIC NOT NULL DEFAULT 0,
  harga_satuan NUMERIC NOT NULL DEFAULT 0,
  supplier TEXT,
  tanggal_kadaluwarsa TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for suppliers if not exists
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  nama TEXT NOT NULL,
  kontak TEXT,
  email TEXT,
  telepon TEXT,
  alamat TEXT,
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for purchases if not exists
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  tanggal TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  supplier TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  total_nilai NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  metode_perhitungan TEXT,
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for recipes if not exists
CREATE TABLE IF NOT EXISTS public.hpp_recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  nama_resep TEXT NOT NULL,
  deskripsi TEXT,
  porsi INTEGER NOT NULL DEFAULT 1,
  ingredients JSONB DEFAULT '[]'::jsonb,
  biaya_tenaga_kerja NUMERIC DEFAULT 0,
  biaya_overhead NUMERIC DEFAULT 0,
  total_hpp NUMERIC DEFAULT 0,
  hpp_per_porsi NUMERIC DEFAULT 0,
  margin_keuntungan NUMERIC DEFAULT 0,
  harga_jual_per_porsi NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for HPP results if not exists
CREATE TABLE IF NOT EXISTS public.hpp_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  nama TEXT NOT NULL,
  ingredients JSONB DEFAULT '[]'::jsonb,
  biaya_tenaga_kerja NUMERIC DEFAULT 0,
  biaya_overhead NUMERIC DEFAULT 0,
  margin_keuntungan NUMERIC DEFAULT 0,
  total_hpp NUMERIC DEFAULT 0,
  hpp_per_porsi NUMERIC DEFAULT 0,
  harga_jual_per_porsi NUMERIC DEFAULT 0,
  jumlah_porsi INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for activities if not exists
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add check constraints if they don't exist
DO $$ 
BEGIN
  -- Add check constraint for activities.type if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'activities_type_check' AND conrelid = 'activities'::regclass
  ) THEN
    ALTER TABLE public.activities 
    ADD CONSTRAINT activities_type_check 
    CHECK (type IN ('hpp', 'stok', 'resep', 'purchase', 'supplier'));
  END IF;

  -- Add check constraint for purchases.status if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'purchases_status_check' AND conrelid = 'purchases'::regclass
  ) THEN
    ALTER TABLE public.purchases 
    ADD CONSTRAINT purchases_status_check 
    CHECK (status IN ('pending', 'completed', 'cancelled'));
  END IF;

  -- Add check constraint for purchases.metode_perhitungan if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'purchases_metode_perhitungan_check' AND conrelid = 'purchases'::regclass
  ) THEN
    ALTER TABLE public.purchases 
    ADD CONSTRAINT purchases_metode_perhitungan_check
    CHECK (metode_perhitungan IN ('FIFO', 'LIFO', 'AVERAGE'));
  END IF;
END $$;

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.bahan_baku ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hpp_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hpp_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bahan_baku if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bahan_baku' AND policyname = 'Users can view their own bahan baku') THEN
    CREATE POLICY "Users can view their own bahan baku" ON public.bahan_baku
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bahan_baku' AND policyname = 'Users can insert their own bahan baku') THEN
    CREATE POLICY "Users can insert their own bahan baku" ON public.bahan_baku
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bahan_baku' AND policyname = 'Users can update their own bahan baku') THEN
    CREATE POLICY "Users can update their own bahan baku" ON public.bahan_baku
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bahan_baku' AND policyname = 'Users can delete their own bahan baku') THEN
    CREATE POLICY "Users can delete their own bahan baku" ON public.bahan_baku
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create RLS policies for suppliers if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'suppliers' AND policyname = 'Users can view their own suppliers') THEN
    CREATE POLICY "Users can view their own suppliers" ON public.suppliers
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'suppliers' AND policyname = 'Users can insert their own suppliers') THEN
    CREATE POLICY "Users can insert their own suppliers" ON public.suppliers
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'suppliers' AND policyname = 'Users can update their own suppliers') THEN
    CREATE POLICY "Users can update their own suppliers" ON public.suppliers
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'suppliers' AND policyname = 'Users can delete their own suppliers') THEN
    CREATE POLICY "Users can delete their own suppliers" ON public.suppliers
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create RLS policies for purchases if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'purchases' AND policyname = 'Users can view their own purchases') THEN
    CREATE POLICY "Users can view their own purchases" ON public.purchases
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'purchases' AND policyname = 'Users can insert their own purchases') THEN
    CREATE POLICY "Users can insert their own purchases" ON public.purchases
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'purchases' AND policyname = 'Users can update their own purchases') THEN
    CREATE POLICY "Users can update their own purchases" ON public.purchases
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'purchases' AND policyname = 'Users can delete their own purchases') THEN
    CREATE POLICY "Users can delete their own purchases" ON public.purchases
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create RLS policies for hpp_recipes if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hpp_recipes' AND policyname = 'Users can view their own recipes') THEN
    CREATE POLICY "Users can view their own recipes" ON public.hpp_recipes
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hpp_recipes' AND policyname = 'Users can insert their own recipes') THEN
    CREATE POLICY "Users can insert their own recipes" ON public.hpp_recipes
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hpp_recipes' AND policyname = 'Users can update their own recipes') THEN
    CREATE POLICY "Users can update their own recipes" ON public.hpp_recipes
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hpp_recipes' AND policyname = 'Users can delete their own recipes') THEN
    CREATE POLICY "Users can delete their own recipes" ON public.hpp_recipes
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create RLS policies for hpp_results if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hpp_results' AND policyname = 'Users can view their own hpp results') THEN
    CREATE POLICY "Users can view their own hpp results" ON public.hpp_results
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hpp_results' AND policyname = 'Users can insert their own hpp results') THEN
    CREATE POLICY "Users can insert their own hpp results" ON public.hpp_results
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hpp_results' AND policyname = 'Users can update their own hpp results') THEN
    CREATE POLICY "Users can update their own hpp results" ON public.hpp_results
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hpp_results' AND policyname = 'Users can delete their own hpp results') THEN
    CREATE POLICY "Users can delete their own hpp results" ON public.hpp_results
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create RLS policies for activities if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activities' AND policyname = 'Users can view their own activities') THEN
    CREATE POLICY "Users can view their own activities" ON public.activities
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activities' AND policyname = 'Users can insert their own activities') THEN
    CREATE POLICY "Users can insert their own activities" ON public.activities
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activities' AND policyname = 'Users can update their own activities') THEN
    CREATE POLICY "Users can update their own activities" ON public.activities
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activities' AND policyname = 'Users can delete their own activities') THEN
    CREATE POLICY "Users can delete their own activities" ON public.activities
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes for better performance if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bahan_baku_user_id') THEN
    CREATE INDEX idx_bahan_baku_user_id ON public.bahan_baku(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_suppliers_user_id') THEN
    CREATE INDEX idx_suppliers_user_id ON public.suppliers(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_purchases_user_id') THEN
    CREATE INDEX idx_purchases_user_id ON public.purchases(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_hpp_recipes_user_id') THEN
    CREATE INDEX idx_hpp_recipes_user_id ON public.hpp_recipes(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_hpp_results_user_id') THEN
    CREATE INDEX idx_hpp_results_user_id ON public.hpp_results(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activities_user_id') THEN
    CREATE INDEX idx_activities_user_id ON public.activities(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activities_type') THEN
    CREATE INDEX idx_activities_type ON public.activities(type);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activities_created_at') THEN
    CREATE INDEX idx_activities_created_at ON public.activities(created_at DESC);
  END IF;
END $$;

-- Create function to update updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_bahan_baku_updated_at') THEN
    CREATE TRIGGER update_bahan_baku_updated_at BEFORE UPDATE ON public.bahan_baku
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_suppliers_updated_at') THEN
    CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_purchases_updated_at') THEN
    CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON public.purchases
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_hpp_recipes_updated_at') THEN
    CREATE TRIGGER update_hpp_recipes_updated_at BEFORE UPDATE ON public.hpp_recipes
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;