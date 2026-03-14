ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_status text NOT NULL DEFAULT 'coming_soon';