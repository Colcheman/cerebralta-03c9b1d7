
ALTER TABLE public.profiles ALTER COLUMN cpf SET DEFAULT '';

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date date;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, cpf, display_name, public_id, birth_date)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'cpf', ''),
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Arquitéto Mental'),
    'CBR-' || LPAD(nextval('public.public_id_seq')::text, 9, '0'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'birth_date' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'birth_date')::date 
      ELSE NULL 
    END
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$function$;
