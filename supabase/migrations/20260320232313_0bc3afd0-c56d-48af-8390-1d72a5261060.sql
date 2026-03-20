
-- Create follows table
CREATE TABLE public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows"
  ON public.follows FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can follow"
  ON public.follows FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON public.follows FOR DELETE TO authenticated
  USING (auth.uid() = follower_id);

-- Recreate safe_profiles with follower counts
DROP VIEW IF EXISTS public.safe_profiles;
CREATE VIEW public.safe_profiles AS
SELECT
  p.user_id,
  p.display_name,
  p.avatar_url,
  p.banner_url,
  p.bio,
  p.level,
  p.points,
  p.streak,
  p.subscription_tier,
  p.allow_messages_from,
  p.created_at,
  p.name_verified,
  p.public_id,
  p.accumulated_earnings,
  (SELECT count(*) FROM public.follows f WHERE f.following_id = p.user_id)::integer AS followers_count,
  (SELECT count(*) FROM public.follows f WHERE f.follower_id = p.user_id)::integer AS following_count
FROM public.profiles p;
