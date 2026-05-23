#!/usr/bin/env node
/**
 * Creates (or updates) a dedicated email/password user for Apple App Review.
 * Run from repo:  cd mobile && node scripts/create-appstore-review-user.mjs
 *
 * Requires in mobile/.env (or env):
 *   EXPO_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (Dashboard → Project Settings → API)
 *
 * Optional args:
 *   --email=review@yourdomain.com   (default: appstore.review@godkingdomprinciplesradio.com)
 *   --password=YourSecurePass      (if omitted, a random one is generated and printed)
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadDotenv() {
  const p = join(__dirname, '..', '.env');
  if (!existsSync(p)) return;
  const raw = readFileSync(p, 'utf8');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

function parseArgs() {
  const out = { email: null, password: null };
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--email=')) out.email = a.slice('--email='.length);
    if (a.startsWith('--password=')) out.password = a.slice('--password='.length);
  }
  return out;
}

function genPassword() {
  const b = randomBytes(18).toString('base64url');
  return `GkP-${b}Aa1!`;
}

loadDotenv();

const { email: argEmail, password: argPassword } = parseArgs();
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email =
  argEmail || 'appstore.review@godkingdomprinciplesradio.com';
const password = argPassword || genPassword();

if (!url || !serviceKey) {
  console.error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Set them in mobile/.env and run again from the mobile folder.',
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const metadata = { full_name: 'App Store Review' };

const { data: created, error: createErr } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: metadata,
});

if (!createErr && created?.user) {
  console.log('\n--- App Store review account created ---\n');
} else if (
  createErr &&
  (createErr.message?.toLowerCase().includes('registered') ||
    createErr.message?.toLowerCase().includes('already') ||
    createErr.status === 422)
) {
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listErr) {
    console.error('Could not list users to update existing review account:', listErr.message);
    process.exit(1);
  }
  const u = list?.users?.find((x) => x.email?.toLowerCase() === email.toLowerCase());
  if (!u) {
    console.error('User exists but could not be found in list:', createErr.message);
    process.exit(1);
  }
  const { error: updErr } = await supabase.auth.admin.updateUserById(u.id, {
    password,
    user_metadata: metadata,
    email_confirm: true,
  });
  if (updErr) {
    console.error('Failed to update review user:', updErr.message);
    process.exit(1);
  }
  console.log('\n--- App Store review account updated (password reset) ---\n');
} else {
  console.error('createUser failed:', createErr?.message);
  process.exit(1);
}

console.log('User name (email):', email);
console.log('Password:         ', password);
console.log(`
Paste the email and password into App Store Connect →
App → App Store / TestFlight → App Review Information → Sign-in information.

Keep this account active for the full review period. Do not commit this password to git.
`);
