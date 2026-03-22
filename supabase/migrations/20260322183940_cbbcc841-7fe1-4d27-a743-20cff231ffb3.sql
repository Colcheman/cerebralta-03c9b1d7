
-- Billing history table
CREATE TABLE public.billing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  active_days integer NOT NULL DEFAULT 0,
  discount_percent integer NOT NULL DEFAULT 0,
  base_amount numeric NOT NULL DEFAULT 52.90,
  final_amount numeric NOT NULL DEFAULT 52.90,
  asaas_payment_id text,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, month, year)
);

ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own billing
CREATE POLICY "Users can view own billing" ON public.billing_history
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage all billing
CREATE POLICY "Admins can manage billing" ON public.billing_history
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
