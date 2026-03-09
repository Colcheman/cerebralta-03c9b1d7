ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name_verified boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS real_name text;

DROP VIEW IF EXISTS public.safe_profiles;
CREATE VIEW public.safe_profiles AS
  SELECT user_id, display_name, avatar_url, banner_url, bio, level, points, streak, subscription_tier, allow_messages_from, created_at, name_verified
  FROM public.profiles;