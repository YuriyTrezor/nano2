
-- 1) Table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid,
  client_name text,
  client_email text,
  title text NOT NULL,
  description text,
  amount numeric,
  currency text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_notifications_created_idx ON public.admin_notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_notifications_unread_idx ON public.admin_notifications (is_read) WHERE is_read = false;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_notifications TO authenticated;
GRANT ALL ON public.admin_notifications TO service_role;

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view notifications"
  ON public.admin_notifications FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update notifications"
  ON public.admin_notifications FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete notifications"
  ON public.admin_notifications FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone authenticated can insert via trigger"
  ON public.admin_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 2) Trigger: client transaction (withdrawals/transfers — amount < 0, initiated by the user himself)
CREATE OR REPLACE FUNCTION public.notify_admin_on_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
  v_email text;
BEGIN
  -- only client-initiated outgoing operations
  IF NEW.amount >= 0 THEN
    RETURN NEW;
  END IF;
  IF auth.uid() IS NULL OR auth.uid() <> NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT display_name, email INTO v_name, v_email
  FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;

  INSERT INTO public.admin_notifications
    (event_type, user_id, client_name, client_email, title, description, amount, currency, metadata)
  VALUES (
    CASE WHEN NEW.category ILIKE '%перевод%' OR NEW.title ILIKE '%перевод%' THEN 'transfer' ELSE 'withdrawal' END,
    NEW.user_id,
    v_name,
    v_email,
    COALESCE(NEW.title, 'Операция клиента'),
    NEW.category,
    NEW.amount,
    CASE WHEN NEW.category ILIKE '%USD%' OR NEW.title ILIKE '%USD%' THEN 'USD' ELSE 'RUB' END,
    jsonb_build_object('transaction_id', NEW.id, 'card_name', NEW.card_name)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admin_on_transaction ON public.transactions;
CREATE TRIGGER trg_notify_admin_on_transaction
AFTER INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_transaction();

-- 3) Trigger: conversion request
CREATE OR REPLACE FUNCTION public.notify_admin_on_conversion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
  v_email text;
BEGIN
  SELECT display_name, email INTO v_name, v_email
  FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;

  INSERT INTO public.admin_notifications
    (event_type, user_id, client_name, client_email, title, description, amount, currency, metadata)
  VALUES (
    'conversion',
    NEW.user_id,
    v_name,
    v_email,
    'Заявка на конвертацию',
    'Новый запрос на конвертацию валюты',
    NULL,
    NULL,
    jsonb_build_object('conversion_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admin_on_conversion ON public.conversion_requests;
CREATE TRIGGER trg_notify_admin_on_conversion
AFTER INSERT ON public.conversion_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_conversion();

-- 4) Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
