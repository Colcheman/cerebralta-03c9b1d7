DROP VIEW IF EXISTS public.safe_profiles;
CREATE VIEW public.safe_profiles WITH (security_invoker = on) AS
  SELECT user_id, display_name, avatar_url, banner_url, bio, level, points, streak, subscription_tier, allow_messages_from, created_at, name_verified
  FROM public.profiles;