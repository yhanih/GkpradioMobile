# App Store resubmission roadmap (1.2 UGC + 2.1b)

Rejection: **May 13, 2026** — Guideline **1.2** (UGC) and **2.1(b)** (business model).  
Rejected build: **1.0 (12)**. Target: new iOS build from current `mobile/` (e.g. **1.0.4+**) with production DB + Connect metadata aligned.

Use this as a checklist. Do not resubmit until **Step 1** and **Step 2** are done.

---

## Overview

| Step | What | Owner | Done |
|------|------|-------|------|
| **1** | Production database (migrations + smoke test) | You / backend | ☐ |
| **2** | iOS production build (EAS) | You / dev | ☐ |
| **3** | App Store Connect (age rating, notes, demo account) | Account Holder / Admin | ☐ |
| **4** | Reply to Apple (1.2 + 2.1b) | Account Holder / Admin | ☐ |
| **5** | Resubmit for review | Account Holder / Admin | ☐ |
| **6** | Post-submit moderation ops (24h SLA) | Ministry / moderators | ☐ |

---

## Step 1 — Production database (do this first)

**Goal:** Reviewers and real users hit the same safety backend: terms acceptance, reports, blocks, moderation columns.

### 1.1 Confirm which migrations are already on production

In [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**, run:

```sql
-- Terms gate (required for Community modal)
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'terms_accepted_at';

-- Reports queue
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'reports'
) AS has_reports;

-- Blocks
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'blocked_users'
) AS has_blocked_users;

-- Report status column (moderation)
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'reports'
  AND column_name IN ('status', 'reviewed_at');
```

**Pass:** `terms_accepted_at` exists; `has_reports` and `has_blocked_users` are true; `status` exists on `reports`.

### 1.2 Apply missing migrations (in order)

From repo root, migrations live in `mobile/migrations/`. If production was bootstrapped early, run **only what’s missing** — do not re-run destructive scripts blindly.

**UGC / safety (run if tables/policies missing):**

| File | Purpose |
|------|---------|
| `01_ugc_safety.sql` (or `17_ugc_reports_blocked_users_moderation.sql` on greenfield) | `reports`, `blocked_users` |
| `10_reports_allow_post_target.sql` | Post/comment/user report targets |
| `16_reports_user_target_and_moderation.sql` | `status`, `reviewed_at`, admin policies |
| `18_reports_live_chat_message_and_admin_delete.sql` | Live chat reports |
| `25_profiles_terms_accepted.sql` | **`terms_accepted_at`** (required for in-app gate) |

**How to apply (pick one):**

- **Dashboard:** SQL Editor → paste each file’s contents → **Run** (one file at a time).
- **CLI** (if linked): `cd mobile && supabase db push` or run files via `supabase migration up` per your project setup.

After `25_profiles_terms_accepted.sql`:

```sql
COMMENT ON COLUMN public.profiles.terms_accepted_at IS
  'When the user accepted in-app Terms of Service & Community Guidelines (18+ UGC gate).';
```

### 1.3 Backfill existing users (optional but recommended)

Existing members who signed up before the gate should see the Community terms modal once:

```sql
-- Leave terms_accepted_at NULL for users who must re-accept in app.
-- OR, if you already collected consent elsewhere, set once:
-- UPDATE public.profiles SET terms_accepted_at = NOW() WHERE terms_accepted_at IS NULL;
```

Default: **leave NULL** so the app shows the gate (matches Apple’s “must agree to terms”).

### 1.4 Smoke test on production (15 minutes)

Use a **non-production test user** or a dedicated **App Review** account.

| # | Action | Expected |
|---|--------|----------|
| 1 | Sign in → open **Community** | If `terms_accepted_at` is null → **18+ / Terms modal** blocks feed actions |
| 2 | Accept terms | Modal closes; `profiles.terms_accepted_at` set (check in Table Editor) |
| 3 | Create post with profanity | Blocked with Community Guidelines message |
| 4 | ⋯ on someone else’s post → **Report** | Report row in `reports` with `status = pending` |
| 5 | ⋯ → **Block** | User’s posts disappear from your feed |
| 6 | ⋯ on **your** post → **Delete** | Post removed from feed |
| 7 | **Hub** → Community Safety → Report a Problem | Mail app opens to `helpdesk@gkpradio.com` |
| 8 | Live radio chat (if enabled) | Bad word blocked; ⋯ report/block works |

**Step 1 complete when:** All eight checks pass on the **same** Supabase project the production app uses (`app.config.js` / EAS `extra.supabaseUrl`).

### 1.5 Moderation ops (same day as Step 1)

- Log into **web-admin** → **Moderation Center** (`web-admin/src/pages/Community.tsx`).
- Confirm pending reports load.
- Agree internally: **reports reviewed within 24 hours** (Terms promise); assign who checks the queue daily.

---

## Step 2 — iOS production build

**Goal:** App Store receives a binary **newer than 1.0 (12)** that includes terms gate, filters, report/block/delete, and contact surfaces.

```bash
cd mobile
# Ensure EAS logged in: eas whoami
eas build --platform ios --profile production
```

After build completes:

1. App Store Connect → **TestFlight** or **App Store** tab → select new build.
2. Version/build number must be **higher** than rejected build 12.
3. Attach build to the version you’re resubmitting (e.g. 1.0.4).

**Step 2 complete when:** Build is **Processing** → **Ready to Submit** and linked to the app version.

---

## Step 3 — App Store Connect metadata

**Goal:** Age rating and reviewer instructions match the shipped app.

### 3.1 Age rating (required for 1.2)

1. App Store Connect → **GKP Radio** → **App Information** → **Age Rating** → **Edit**.
2. Declare **user-generated content** / social features honestly.
3. Target outcome: rating appropriate for **18+ community** (often **17+** or **18+** depending on questionnaire answers — do not under-rate UGC).

### 3.2 App Review Information

Fill in:

| Field | Content |
|-------|---------|
| **Sign-in required** | Yes (for Community) |
| **User name** | `[reviewer@email.com]` |
| **Password** | `[secure password]` |
| **Notes** | Paste block from section **Review Notes (1.2)** below |
| **Contact** | Name, phone, email for review team |

### 3.3 Privacy (if not already fixed)

See `mobile/docs/APPLE_REVIEW_RESUBMISSION.md` — ensure **App Privacy** does not claim “tracking” if you don’t use ATT.

---

## Step 4 — Reply in App Store Connect

In the **Resolution Center** thread for submission `d185b38a-9c11-4db6-94a5-c4ba757c6e34`, reply with **both** sections (do not only upload a new build).

### Review Notes (1.2) — paste into Notes + reply

```text
Guideline 1.2 — User-Generated Content

We updated the app to meet all UGC requirements:

• Age rating: Updated in App Store Connect to reflect mature community use (18+).
• Terms: Users confirm 18+ and agree to Terms & Community Guidelines at signup and before community access (stored as terms_accepted_at). Terms state zero tolerance for objectionable content. Anonymous posts hide display name but remain tied to accounts for moderation (disclosed in Terms and post UI).
• Filtering: Profanity/harassment checks block publishing on posts, comments, and live chat.
• Reporting: ⋯ menus on posts, comments, user profiles, and live chat; Hub → Community Safety → Report a Problem (helpdesk@gkpradio.com).
• Blocking: Removes abusive users’ content from the member’s feed immediately.
• Removal: Authors delete own posts/comments via ⋯ → Delete.
• Enforcement: Reports stored in Supabase; moderation team reviews within 24 hours; content removed and accounts suspended per Terms.

Test account and steps are in App Review Information.
```

### Guideline 2.1(b) — paste into reply

```text
Guideline 2.1(b) — Business model

1. Who uses paid features?
   GKP Radio listeners and ministry supporters. The app is free for all users.

2. Where do users purchase?
   • Ministry merch (physical goods): Browse in app; purchase completes on our website (WooCommerce) via in-app/Safari checkout — not via Apple IAP.
   • Donations: Amount selected in app; payment completes on godkingdomprinciplesradio.com/donate in an in-app browser — not via Apple IAP.

3. Previously purchased content accessed in the app?
   None. No digital subscriptions or IAP entitlements are unlocked in the app.

4. Paid content unlocked in-app without IAP?
   Nothing. Merch and donations always complete on our website. No StoreKit / In-App Purchase in the app.

5. Accounts
   Free email/password registration (Supabase). No fee to create an account.
```

**Step 4 complete when:** Reply is **sent** and visible in Resolution Center.

---

## Step 5 — Resubmit

1. Version uses **new build** from Step 2.
2. **Export Compliance** / encryption questions answered (app uses standard HTTPS only if applicable).
3. Click **Submit for Review**.

---

## Step 6 — Ongoing (after approval)

| Task | Frequency |
|------|-----------|
| Check web-admin Moderation Center | Daily |
| Resolve reports within 24h | Per report |
| Remove violating posts/comments/users | As needed |
| Keep `helpdesk@gkpradio.com` monitored | Always |

**Future improvement (optional):** One-click delete post/comment from web-admin report row (today: live chat only; posts/comments via Supabase or manual SQL).

---

## Quick reference — reviewer path

```
Sign in → Community → Accept 18+ Terms (if shown)
→ ⋯ on post → Report post | Block | (own post) Delete
→ Hub → Community Safety → Terms | Report a Problem
→ Donate / Merch → completes on website (mention in 2.1b only)
```

---

## Related docs

- `mobile/docs/APPLE_REVIEW_RESUBMISSION.md` — ATT / privacy (5.1.2) and streaming rights (5.2.3)
- `mobile/src/screens/TermsOfServiceScreen.tsx` — in-app legal copy
- `mobile/src/constants/contact.ts` — help desk email
