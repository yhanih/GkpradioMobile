-- Server-side UGC text gate (defense in depth; client still uses bad-words).
-- Rejects INSERT/UPDATE that match blocked patterns. Adjust lists in ugc_text_is_blocked only.

CREATE OR REPLACE FUNCTION public.ugc_normalize_for_filter(p_input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT regexp_replace(
    regexp_replace(lower(trim(COALESCE(p_input, ''))), '<[^>]*>', '', 'gi'),
    '\s+',
    ' ',
    'g'
  );
$$;

CREATE OR REPLACE FUNCTION public.ugc_text_is_blocked(p_input text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  t text;
  words text[] := ARRAY[
    'fuck','shit','bitch','cunt','cock','dick','pussy','asshole','bastard','slut','whore',
    'nigger','nigga','faggot','fag','fags','rape','nazi','retard','spic','chink','gook','kike',
    'coon','dyke','twat','jizz','cum','anal','porn','xxx','heil',
    'goddamn','goddamned','motherfucker','dipshit','dumbass','jackass','bullshit','dildo',
    'cocksucker','blowjob','handjob','meth','heroin','cocaine','crackhead','kys'
  ];
  phrases text[] := ARRAY[
    'kill\s+yourself',
    'send\s+nudes',
    'send\s+nude',
    'onlyfans',
    'f\s*u\s*c\s*k',
    'f\s*u\s*c\s*k\s+e\s*r'
  ];
  w text;
BEGIN
  t := public.ugc_normalize_for_filter(p_input);
  IF t = '' THEN
    RETURN false;
  END IF;

  FOREACH w IN ARRAY words
  LOOP
    IF t ~* ('\m' || w || '\M') THEN
      RETURN true;
    END IF;
  END LOOP;

  FOREACH w IN ARRAY phrases
  LOOP
    IF t ~* w THEN
      RETURN true;
    END IF;
  END LOOP;

  RETURN false;
END;
$$;

COMMENT ON FUNCTION public.ugc_text_is_blocked(text) IS
  'Profanity / harassment substring gate for user-visible text (word-boundary + phrases).';

CREATE OR REPLACE FUNCTION public.trg_posts_block_ugc()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.ugc_text_is_blocked(COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, '')) THEN
    RAISE EXCEPTION 'content violates community guidelines'
      USING ERRCODE = '23514',
            CONSTRAINT = 'posts_ugc_content';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS posts_enforce_ugc_text ON public.posts;
CREATE TRIGGER posts_enforce_ugc_text
BEFORE INSERT OR UPDATE OF title, content ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.trg_posts_block_ugc();

CREATE OR REPLACE FUNCTION public.trg_comments_block_ugc()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.ugc_text_is_blocked(COALESCE(NEW.content, '')) THEN
    RAISE EXCEPTION 'content violates community guidelines'
      USING ERRCODE = '23514',
            CONSTRAINT = 'comments_ugc_content';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS comments_enforce_ugc_text ON public.comments;
CREATE TRIGGER comments_enforce_ugc_text
BEFORE INSERT OR UPDATE OF content ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.trg_comments_block_ugc();

CREATE OR REPLACE FUNCTION public.trg_live_radio_messages_block_ugc()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.ugc_text_is_blocked(
    COALESCE(NEW.body, '') || ' ' || COALESCE(NEW.display_name, '')
  ) THEN
    RAISE EXCEPTION 'content violates community guidelines'
      USING ERRCODE = '23514',
            CONSTRAINT = 'live_radio_messages_ugc_content';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS live_radio_messages_enforce_ugc_text ON public.live_radio_messages;
CREATE TRIGGER live_radio_messages_enforce_ugc_text
BEFORE INSERT OR UPDATE OF body, display_name ON public.live_radio_messages
FOR EACH ROW
EXECUTE FUNCTION public.trg_live_radio_messages_block_ugc();
