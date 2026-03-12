-- Add phone column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Update the full_setup.sql to reflect this change
-- (Note: I will also update full_setup.sql directly as requested)
