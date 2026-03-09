-- Add registration_open column to sessions
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS registration_open BOOLEAN DEFAULT true;
