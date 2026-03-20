
CREATE OR REPLACE FUNCTION public.admin_set_premium(_target_user_id uuid, _tier subscription_tier)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN false;
  END IF;

  UPDATE profiles SET subscription_tier = _tier, updated_at = now()
  WHERE user_id = _target_user_id;

  INSERT INTO audit_log (user_id, action, details)
  VALUES (auth.uid(), 'admin_set_premium', jsonb_build_object('target', _target_user_id, 'tier', _tier));

  RETURN true;
END;
$$;
