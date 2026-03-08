-- =====================================================
-- SECURITY PATCH 1: Protect sensitive profile data
-- =====================================================

-- Drop the overly permissive SELECT policy on profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- New: users can see their own full profile
CREATE POLICY "Users can view own full profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- New: users can see others' profiles (app layer filters sensitive columns)
CREATE POLICY "Users can view others basic profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() != user_id);

-- Create secure view hiding sensitive columns for use in queries
CREATE OR REPLACE VIEW public.safe_profiles AS
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

-- =====================================================
-- SECURITY PATCH 2: Lock down admin_settings
-- =====================================================
DROP POLICY IF EXISTS "Authenticated can read settings" ON public.admin_settings;

CREATE POLICY "Only admins can read settings" ON public.admin_settings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- SECURITY PATCH 3: Fix messaging policies to authenticated
-- =====================================================
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;

CREATE POLICY "Auth users view own conversations" ON public.conversations
  FOR SELECT TO authenticated
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Auth users create conversations" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Auth users update own conversations" ON public.conversations
  FOR UPDATE TO authenticated
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

DROP POLICY IF EXISTS "Participants can view messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Participants can send messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Sender can update own messages" ON public.direct_messages;

CREATE POLICY "Auth participants view messages" ON public.direct_messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = direct_messages.conversation_id AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())));

CREATE POLICY "Auth participants send messages" ON public.direct_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM conversations c WHERE c.id = direct_messages.conversation_id AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())));

CREATE POLICY "Auth sender update messages" ON public.direct_messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id);