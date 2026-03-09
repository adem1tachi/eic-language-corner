-- Create Polls table
CREATE TABLE IF NOT EXISTS public.polls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organizer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    language TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Poll Responses table
CREATE TABLE IF NOT EXISTS public.poll_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    selected_slots JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(poll_id, user_id)
);

-- Enable RLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_responses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Polls are viewable by everyone" ON public.polls
    FOR SELECT USING (true);

CREATE POLICY "Organizers and admins can create polls" ON public.polls
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('organizer', 'admin')
        )
    );

CREATE POLICY "Poll responses are viewable by everyone" ON public.poll_responses
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own poll responses" ON public.poll_responses
    FOR ALL USING (auth.uid() = user_id);
