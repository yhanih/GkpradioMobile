/** Shown when the stream does not identify the performing artist (missing/unparsed metadata). */
export const UNRECOGNIZED_RADIO_ARTIST = 'Unrecognized Artist';

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
