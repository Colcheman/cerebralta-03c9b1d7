
-- Login history table
CREATE TABLE public.login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ip_address text,
  device text,
  browser text,
  location text,
  status text NOT NULL DEFAULT 'success',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own login history" ON public.login_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "System can insert login history" ON public.login_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all login history" ON public.login_history
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Password recovery history table
CREATE TABLE public.password_recovery_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ip_address text,
  status text NOT NULL DEFAULT 'requested',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.password_recovery_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recovery history" ON public.password_recovery_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "System can insert recovery history" ON public.password_recovery_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Security settings table (per-user preferences)
CREATE TABLE public.security_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  auto_logout_minutes integer NOT NULL DEFAULT 0,
  rate_limit_level text NOT NULL DEFAULT 'medium',
  notify_new_login boolean NOT NULL DEFAULT true,
  notify_failed_login boolean NOT NULL DEFAULT true,
  notify_password_change boolean NOT NULL DEFAULT true,
  notify_recovery boolean NOT NULL DEFAULT true,
  notify_breach boolean NOT NULL DEFAULT true,
  notify_via_email boolean NOT NULL DEFAULT true,
  notify_via_platform boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own security settings" ON public.security_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own security settings" ON public.security_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own security settings" ON public.security_settings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_security_settings_updated_at
  BEFORE UPDATE ON public.security_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
