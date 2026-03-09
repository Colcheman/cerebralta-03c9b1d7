
-- Fix search_path for calculate_discount
CREATE OR REPLACE FUNCTION public.calculate_discount(_active_days integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN _active_days >= 30 THEN 75
    WHEN _active_days >= 20 THEN 45
    WHEN _active_days >= 10 THEN 25
    ELSE 0
  END
$$;

-- Fix search_path for calculate_billing_amount
CREATE OR REPLACE FUNCTION public.calculate_billing_amount(_active_days integer)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT ROUND(52.90 * (1.0 - public.calculate_discount(_active_days) / 100.0), 2)
$$;
