-- Live radio chat: shared messages for the expanded player sheet.
-- After applying: enable Replication for this table in the Supabase Dashboard if inserts do not broadcast (Database → Replication).

CREATE TABLE IF NOT EXISTS public.live_radio_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL DEFAULT 'gkp_radio_main',
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  body TEXT NOT NULL CHECK (char_length(body) > 0 AND char_length(body) <= 280),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS live_radio_messages_room_created_at
  ON public.live_radio_messages (room_id, created_at DESC);

ALTER TABLE public.live_radio_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "live_radio_messages_select_public"
  ON public.live_radio_messages FOR SELECT
  USING (true);

-- Applies to all DB roles; anon still cannot pass WITH CHECK (auth.uid() is null).
CREATE POLICY "live_radio_messages_insert_own_row"
  ON public.live_radio_messages FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.live_radio_messages;
