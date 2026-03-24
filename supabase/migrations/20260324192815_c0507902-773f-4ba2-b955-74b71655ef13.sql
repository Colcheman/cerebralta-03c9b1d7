
-- Add reply_to_id, message_type, and media_url to direct_messages
ALTER TABLE public.direct_messages
  ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.direct_messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS media_url text;

-- Create chat-media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for chat-media bucket: authenticated users can upload
CREATE POLICY "Authenticated users can upload chat media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Anyone can view chat media (public bucket)
CREATE POLICY "Public can view chat media"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'chat-media');

-- Users can delete their own uploads
CREATE POLICY "Users can delete own chat media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chat-media' AND (storage.foldername(name))[1] = auth.uid()::text);
