-- Create upsell_orders table to track AI model creation service orders

CREATE TABLE IF NOT EXISTS upsell_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotmart_transaction_id TEXT UNIQUE NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'form_submitted', 'generating', 'ready_for_review', 'delivered', 'refunded', 'failed')),
  reference_image_url TEXT,
  form_responses JSONB,
  generated_images JSONB DEFAULT '[]'::jsonb,
  delivery_email_sent_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by email and transaction_id
CREATE INDEX IF NOT EXISTS idx_upsell_orders_email ON upsell_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_upsell_orders_transaction ON upsell_orders(hotmart_transaction_id);
CREATE INDEX IF NOT EXISTS idx_upsell_orders_status ON upsell_orders(status);

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION update_upsell_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_upsell_orders_updated_at
BEFORE UPDATE ON upsell_orders
FOR EACH ROW
EXECUTE FUNCTION update_upsell_orders_updated_at();

-- Enable RLS
ALTER TABLE upsell_orders ENABLE ROW LEVEL SECURITY;

-- Policy: only service role can read/write (no client-side access)
CREATE POLICY "Service role full access on upsell_orders"
ON upsell_orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
