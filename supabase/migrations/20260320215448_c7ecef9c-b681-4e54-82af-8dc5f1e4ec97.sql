
-- Add columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS public_id text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accumulated_earnings numeric NOT NULL DEFAULT 0;

-- Create sequence for public_id
CREATE SEQUENCE IF NOT EXISTS public.public_id_seq START 1;

-- Backfill existing profiles
UPDATE public.profiles SET public_id = 'CBR-' || LPAD(nextval('public.public_id_seq')::text, 9, '0') WHERE public_id IS NULL;

-- Set default and NOT NULL
ALTER TABLE public.profiles ALTER COLUMN public_id SET DEFAULT 'CBR-' || LPAD(nextval('public.public_id_seq')::text, 9, '0');
ALTER TABLE public.profiles ALTER COLUMN public_id SET NOT NULL;

-- Recreate safe_profiles view
DROP VIEW IF EXISTS public.safe_profiles;
CREATE VIEW public.safe_profiles AS
SELECT user_id, display_name, avatar_url, banner_url, bio, level, points, streak, subscription_tier, allow_messages_from, created_at, name_verified, public_id, accumulated_earnings
FROM public.profiles;
