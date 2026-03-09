-- Create roles enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('member', 'organizer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    avatar_icon TEXT DEFAULT 'User',
    bio TEXT,
    role user_role DEFAULT 'member',
    languages_spoken JSONB DEFAULT '[]'::jsonb,
    languages_to_learn JSONB DEFAULT '[]'::jsonb,
    preferred_languages TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    language TEXT NOT NULL,
    max_participants INTEGER DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    organizer_id UUID REFERENCES public.profiles(id)
);

-- Create Registrations table
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'joined' CHECK (status IN ('joined', 'waitlist')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    unique(session_id, profile_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Sessions are viewable by everyone" ON public.sessions
    FOR SELECT USING (true);

CREATE POLICY "Organizers and admins can create sessions" ON public.sessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('organizer', 'admin')
        )
    );

CREATE POLICY "Organizers and admins can update their sessions" ON public.sessions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('organizer', 'admin')
        )
    );

CREATE POLICY "Registrations are viewable by everyone" ON public.registrations
    FOR SELECT USING (true);

CREATE POLICY "Users can register for sessions" ON public.registrations
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can cancel their own registration" ON public.registrations
    FOR DELETE USING (auth.uid() = profile_id);
