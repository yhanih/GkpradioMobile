-- Idempotent: safe after original 11 (insert_authenticated) or updated 11 (insert_own_row).

DROP POLICY IF EXISTS "live_radio_messages_insert_authenticated" ON public.live_radio_messages;
DROP POLICY IF EXISTS "live_radio_messages_insert_own_row" ON public.live_radio_messages;

CREATE POLICY "live_radio_messages_insert_own_row"
  ON public.live_radio_messages FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid());
