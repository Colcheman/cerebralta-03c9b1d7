
-- Notification queue table for WhatsApp webhook dispatch
CREATE TABLE public.notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid NOT NULL,
  recipient_whatsapp text NOT NULL,
  message_type text NOT NULL DEFAULT 'news',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  webhook_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- Only admins can manage the queue
CREATE POLICY "Admins can manage notification queue"
  ON public.notification_queue FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin webhook settings table
CREATE TABLE public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings"
  ON public.admin_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read settings"
  ON public.admin_settings FOR SELECT
  TO authenticated
  USING (true);
