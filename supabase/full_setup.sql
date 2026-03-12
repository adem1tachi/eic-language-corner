-- EIC Language Corner - Full Database Setup
-- This script sets up the entire database schema, including tables, 
-- roles, RLS policies, and triggers for a new Supabase project.

-- ==========================================
-- 1. ROLES AND TYPES
-- ==========================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('member', 'organizer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==========================================
-- 2. TABLES
-- ==========================================

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    phone TEXT,
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

-- SESSIONS
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    language TEXT NOT NULL,
    max_participants INTEGER DEFAULT 20,
    is_active BOOLEAN DEFAULT true,
    registration_open BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    organizer_id UUID REFERENCES public.profiles(id)
);

-- REGISTRATIONS
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'joined' CHECK (status IN ('joined', 'waitlist')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(session_id, profile_id)
);

-- POLLS
CREATE TABLE IF NOT EXISTS public.polls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organizer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    language TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- POLL RESPONSES
CREATE TABLE IF NOT EXISTS public.poll_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    selected_slots JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(poll_id, user_id)
);

-- USER RATINGS (Session-based)
CREATE TABLE IF NOT EXISTS public.user_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    to_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT user_ratings_session_unique UNIQUE (from_id, to_id, session_id)
);

-- ==========================================
-- 3. FUNCTIONS & TRIGGERS
-- ==========================================

-- AUTH TRIGGER FUNCTION (Handles new user creation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'member'
  );
  RETURN new;
END;
$$;

-- CONNECT TRIGGER TO AUTH.USERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 4. RLS (ROW LEVEL SECURITY)
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 5. POLICIES
-- ==========================================

-- PROFILES
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- SESSIONS
CREATE POLICY "Sessions are viewable by everyone" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Organizers and admins can create sessions" ON public.sessions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('organizer', 'admin'))
);
CREATE POLICY "Organizers and admins can update their sessions" ON public.sessions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('organizer', 'admin'))
);

-- REGISTRATIONS
CREATE POLICY "Registrations are viewable by everyone" ON public.registrations FOR SELECT USING (true);
CREATE POLICY "Users can register for sessions" ON public.registrations FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can cancel their own registration" ON public.registrations FOR DELETE USING (auth.uid() = profile_id);

-- POLLS
CREATE POLICY "Polls are viewable by everyone" ON public.polls FOR SELECT USING (true);
CREATE POLICY "Organizers and admins can create polls" ON public.polls FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('organizer', 'admin'))
);
CREATE POLICY "Organizers and admins can update polls" ON public.polls FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('organizer', 'admin'))
);

-- POLL RESPONSES
CREATE POLICY "Poll responses are viewable by everyone" ON public.poll_responses FOR SELECT USING (true);
CREATE POLICY "Users can manage their own poll responses" ON public.poll_responses FOR ALL USING (auth.uid() = user_id);

-- USER RATINGS
CREATE POLICY "Ratings are viewable by everyone" ON public.user_ratings FOR SELECT USING (true);
CREATE POLICY "Users can rate others" ON public.user_ratings FOR INSERT WITH CHECK (auth.uid() = from_id AND auth.uid() != to_id);
CREATE POLICY "Users can update their own ratings" ON public.user_ratings FOR UPDATE USING (auth.uid() = from_id);
