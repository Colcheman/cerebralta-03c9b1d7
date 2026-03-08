
-- Enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.subscription_tier AS ENUM ('free', 'premium');
CREATE TYPE public.post_category AS ENUM ('reflexão', 'estratégia', 'estoicismo', 'prática');

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- USER ROLES (created first so has_role can reference it)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  cpf TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  level TEXT NOT NULL DEFAULT 'Iniciante',
  points INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  app_lock_pin TEXT,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  notification_email BOOLEAN NOT NULL DEFAULT true,
  notification_push BOOLEAN NOT NULL DEFAULT true,
  notification_whatsapp BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- POSTS
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  category post_category NOT NULL,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view non-premium posts" ON public.posts FOR SELECT TO authenticated
  USING (NOT is_premium OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND subscription_tier = 'premium'));
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- COMMENTS
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view comments" ON public.comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- POST LIKES
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view likes" ON public.post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can like posts" ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- MISSIONS
CREATE TABLE public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 10,
  icon TEXT NOT NULL DEFAULT '📝',
  is_premium BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view active missions" ON public.missions FOR SELECT TO authenticated
  USING (is_active AND (NOT is_premium OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND subscription_tier = 'premium')));
CREATE POLICY "Admins can manage missions" ON public.missions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- USER MISSIONS
CREATE TABLE public.user_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (user_id, mission_id, assigned_date)
);
ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own missions" ON public.user_missions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own missions" ON public.user_missions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own missions" ON public.user_missions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ACHIEVEMENTS
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view achievements" ON public.achievements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage achievements" ON public.achievements FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- USER ACHIEVEMENTS
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can unlock achievements" ON public.user_achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- INDEXES
CREATE INDEX idx_profiles_cpf ON public.profiles(cpf);
CREATE INDEX idx_posts_category ON public.posts(category);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_user_missions_user_date ON public.user_missions(user_id, assigned_date);
CREATE INDEX idx_post_likes_post ON public.post_likes(post_id);

-- AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, cpf, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'cpf', ''),
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Arquitéto Mental')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
