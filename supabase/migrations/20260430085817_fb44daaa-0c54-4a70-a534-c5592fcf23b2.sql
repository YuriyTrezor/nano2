
-- Add USD->RUB rate and conversion fee to compliance_settings (used as global app settings)
ALTER TABLE public.compliance_settings
  ADD COLUMN IF NOT EXISTS usd_rub_rate numeric NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS conversion_fee_percent numeric NOT NULL DEFAULT 1;

-- Conversion requests table
CREATE TABLE IF NOT EXISTS public.conversion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount_usd numeric NOT NULL,
  rate numeric NOT NULL,
  fee_percent numeric NOT NULL DEFAULT 0,
  amount_rub numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  card_name text NOT NULL DEFAULT '',
  comment text,
  admin_comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE public.conversion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users create own conversion requests"
  ON public.conversion_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own conversion requests"
  ON public.conversion_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all conversion requests"
  ON public.conversion_requests FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update conversion requests"
  ON public.conversion_requests FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete conversion requests"
  ON public.conversion_requests FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_conversion_requests_updated_at
  BEFORE UPDATE ON public.conversion_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_conversion_requests_user ON public.conversion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_requests_status ON public.conversion_requests(status);
