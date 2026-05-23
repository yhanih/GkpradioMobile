-- Security hardening: notifications surface, RPC EXECUTE grants, search_path on helpers.
-- Aligns with Supabase security advisor (permissive RLS INSERT, anon EXECUTE on SECURITY DEFINER, mutable search_path).

-- ---------------------------------------------------------------------------
-- A) notifications: no direct client INSERT (rows come from SECURITY DEFINER triggers only)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Default Supabase grants give anon/authenticated full DML; tighten to least privilege.
REVOKE DELETE, INSERT, UPDATE ON public.notifications FROM anon;
REVOKE INSERT, DELETE ON public.notifications FROM authenticated;

GRANT SELECT ON public.notifications TO anon;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;

-- ---------------------------------------------------------------------------
-- B) Immutable search_path on SQL helper (advisor: function_search_path_mutable)
-- ---------------------------------------------------------------------------

ALTER FUNCTION public.get_edge_function_url(text) SET search_path = public, pg_catalog;

-- Trigger / RLS helpers: avoid mutable search_path when body touches public tables
DO $$
BEGIN
  IF to_regprocedure('public.handle_new_user()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_catalog';
  END IF;
END
$$;

ALTER FUNCTION public.is_admin_user() SET search_path = public, pg_catalog;

-- ---------------------------------------------------------------------------
-- C) RPC exposure: revoke from PUBLIC/anon; grant back only where required
-- ---------------------------------------------------------------------------
-- handle_new_user: auth trigger only — not callable via PostgREST.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- get_edge_function_url: internal helper for triggers — not a public RPC.
REVOKE ALL ON FUNCTION public.get_edge_function_url(text) FROM PUBLIC, anon, authenticated;

-- Trigger functions: invoking user must EXECUTE (PostgreSQL trigger rules).
REVOKE ALL ON FUNCTION public.notify_on_reaction() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.notify_on_reaction() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.notify_on_comment() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.notify_on_comment() TO authenticated, service_role;

-- is_admin_user: used in RLS; authenticated must EXECUTE. Never expose to anon.
REVOKE ALL ON FUNCTION public.is_admin_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated, service_role;

-- Utility sometimes left in public schema from experiments — not for API callers.
DO $$
BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated';
  END IF;
END
$$;
