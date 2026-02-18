
-- Add withdrawal block flag per client
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS withdrawal_blocked boolean NOT NULL DEFAULT false;

-- Add custom card prices per client (JSONB: {"Standard": "14 999 ₽", "Gold": "24 999 ₽", ...})
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS card_prices jsonb DEFAULT NULL;
