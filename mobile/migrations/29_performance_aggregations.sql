-- SQL Migration: performance_aggregations
-- Creates pre-aggregated database views to eliminate client-side JS counting and reduce network transfer payloads.

-- 1. View for post category counts
CREATE OR REPLACE VIEW public.post_category_counts AS
SELECT category, count(*)::integer as count
FROM public.posts
GROUP BY category;

-- 2. View for post comment counts
CREATE OR REPLACE VIEW public.post_comment_counts AS
SELECT post_id, count(*)::integer as comment_count
FROM public.comments
GROUP BY post_id;

-- 3. View for post reaction counts (likes and prayers)
CREATE OR REPLACE VIEW public.post_reaction_counts AS
SELECT 
  post_id,
  count(*) FILTER (WHERE reaction_type = 'like')::integer as like_count,
  count(*) FILTER (WHERE reaction_type = 'pray')::integer as prayer_count
FROM public.post_reactions
GROUP BY post_id;

-- Grant select access on views to anon and authenticated roles
GRANT SELECT ON public.post_category_counts TO anon, authenticated;
GRANT SELECT ON public.post_comment_counts TO anon, authenticated;
GRANT SELECT ON public.post_reaction_counts TO anon, authenticated;
