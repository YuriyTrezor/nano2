
-- Login sessions table to track user login history
CREATE TABLE public.login_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.login_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all sessions"
ON public.login_sessions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own sessions"
ON public.login_sessions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service can insert sessions"
ON public.login_sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add blocked_cards array to profiles
ALTER TABLE public.profiles ADD COLUMN blocked_cards text[] NOT NULL DEFAULT '{}';

-- Add card_name to transactions for per-card tracking
ALTER TABLE public.transactions ADD COLUMN card_name text NOT NULL DEFAULT '';

-- Allow admins to update transactions (for editing amounts/titles)
CREATE POLICY "Admins can update transactions"
ON public.transactions FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete transactions
CREATE POLICY "Admins can delete transactions"
ON public.transactions FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for login_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.login_sessions;
