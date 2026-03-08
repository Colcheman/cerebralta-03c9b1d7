
-- 1. Audit log table for sensitive admin actions
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs"
  ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- System can insert (via service role or security definer functions)
CREATE POLICY "System can insert audit logs"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2. Server-side function to validate and complete a mission
CREATE OR REPLACE FUNCTION public.complete_mission(_mission_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _already_done boolean;
  _mission_points int;
BEGIN
  IF _user_id IS NULL THEN RETURN false; END IF;

  -- Check mission is assigned to user and not completed
  SELECT completed INTO _already_done
  FROM user_missions
  WHERE mission_id = _mission_id AND user_id = _user_id;

  IF NOT FOUND OR _already_done THEN RETURN false; END IF;

  -- Get mission points
  SELECT points INTO _mission_points FROM missions WHERE id = _mission_id AND is_active;
  IF NOT FOUND THEN RETURN false; END IF;

  -- Mark completed
  UPDATE user_missions SET completed = true, completed_at = now()
  WHERE mission_id = _mission_id AND user_id = _user_id;

  -- Award points
  UPDATE profiles SET points = points + _mission_points, updated_at = now()
  WHERE user_id = _user_id;

  -- Log
  INSERT INTO audit_log (user_id, action, details)
  VALUES (_user_id, 'mission_completed', jsonb_build_object('mission_id', _mission_id, 'points', _mission_points));

  RETURN true;
END;
$$;

-- 3. Server-side function to validate achievement unlock
CREATE OR REPLACE FUNCTION public.unlock_achievement(_achievement_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _req_type text;
  _req_value int;
  _current_value int;
BEGIN
  IF _user_id IS NULL THEN RETURN false; END IF;

  -- Already unlocked?
  IF EXISTS (SELECT 1 FROM user_achievements WHERE achievement_id = _achievement_id AND user_id = _user_id) THEN
    RETURN false;
  END IF;

  -- Get requirement
  SELECT requirement_type, requirement_value INTO _req_type, _req_value
  FROM achievements WHERE id = _achievement_id;
  IF NOT FOUND THEN RETURN false; END IF;

  -- Validate requirement
  IF _req_type = 'points' THEN
    SELECT points INTO _current_value FROM profiles WHERE user_id = _user_id;
  ELSIF _req_type = 'streak' THEN
    SELECT streak INTO _current_value FROM profiles WHERE user_id = _user_id;
  ELSIF _req_type = 'missions_completed' THEN
    SELECT count(*)::int INTO _current_value FROM user_missions WHERE user_id = _user_id AND completed = true;
  ELSIF _req_type = 'posts' THEN
    SELECT count(*)::int INTO _current_value FROM posts WHERE user_id = _user_id;
  ELSE
    RETURN false;
  END IF;

  IF _current_value < _req_value THEN RETURN false; END IF;

  INSERT INTO user_achievements (user_id, achievement_id) VALUES (_user_id, _achievement_id);

  INSERT INTO audit_log (user_id, action, details)
  VALUES (_user_id, 'achievement_unlocked', jsonb_build_object('achievement_id', _achievement_id));

  RETURN true;
END;
$$;
