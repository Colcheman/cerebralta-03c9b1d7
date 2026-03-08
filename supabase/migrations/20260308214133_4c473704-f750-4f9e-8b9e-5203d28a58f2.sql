
-- Add theme_preference and whatsapp_number to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_preference text NOT NULL DEFAULT 'azul-alluzion';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_number text DEFAULT NULL;

-- Group messages table for real-time chat
CREATE TABLE public.group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group messages" ON public.group_messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_messages.group_id AND gm.user_id = auth.uid()));

CREATE POLICY "Members can send group messages" ON public.group_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_messages.group_id AND gm.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own messages" ON public.group_messages
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Courses table for admin-published educational content
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'geral',
  video_url text DEFAULT NULL,
  pdf_url text DEFAULT NULL,
  is_premium boolean NOT NULL DEFAULT false,
  author_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view courses" ON public.courses
  FOR SELECT TO authenticated
  USING (
    (NOT is_premium) OR 
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.subscription_tier = 'premium')
  );

CREATE POLICY "Admins can manage courses" ON public.courses
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Quote posts column
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS quoted_post_id uuid DEFAULT NULL REFERENCES public.posts(id);

-- Enable realtime for group_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
