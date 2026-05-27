-- Ensure INSERT on blocked_users is allowed under RLS (explicit WITH CHECK).
DROP POLICY IF EXISTS "Users can manage their own blocks" ON public.blocked_users;

CREATE POLICY "Users can manage their own blocks"
  ON public.blocked_users
  FOR ALL
  TO authenticated
  USING (auth.uid() = blocker_id)
  WITH CHECK (auth.uid() = blocker_id);
