import { Filter } from 'bad-words';

/** Shown when profanity / blocked harassment patterns are detected (posts, comments, live chat). */
export const UGC_FILTER_USER_MESSAGE =
  'This content does not meet our Community Guidelines. Remove profanity, harassment, or abusive language and try again.';

/** Extra phrases beyond the default lists (harassment / solicitation common in UGC apps). */
const EXTRA_BLOCKED: string[] = [
  'kill yourself',
  'kys',
  'onlyfans',
  'send nudes',
  'send nude',
];

/** Allow common theological wording; default lists include standalone "God"/"hell". */
const filter = new Filter({
  list: EXTRA_BLOCKED,
  exclude: ['God', 'god', 'hell'],
});

/**
 * Returns true when text should not be published (profanity / blocked patterns).
 * Uses the bad-words library (word-boundary matching) plus a small custom list.
 */
export function isCommunityTextBlocked(text: string): boolean {
  const raw = (text || '').trim();
  if (!raw) return false;
  if (filter.isProfane(raw)) return true;
  const compact = raw.toLowerCase().replace(/[\s_\-–—.]+/g, '');
  if (compact.length >= 4 && filter.isProfane(compact)) return true;
  return false;
}
