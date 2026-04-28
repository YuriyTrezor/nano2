
CREATE TABLE public.card_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  passport TEXT,
  country TEXT NOT NULL DEFAULT 'Россия',
  region TEXT,
  city TEXT NOT NULL,
  postal_code TEXT,
  address_line TEXT NOT NULL,
  delivery_service TEXT NOT NULL,
  delivery_type TEXT NOT NULL DEFAULT 'courier',
  pickup_point TEXT,
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.card_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own card orders" ON public.card_orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users create own card orders" ON public.card_orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all card orders" ON public.card_orders
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update card orders" ON public.card_orders
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_card_orders_updated_at
  BEFORE UPDATE ON public.card_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_card_orders_user ON public.card_orders(user_id);
CREATE INDEX idx_card_orders_status ON public.card_orders(status);
