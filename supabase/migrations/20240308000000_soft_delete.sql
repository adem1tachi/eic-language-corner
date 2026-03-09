-- Add is_active column to sessions if it doesn't exist
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Ensure RLS policies allow for UPDATE on sessions and polls for organizers and admins
-- Sessions Update Policy
DROP POLICY IF EXISTS "Organizers and admins can update their sessions" ON public.sessions;
CREATE POLICY "Organizers and admins can update their sessions" ON public.sessions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('organizer', 'admin')
        )
    );

-- Polls Update Policy
DROP POLICY IF EXISTS "Organizers and admins can update polls" ON public.polls;
CREATE POLICY "Organizers and admins can update polls" ON public.polls
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('organizer', 'admin')
        )
    );
