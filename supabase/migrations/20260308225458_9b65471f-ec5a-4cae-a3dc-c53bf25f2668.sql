-- Drop the problematic view RLS attempt and fix profiles
DROP VIEW IF EXISTS public.safe_profiles;

-- Recreate view without RLS (views inherit RLS from base table)
CREATE VIEW public.safe_profiles
WITH (security_invoker = true)
AS SELECT user_id, display_name, avatar_url, level, points, streak, subscription_tier, created_at
FROM public.profiles;

-- Fix profiles: only own full profile visible, admins see all
DROP POLICY IF EXISTS "Users can view own full profile" ON public.profiles;
CREATE POLICY "Users can view own full profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can view others basic profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Fix all other tables (PERMISSIVE replacements)
DROP POLICY IF EXISTS "Authenticated can view non-premium posts" ON public.posts;
CREATE POLICY "Authenticated can view non-premium posts" ON public.posts FOR SELECT TO authenticated USING ((NOT is_premium) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.subscription_tier = 'premium'));
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

DROP POLICY IF EXISTS "Authenticated can view comments" ON public.comments;
CREATE POLICY "Authenticated can view comments" ON public.comments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

DROP POLICY IF EXISTS "Authenticated can view likes" ON public.post_likes;
CREATE POLICY "Authenticated can view likes" ON public.post_likes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can like posts" ON public.post_likes;
CREATE POLICY "Users can like posts" ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can unlike posts" ON public.post_likes;
CREATE POLICY "Users can unlike posts" ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Everyone can view courses" ON public.courses;
CREATE POLICY "Everyone can view courses" ON public.courses FOR SELECT TO authenticated USING ((NOT is_premium) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.subscription_tier = 'premium'));
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated can view achievements" ON public.achievements;
CREATE POLICY "Authenticated can view achievements" ON public.achievements FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins can manage achievements" ON public.achievements;
CREATE POLICY "Admins can manage achievements" ON public.achievements FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can unlock achievements" ON public.user_achievements;
CREATE POLICY "Users can unlock achievements" ON public.user_achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated can view active missions" ON public.missions;
CREATE POLICY "Authenticated can view active missions" ON public.missions FOR SELECT TO authenticated USING (is_active AND ((NOT is_premium) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.subscription_tier = 'premium')));
DROP POLICY IF EXISTS "Admins can manage missions" ON public.missions;
CREATE POLICY "Admins can manage missions" ON public.missions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can view own missions" ON public.user_missions;
CREATE POLICY "Users can view own missions" ON public.user_missions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own missions" ON public.user_missions;
CREATE POLICY "Users can insert own missions" ON public.user_missions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own missions" ON public.user_missions;
CREATE POLICY "Users can update own missions" ON public.user_missions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated can view groups" ON public.groups;
CREATE POLICY "Authenticated can view groups" ON public.groups FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can create groups" ON public.groups;
CREATE POLICY "Users can create groups" ON public.groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
DROP POLICY IF EXISTS "Creator can update group" ON public.groups;
CREATE POLICY "Creator can update group" ON public.groups FOR UPDATE TO authenticated USING (auth.uid() = creator_id);
DROP POLICY IF EXISTS "Creator or admin can delete group" ON public.groups;
CREATE POLICY "Creator or admin can delete group" ON public.groups FOR DELETE TO authenticated USING (auth.uid() = creator_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated can view members" ON public.group_members;
CREATE POLICY "Authenticated can view members" ON public.group_members FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
CREATE POLICY "Users can join groups" ON public.group_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;
CREATE POLICY "Users can leave groups" ON public.group_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Members can view group messages" ON public.group_messages;
CREATE POLICY "Members can view group messages" ON public.group_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_messages.group_id AND gm.user_id = auth.uid()));
DROP POLICY IF EXISTS "Members can send group messages" ON public.group_messages;
CREATE POLICY "Members can send group messages" ON public.group_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_messages.group_id AND gm.user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can delete own messages" ON public.group_messages;
DROP POLICY IF EXISTS "Users can delete own group messages" ON public.group_messages;
CREATE POLICY "Users can delete own group messages" ON public.group_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Auth users view own conversations" ON public.conversations;
CREATE POLICY "Auth users view own conversations" ON public.conversations FOR SELECT TO authenticated USING (auth.uid() = participant_1 OR auth.uid() = participant_2);
DROP POLICY IF EXISTS "Auth users create conversations" ON public.conversations;
CREATE POLICY "Auth users create conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);
DROP POLICY IF EXISTS "Auth users update own conversations" ON public.conversations;
CREATE POLICY "Auth users update own conversations" ON public.conversations FOR UPDATE TO authenticated USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

DROP POLICY IF EXISTS "Auth participants view messages" ON public.direct_messages;
CREATE POLICY "Auth participants view messages" ON public.direct_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = direct_messages.conversation_id AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())));
DROP POLICY IF EXISTS "Auth participants send messages" ON public.direct_messages;
CREATE POLICY "Auth participants send messages" ON public.direct_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM conversations c WHERE c.id = direct_messages.conversation_id AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())));
DROP POLICY IF EXISTS "Auth sender update messages" ON public.direct_messages;
CREATE POLICY "Auth sender update messages" ON public.direct_messages FOR UPDATE TO authenticated USING (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Everyone can view news" ON public.news;
CREATE POLICY "Everyone can view news" ON public.news FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins can manage news" ON public.news;
CREATE POLICY "Admins can manage news" ON public.news FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Only admins can read settings" ON public.admin_settings;
CREATE POLICY "Only admins can read settings" ON public.admin_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can manage settings" ON public.admin_settings;
CREATE POLICY "Admins can manage settings" ON public.admin_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage notification queue" ON public.notification_queue;
CREATE POLICY "Admins can manage notification queue" ON public.notification_queue FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));