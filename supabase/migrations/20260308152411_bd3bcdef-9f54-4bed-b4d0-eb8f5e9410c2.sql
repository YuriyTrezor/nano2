
CREATE TABLE public.currency_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  symbol text NOT NULL,
  value numeric NOT NULL,
  previous numeric NOT NULL,
  change numeric NOT NULL,
  nominal integer NOT NULL DEFAULT 1,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Allow public read access
ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read currency rates"
  ON public.currency_rates
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Unique constraint on code to upsert
ALTER TABLE public.currency_rates ADD CONSTRAINT currency_rates_code_unique UNIQUE (code);
