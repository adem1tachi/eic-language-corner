-- Create user_ratings table
CREATE TABLE IF NOT EXISTS public.user_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    to_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(from_id, to_id)
);

-- Enable RLS
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;

-- Policies for user_ratings
CREATE POLICY "Ratings are viewable by everyone" ON public.user_ratings
    FOR SELECT USING (true);

CREATE POLICY "Users can rate others" ON public.user_ratings
    FOR INSERT WITH CHECK (auth.uid() = from_id AND auth.uid() != to_id);

CREATE POLICY "Users can update their own ratings" ON public.user_ratings
    FOR UPDATE USING (auth.uid() = from_id);

-- Explicitly allow everyone to see registrations count for attendance stats
-- (RLS on registrations is already SELECT USING true)
