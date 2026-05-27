import Constants from 'expo-constants';

const DEFAULT_DONATE_BASE = 'https://godkingdomprinciplesradio.com/donate';

/** Matches live DonationPage preset chips (godkingdomprinciplesradio.com/donate). */
export const DONATION_AMOUNTS = [25, 50, 100, 250, 500, 1000] as const;

export const DONATION_DEFAULT_AMOUNT = 50;

export const DONATION_AMOUNT_STORAGE_KEY = '@gkp_donation_selected_amount';

function getDonateBaseUrl(): string {
  const extra = Constants.expoConfig?.extra as { donateUrl?: string } | undefined;
  const fromEnv = process.env.EXPO_PUBLIC_DONATE_URL;
  const candidate = fromEnv?.trim() || extra?.donateUrl?.trim() || DEFAULT_DONATE_BASE;
  return candidate.replace(/\/$/, '');
}

/**
 * Build the website giving URL. The live site reads `?amount=` on first load.
 * `source=mobile` is reserved for a future website fix to prefer URL over session draft.
 */
export function buildDonationUrl(amount: number): string {
  const safeAmount = parseDonationAmount(amount, DONATION_DEFAULT_AMOUNT);
  const base = getDonateBaseUrl();
  const joiner = base.includes('?') ? '&' : '?';
  const params = new URLSearchParams({
    amount: String(safeAmount),
    source: 'mobile',
    mobile: '1',
  });
  return `${base}${joiner}${params.toString()}`;
}

export function parseDonationAmount(value: unknown, fallback = DONATION_DEFAULT_AMOUNT): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.round(parsed);
}

export function isPresetDonationAmount(amount: number): boolean {
  return (DONATION_AMOUNTS as readonly number[]).includes(amount);
}
