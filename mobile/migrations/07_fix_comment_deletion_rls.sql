-- Fix Comment Deletion RLS Policies
-- This migration adds proper Row Level Security policies for communitycomments table
-- to allow users to delete their own comments

-- Enable Row Level Security on communitycomments if not already enabled
ALTER TABLE IF EXISTS public.communitycomments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.communitycomments;
DROP POLICY IF EXISTS "Anyone can view comments" ON public.communitycomments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.communitycomments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.communitycomments;

-- Create SELECT policy: Anyone can view comments
CREATE POLICY "Anyone can view comments"
    ON public.communitycomments FOR SELECT
    USING (true);

-- Create INSERT policy: Authenticated users can insert comments
CREATE POLICY "Authenticated users can insert comments"
    ON public.communitycomments FOR INSERT
    WITH CHECK (auth.uid() = userid);

-- Create UPDATE policy: Users can update their own comments
CREATE POLICY "Users can update their own comments"
    ON public.communitycomments FOR UPDATE
    USING (auth.uid() = userid)
    WITH CHECK (auth.uid() = userid);

-- Create DELETE policy: Users can delete their own comments
-- This is the critical policy that was missing!
CREATE POLICY "Users can delete their own comments"
    ON public.communitycomments FOR DELETE
    USING (auth.uid() = userid);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.communitycomments TO authenticated;
GRANT SELECT ON public.communitycomments TO anon;




