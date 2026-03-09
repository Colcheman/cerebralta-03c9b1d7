ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'pt-BR',
  ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'BR',
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  ADD COLUMN IF NOT EXISTS locale_configured boolean NOT NULL DEFAULT false;