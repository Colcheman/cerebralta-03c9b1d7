
-- Function to count distinct active days (days with posts) for a user in a given month
CREATE OR REPLACE FUNCTION public.get_monthly_active_days(
  _user_id uuid,
  _year integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer,
  _month integer DEFAULT EXTRACT(MONTH FROM CURRENT_DATE)::integer
)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(COUNT(DISTINCT DATE(created_at))::integer, 0)
  FROM public.posts
  WHERE user_id = _user_id
    AND EXTRACT(YEAR FROM created_at) = _year
    AND EXTRACT(MONTH FROM created_at) = _month
$$;

-- Function to calculate discount percentage based on active days
CREATE OR REPLACE FUNCTION public.calculate_discount(_active_days integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN _active_days >= 30 THEN 75
    WHEN _active_days >= 20 THEN 45
    WHEN _active_days >= 10 THEN 25
    ELSE 0
  END
$$;

-- Function to calculate the billing amount based on active days
CREATE OR REPLACE FUNCTION public.calculate_billing_amount(_active_days integer)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ROUND(52.90 * (1.0 - public.calculate_discount(_active_days) / 100.0), 2)
$$;
