
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name text;

UPDATE public.profiles p
SET last_name = u.raw_user_meta_data->>'last_name'
FROM auth.users u
WHERE p.user_id = u.id
  AND p.last_name IS NULL
  AND u.raw_user_meta_data->>'last_name' IS NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, last_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'last_name',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL)
  );
  RETURN NEW;
END;
$function$;
