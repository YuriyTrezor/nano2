
-- Add cards array column and migrate existing data
ALTER TABLE public.profiles ADD COLUMN cards text[] NOT NULL DEFAULT '{}';

-- Migrate existing card_type values into the cards array
UPDATE public.profiles SET cards = ARRAY[card_type] WHERE card_type IS NOT NULL AND card_type != '';

-- Drop old card_type column
ALTER TABLE public.profiles DROP COLUMN card_type;

-- Add login tracking columns
ALTER TABLE public.profiles ADD COLUMN last_sign_in_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN last_sign_in_ip text;
