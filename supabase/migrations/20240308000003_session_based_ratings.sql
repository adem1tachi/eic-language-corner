-- Update user_ratings to support session-based ratings
ALTER TABLE public.user_ratings ADD COLUMN session_id UUID REFERENCES public.sessions(id);

-- Drop previous unique constraint if it exists (assuming it was on from_id, to_id)
-- Note: Depending on the initial table creation, we might need to find the constraint name.
-- But for simplicity in this dev environment, we'll just add the new one.
ALTER TABLE public.user_ratings DROP CONSTRAINT IF EXISTS user_ratings_from_id_to_id_key;
ALTER TABLE public.user_ratings ADD CONSTRAINT user_ratings_session_unique UNIQUE (from_id, to_id, session_id);
