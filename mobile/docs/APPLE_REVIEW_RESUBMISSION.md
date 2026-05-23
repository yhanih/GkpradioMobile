# Apple App Review — Resubmission (5.1.2(i) ATT / Privacy + 5.2.3 Third‑party content)

Use this after the **May 5, 2026** rejection for **GKP Radio** (`com.gkpradio.mobile`). Engineering updates in the repo are noted at the bottom; everything in App Store Connect must be done by an **Account Holder** or **Admin**.

---

## Part A — Guideline 5.1.2(i) (App Privacy vs. App Tracking Transparency)

### What Apple is comparing

Apple matched **App Privacy** answers (data collected **for tracking**) with the **binary** (no `AppTrackingTransparency` prompt). “Tracking” here means: linking data from your app with third‑party data for **advertising** or sharing with **data brokers** — not “we use email for login” or “photos for community posts.”

### Recommended fix (matches how this app is built)

This project does **not** integrate ad networks, data brokers, or cross‑app advertising SDKs. **Email** is for Supabase authentication; **photos** are for in‑app community features; **optional Sentry** is for crash diagnostics (configured without default PII). So the consistent fix is:

1. **Update App Privacy in App Store Connect** so you are **not** declaring that those data types are collected **for tracking**, unless you truly meet Apple’s definition of tracking.
2. **Do not** add a fake ATT prompt if you do not track — that can create new review issues.

#### Step‑by‑step in App Store Connect

1. [App Store Connect](https://appstoreconnect.apple.com) → **My Apps** → **GKP Radio** → **App Privacy** (left sidebar) → **Edit** (or **Get Started**).
2. Work through **Data Collection**. For each type Apple cited (**Email Address**, **Photos or Videos**, and anything under **Emails or Text Messages** if listed):
   - Confirm whether you **actually** collect it (Supabase auth = email; camera/photo library = images users choose to post).
   - For **each** collected type, set **purposes** to real uses only, e.g. **App Functionality** / **Analytics** (if applicable). **Uncheck** any purpose that implies **Third‑Party Advertising** or **Developer’s Advertising or Marketing** unless that is strictly true.
3. When the questionnaire asks whether data is used for **tracking** (linking with third‑party advertising data or data brokers), answer **No** if that is accurate for this app.
4. Save and ensure the **published** privacy answers match the build you submit.

#### Paste into **App Review Information → Notes** (5.1.2)

```text
Guideline 5.1.2(i) — ATT / Privacy

We do not track users across third-party apps and websites for advertising or data-broker purposes as defined by Apple. Email is used only for account authentication (Supabase). Photos/video access are used only for in-app community features initiated by the user. Optional crash reporting (Sentry) is for diagnostics only, not for tracking.

We have updated App Store Connect → App Privacy to remove any incorrect “tracking” declarations. No App Tracking Transparency prompt is shown because the app does not perform tracking as defined by Apple.
```

### If you intentionally add tracking later

Only then add `AppTrackingTransparency`, `NSUserTrackingUsageDescription`, and request authorization **before** any tracking-related collection; describe where the prompt appears in Review Notes.

---

## Part B — Guideline 5.2.3 (Third‑party audio/video streaming & catalogs)

Apple wants **documentary evidence** that the app is allowed to expose the streams, catalogs, and discovery surfaces reviewers see.

### Facts you can state (align with the shipped app)

- **Live radio** is served from infrastructure and APIs operated for **God Kingdom Principles Radio / GKP Radio** (e.g. AzuraCast “now playing” and listen URLs tied to your domains, not a scraped third‑party consumer catalog).
- **On‑demand media** and community metadata are delivered via **your** Supabase project and **your** WordPress/site endpoints — not an unauthorized mirror of a commercial streaming service.

### What to **attach** in App Store Connect

Upload **PDF** (letterhead optional) in **App Review Information** (attachments / notes as Apple allows), including:

1. **Who operates the service** — legal name of the organization or individual responsible for the app and the stream.
2. **Rights / control** — statement that the operator controls the **AzuraCast** (or other) installation, the **stream hostname(s)**, and the **musical/content** programming, or has licenses where required.
3. **Music performance rights (if you broadcast commercial or PRO‑repertoire music)** — copies of **performing rights organization** licenses or equivalent (e.g. ASCAP/BMI/SESAC in the US, or your territory’s PROs), or a clear statement that programming is fully licensed/original/licensed direct from rights holders. *If you do not have PRO coverage for the music you air, App Review may still reject on 5.2.3 or other guidelines — that is a business/legal gap, not something code can fix.*
4. **Screenshots or DNS/SSL** (optional but helpful) — show that `stream.godkingdomprinciplesradio.com` and `godkingdomprinciplesradio.com` are your production endpoints.

### Attestation letter (copy, edit placeholders, export to PDF)

```text
RE: App Store Review — Third-party content (Guideline 5.2.3)
App: GKP Radio (Bundle ID: com.gkpradio.mobile)

To Apple App Review,

We attest the following regarding audio/video streaming and discovery in our app:

1. Organization: [LEGAL ENTITY OR INDIVIDUAL NAME], operator of “God Kingdom Principles Radio” / “GKP Radio.”

2. Streaming stack: The live audio stream and “now playing” / queue metadata are provided from radio infrastructure and APIs we operate or contract for our own station (AzuraCast / station-specific endpoints). We do not provide unauthorized access to third-party subscription streaming catalogs (e.g. mirroring a commercial service’s catalog without permission).

3. On-demand and community content: Episodes, posts, and media URLs are published by us or our users within our app and backend ([briefly: Supabase + our WordPress site]). We respond to infringement reports per our Terms of Use / DMCA or applicable policy [link].

4. Music / performance rights: [CHOOSE ONE]
   (a) We hold performing rights licenses from [PRO NAMES / licensors] covering our broadcasts through [DATE RANGE]. Enclosed: [LICENSE PDFS].
   OR
   (b) Our programming consists solely of content for which we control all necessary rights (e.g. original/spoken-word/licensed direct agreements). Enclosed: [SUPPORTING AGREEMENTS].

Contact: [NAME], [EMAIL], [PHONE].

Signed: ______________________  Date: __________
```

#### Paste into **Review Notes** (5.2.3)

```text
Guideline 5.2.3 — Third-party streaming / rights

GKP Radio streams our own station and uses our WordPress + Supabase backends for catalogs and discovery. We attached a signed rights attestation and supporting documents (PRO/music licenses or direct agreements as applicable) in App Review Information. Test account (if needed): [fill in].
```

---

## Part C — After you change metadata / attach docs

1. Increment build in EAS (your `production` profile uses `autoIncrement` for iOS).
2. **App Store Connect** → new build → link to version **1.0** (or next version).
3. **Reply** to the existing rejection thread summarizing: privacy corrections + where evidence is attached.

---

## Engineering changes in this repository (this session)

- **`mobile/App.tsx`**: `Sentry.init` now sets `sendDefaultPii: false` so crash reporting does not send default personally identifying information unless you explicitly choose to later.

No `NSUserTrackingUsageDescription` or ATT flow was added, because the intended resolution is **accurate App Privacy declarations** for a non‑tracking app.
