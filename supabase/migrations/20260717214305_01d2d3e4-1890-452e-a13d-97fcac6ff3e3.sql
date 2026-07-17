ALTER TABLE public.fichas
  ADD COLUMN IF NOT EXISTS whatsapp_notificado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_notificado_at timestamptz;