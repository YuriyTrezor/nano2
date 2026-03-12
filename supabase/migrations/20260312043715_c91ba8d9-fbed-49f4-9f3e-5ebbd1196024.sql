
CREATE TABLE public.compliance_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assisted_price text NOT NULL DEFAULT '24 999 ₽',
  full_price text NOT NULL DEFAULT '44 999 ₽',
  gold_discount integer NOT NULL DEFAULT 10,
  platinum_discount integer NOT NULL DEFAULT 15,
  diamond_discount integer NOT NULL DEFAULT 25,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.compliance_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read compliance settings"
ON public.compliance_settings FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can update compliance settings"
ON public.compliance_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert compliance settings"
ON public.compliance_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.compliance_settings (assisted_price, full_price, gold_discount, platinum_discount, diamond_discount)
VALUES ('24 999 ₽', '44 999 ₽', 10, 15, 25);
