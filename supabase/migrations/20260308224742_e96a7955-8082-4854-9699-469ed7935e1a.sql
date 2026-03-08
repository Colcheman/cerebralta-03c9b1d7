-- Fix: Change view from SECURITY DEFINER to SECURITY INVOKER
DROP VIEW IF EXISTS public.safe_profiles;

CREATE VIEW public.safe_profiles
WITH (security_invoker = true)
AS
SELECT 
  user_id,
  display_name,
  avatar_url,
  level,
  points,
  streak,
  subscription_tier,
  created_at
FROM public.profiles;