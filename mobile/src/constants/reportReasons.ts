/** User-facing report categories (aligned with common in-app moderation flows). */
export const REPORT_REASONS = [
  {
    id: 'spam',
    label: 'Spam or misleading',
    description: 'Repetitive, fake engagement, or deceptive content',
  },
  {
    id: 'harassment',
    label: 'Harassment or bullying',
    description: 'Threats, targeted insults, or intimidation',
  },
  {
    id: 'hate',
    label: 'Hate or discrimination',
    description: 'Attacks on identity, slurs, or dehumanizing content',
  },
  {
    id: 'sexual',
    label: 'Sexual content or nudity',
    description: 'Unwanted sexual material or exploitation',
  },
  {
    id: 'violence',
    label: 'Violence or dangerous acts',
    description: 'Graphic violence, threats, or promotion of harm',
  },
  {
    id: 'self_harm',
    label: 'Self-harm or suicide',
    description: 'Content encouraging or depicting self-injury',
  },
  {
    id: 'scam',
    label: 'Scams or fraud',
    description: 'Financial scams, impersonation, or phishing',
  },
  {
    id: 'ip',
    label: 'Intellectual property',
    description: 'Copyright or trademark misuse',
  },
  {
    id: 'other',
    label: 'Something else',
    description: 'Does not fit the categories above',
  },
] as const;

export type ReportReasonId = (typeof REPORT_REASONS)[number]['id'];

export function getReportReasonMeta(id: string) {
  return REPORT_REASONS.find((r) => r.id === id) ?? REPORT_REASONS[REPORT_REASONS.length - 1];
}

/** Stored in `reports.reason` for moderator triage (category + optional free text). */
export function buildReportReason(categoryId: string, details: string): string {
  const meta = getReportReasonMeta(categoryId);
  const head = `category:${meta.id}\nlabel:${meta.label}`;
  const d = details.trim();
  if (!d) return head;
  return `${head}\n\n---\n${d}`;
}
