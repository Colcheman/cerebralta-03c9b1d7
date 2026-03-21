
-- Add verification_status to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified';

-- Create verification_requests table for admin review
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  rejection_reason text
);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Users can view own requests
CREATE POLICY "Users can view own verification" ON public.verification_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Users can create own request
CREATE POLICY "Users can submit verification" ON public.verification_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Admins can manage all
CREATE POLICY "Admins can manage verifications" ON public.verification_requests
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Create a temporary bucket for verification docs (will be cleaned)
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Only the user can upload their own verification doc
CREATE POLICY "Users upload own verification docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Admins can view verification docs
CREATE POLICY "Admins view verification docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'verification-docs' AND has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete verification docs after review
CREATE POLICY "Admins delete verification docs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'verification-docs' AND has_role(auth.uid(), 'admin'::app_role));
