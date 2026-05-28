/** Shown when the stream does not identify the performing artist (missing/unparsed metadata). */
export const UNRECOGNIZED_RADIO_ARTIST = 'Unrecognized Artist';

type SongMeta = { title?: string | null; text?: string | null; artist?: string | null };

/** AzuraCast often sends the display line in `text` when `title` is empty or generic. */
export function resolveRadioTrackTitle(song?: SongMeta | null, fallback = 'GKP Radio Live'): string {
  const rawTitle = String(song?.title ?? '').trim();
  if (rawTitle && !/^live\s*stream$/i.test(rawTitle)) {
    return rawTitle;
  }

  const text = String(song?.text ?? '').trim();
  if (text) {
    const parts = text.split(' - ').map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return parts[parts.length - 1];
    }
    return text;
  }

  return rawTitle || fallback;
}

const STATION_AS_ARTIST = new Set(
  ['gkp radio', 'god kingdom principles radio', 'gkpradio'].map((s) => s.toLowerCase()),
);

/** Track artist for UI / lock screen — never the station name. */
export function resolveRadioTrackArtist(raw?: string | null): string {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return UNRECOGNIZED_RADIO_ARTIST;
  if (STATION_AS_ARTIST.has(trimmed.toLowerCase())) return UNRECOGNIZED_RADIO_ARTIST;
  return trimmed;
}
