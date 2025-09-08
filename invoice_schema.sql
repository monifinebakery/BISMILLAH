-- Invoice Schema for Supabase
-- Run this SQL in Supabase SQL Editor to create invoice tables

-- =====================================
-- CREATE INVOICES TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Invoice identification
  invoice_number varchar(50) NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  
  -- Customer information
  customer_name varchar(255) NOT NULL,
  customer_email varchar(255),
  customer_phone varchar(50),
  customer_address text,
  
  -- Invoice dates
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  
  -- Financial amounts
  subtotal decimal(15,2) NOT NULL DEFAULT 0,
  discount_amount decimal(15,2) DEFAULT 0,
  discount_percentage decimal(5,2) DEFAULT 0,
  tax_amount decimal(15,2) DEFAULT 0,
  tax_percentage decimal(5,2) DEFAULT 0,
  shipping_amount decimal(15,2) DEFAULT 0,
  total_amount decimal(15,2) NOT NULL DEFAULT 0,
  
  -- Status and metadata
  status varchar(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  currency varchar(3) DEFAULT 'IDR',
  notes text,
  payment_instructions text,
  
  -- Auto-generation settings
  auto_generated boolean DEFAULT false,
  template_type varchar(20) DEFAULT 'modern' CHECK (template_type IN ('modern', 'classic', 'minimal')),
  
  -- Audit fields
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_amounts CHECK (
    subtotal >= 0 AND 
    discount_amount >= 0 AND 
    tax_amount >= 0 AND 
    shipping_amount >= 0 AND 
    total_amount >= 0
  ),
  CONSTRAINT valid_percentages CHECK (
    discount_percentage >= 0 AND discount_percentage <= 100 AND
    tax_percentage >= 0 AND tax_percentage <= 100
  )
);

-- =====================================
-- CREATE INVOICE ITEMS TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  
  -- Item details
  item_name varchar(255) NOT NULL,
  description text,
  quantity decimal(10,3) NOT NULL DEFAULT 1,
  unit_price decimal(15,2) NOT NULL DEFAULT 0,
  total_price decimal(15,2) NOT NULL DEFAULT 0,
  
  -- Optional product linking
  product_id uuid, -- Can link to products table if exists
  
  -- Order in invoice
  sort_order integer DEFAULT 0,
  
  -- Audit fields
  created_at timestamp with time zone DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_item_amounts CHECK (
    quantity > 0 AND 
    unit_price >= 0 AND 
    total_price >= 0
  )
);

