-- Migration 34: Database Rate Limiting
-- 1. Create a public.rate_limits table to track action timestamp buckets
-- 2. Create public.check_rate_limit() trigger function
-- 3. Attach BEFORE INSERT triggers to public.posts_raw, public.comments, and public.post_reactions

-- ============================================================================
-- 1. CREATE RATE LIMITS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    last_action_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    action_count INTEGER NOT NULL DEFAULT 1
);

-- Enable Row Level Security
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Revoke all direct public operations (only trigger functions running SECURITY DEFINER can modify)
REVOKE ALL ON public.rate_limits FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.rate_limits TO service_role;

-- ============================================================================
-- 2. CREATE RATE LIMIT CHECK FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_bucket_seconds INTEGER := 60; -- 1 minute window
    v_max_actions INTEGER := 10;    -- max 10 actions per minute
    v_limit_record RECORD;
BEGIN
    -- Only rate limit authenticated users (safety check, RLS already prevents anonymous writes)
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    -- Bypass rate limits for admin users
    IF public.is_admin_user() THEN
        RETURN NEW;
    END IF;

    -- Lock and select the rate limit entry to prevent race conditions
    SELECT last_action_at, action_count
      INTO v_limit_record
      FROM public.rate_limits
     WHERE user_id = auth.uid()
       FOR UPDATE;

    IF NOT FOUND THEN
        -- First action in the bucket
        INSERT INTO public.rate_limits (user_id, last_action_at, action_count)
        VALUES (auth.uid(), now(), 1);
    ELSE
        -- Entry exists, check if within the window
        IF v_limit_record.last_action_at > now() - (v_bucket_seconds || ' seconds')::interval THEN
            IF v_limit_record.action_count >= v_max_actions THEN
                RAISE EXCEPTION 'Rate limit exceeded: Please wait before posting again.'
                    USING ERRCODE = 'RLMT1'; -- Custom rate limit code
            ELSE
                UPDATE public.rate_limits
                   SET action_count = action_count + 1
                 WHERE user_id = auth.uid();
            END IF;
        ELSE
            -- Window expired, reset bucket
            UPDATE public.rate_limits
               SET last_action_at = now(),
                   action_count = 1
             WHERE user_id = auth.uid();
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Revoke execute from public
REVOKE ALL ON FUNCTION public.check_rate_limit() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit() TO authenticated, service_role;

-- ============================================================================
-- 3. CREATE TRIGGERS
-- ============================================================================

-- Rate limits for posts
DROP TRIGGER IF EXISTS trg_posts_rate_limit ON public.posts_raw;
CREATE TRIGGER trg_posts_rate_limit
    BEFORE INSERT ON public.posts_raw
    FOR EACH ROW
    EXECUTE FUNCTION public.check_rate_limit();

-- Rate limits for comments
DROP TRIGGER IF EXISTS trg_comments_rate_limit ON public.comments;
CREATE TRIGGER trg_comments_rate_limit
    BEFORE INSERT ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.check_rate_limit();

-- Rate limits for reactions
DROP TRIGGER IF EXISTS trg_reactions_rate_limit ON public.post_reactions;
CREATE TRIGGER trg_reactions_rate_limit
    BEFORE INSERT ON public.post_reactions
    FOR EACH ROW
    EXECUTE FUNCTION public.check_rate_limit();
