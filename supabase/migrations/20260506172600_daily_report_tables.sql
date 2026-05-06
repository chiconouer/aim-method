CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotmart_transaction_id TEXT UNIQUE NOT NULL,
  buyer_name TEXT,
  buyer_email TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  product_name TEXT,
  status TEXT NOT NULL,
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  occurred_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sales_occurred_at ON sales(occurred_at DESC);

CREATE TABLE IF NOT EXISTS applies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  typeform_response_id TEXT UNIQUE NOT NULL,
  applicant_name TEXT,
  applicant_email TEXT,
  answers JSONB NOT NULL,
  raw_payload JSONB,
  submitted_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applies_submitted_at ON applies(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_applies_email ON applies(LOWER(applicant_email));