-- =====================================
-- CREATE INVOICE TEMPLATES TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS public.invoice_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Template details
  name varchar(100) NOT NULL,
  template_type varchar(20) NOT NULL CHECK (template_type IN ('modern', 'classic', 'minimal')),
  is_default boolean DEFAULT false,
  
  -- Template settings (JSON)
  settings jsonb DEFAULT '{}',
  
  -- Company branding
  company_logo_url text,
  company_name varchar(255),
  company_address text,
  company_phone varchar(50),
  company_email varchar(255),
  
  -- Default payment instructions
  default_payment_instructions text,
  default_notes text,
  
  -- Audit fields
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- =====================================
-- CREATE INDEXES
-- =====================================
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON public.invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_sort_order ON public.invoice_items(invoice_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_invoice_templates_user_id ON public.invoice_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_templates_default ON public.invoice_templates(user_id, is_default);

-- =====================================
-- CREATE RLS POLICIES
-- =====================================

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;

-- Invoices policies
CREATE POLICY "Users can view own invoices" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own invoices" ON public.invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices" ON public.invoices
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices" ON public.invoices
  FOR DELETE USING (auth.uid() = user_id);

-- Invoice items policies
CREATE POLICY "Users can view own invoice items" ON public.invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own invoice items" ON public.invoice_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own invoice items" ON public.invoice_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own invoice items" ON public.invoice_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

-- Invoice templates policies
CREATE POLICY "Users can view own templates" ON public.invoice_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own templates" ON public.invoice_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON public.invoice_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON public.invoice_templates
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================
-- CREATE TRIGGERS FOR AUTO TIMESTAMPS
-- =====================================

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_invoices_updated_at 
  BEFORE UPDATE ON public.invoices 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_templates_updated_at 
  BEFORE UPDATE ON public.invoice_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================
-- CREATE FUNCTIONS FOR INVOICE AUTOMATION
-- =====================================

-- Generate next invoice number for a user
CREATE OR REPLACE FUNCTION generate_invoice_number(p_user_id uuid)
RETURNS varchar(50) AS $$
DECLARE
  next_number integer;
  invoice_number varchar(50);
BEGIN
  -- Get the next sequence number for this user
  SELECT COALESCE(MAX(
    CASE 
      WHEN invoice_number ~ '^INV-[0-9]{4}-[0-9]+$' 
      THEN CAST(split_part(invoice_number, '-', 3) AS integer)
      ELSE 0
    END
  ), 0) + 1
  INTO next_number
  FROM public.invoices 
  WHERE user_id = p_user_id;
  
  -- Format: INV-YYYY-NNNN
  invoice_number := 'INV-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(next_number::text, 4, '0');
  
  RETURN invoice_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-create invoice from order
CREATE OR REPLACE FUNCTION create_invoice_from_order(
  p_order_id uuid,
  p_template_type varchar(20) DEFAULT 'modern'
)
RETURNS uuid AS $$
DECLARE
  order_record record;
  new_invoice_id uuid;
  item_record record;
BEGIN
  -- Get order data
  SELECT * INTO order_record
  FROM public.orders 
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;
  
  -- Generate invoice number
  DECLARE
    invoice_num varchar(50);
  BEGIN
    SELECT generate_invoice_number(order_record.user_id) INTO invoice_num;
    
    -- Create invoice
    INSERT INTO public.invoices (
      user_id,
      invoice_number,
      order_id,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      issue_date,
      due_date,
      subtotal,
      tax_amount,
      total_amount,
      status,
      template_type,
      auto_generated,
      notes
    ) VALUES (
      order_record.user_id,
      invoice_num,
      p_order_id,
      order_record.nama_pelanggan,
      order_record.email_pelanggan,
      order_record.telepon_pelanggan,
      order_record.alamat_pengiriman,
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '30 days', -- 30 days payment term
      COALESCE(order_record.subtotal, 0),
      COALESCE(order_record.pajak, 0),
      COALESCE(order_record.total_pesanan, 0),
      'draft',
      p_template_type,
      true,
      'Invoice dibuat otomatis dari pesanan ' || order_record.nomor_pesanan
    ) RETURNING id INTO new_invoice_id;
    
    -- Create invoice items from order items
    IF order_record.items IS NOT NULL AND jsonb_array_length(order_record.items) > 0 THEN
      FOR item_record IN 
        SELECT 
          (item->>'namaBarang')::varchar as item_name,
          (item->>'quantity')::decimal as quantity,
          (item->>'hargaSatuan')::decimal as unit_price,
          ((item->>'quantity')::decimal * (item->>'hargaSatuan')::decimal) as total_price
        FROM jsonb_array_elements(order_record.items) as item
      LOOP
        INSERT INTO public.invoice_items (
          invoice_id,
          item_name,
          quantity,
          unit_price,
          total_price
        ) VALUES (
          new_invoice_id,
          COALESCE(item_record.item_name, 'Item'),
          COALESCE(item_record.quantity, 1),
          COALESCE(item_record.unit_price, 0),
          COALESCE(item_record.total_price, 0)
        );
      END LOOP;
    END IF;
    
    RETURN new_invoice_id;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- INSERT DEFAULT TEMPLATE FOR EXISTING USERS
-- =====================================

-- Create default template for all existing users
INSERT INTO public.invoice_templates (
  user_id,
  name,
  template_type,
  is_default,
  company_name,
  default_payment_instructions
)
SELECT DISTINCT 
  user_id,
  'Template Default',
  'modern',
  true,
  COALESCE(business_name, 'My Business'),
  'Silakan transfer ke rekening berikut:\nBank: BCA\nNo. Rek: 1234567890\nA.n: ' || COALESCE(owner_name, 'Pemilik Bisnis')
FROM public.user_settings
ON CONFLICT DO NOTHING;

-- =====================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================

-- Uncomment the following if you want to insert sample data
/*
INSERT INTO public.invoices (
  user_id,
  invoice_number,
  customer_name,
  customer_email,
  customer_phone,
  customer_address,
  subtotal,
  tax_amount,
  total_amount,
  status,
  notes
) VALUES (
  auth.uid(), -- Replace with actual user_id for testing
  'INV-2025-0001',
  'Sample Customer',
  'customer@example.com',
  '+62 123 456 789',
  'Jl. Customer Address No. 123, Jakarta',
  1000000,
  110000,
  1110000,
  'draft',
  'Sample invoice for testing'
);
*/

-- =====================================
-- GRANT PERMISSIONS (if needed)
-- =====================================

-- Grant necessary permissions to authenticated users
GRANT ALL ON public.invoices TO authenticated;
GRANT ALL ON public.invoice_items TO authenticated;
GRANT ALL ON public.invoice_templates TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Final message
DO $$ 
BEGIN 
  RAISE NOTICE 'Invoice schema created successfully!';
  RAISE NOTICE 'Tables created: invoices, invoice_items, invoice_templates';
  RAISE NOTICE 'Functions created: generate_invoice_number, create_invoice_from_order';
  RAISE NOTICE 'RLS policies and triggers have been applied.';
END $$;
