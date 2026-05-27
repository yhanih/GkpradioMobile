# VPS WordPress API recovery checklist

**Incident:** Mobile and web clients call `https://godkingdomprinciplesradio.com/apis/wp-json/...` but receive the React SPA (`index.html`, 1463 bytes) instead of JSON.

**Root cause (confirmed):** Active docroot `/var/www/vhosts/godkingdomprinciplesradio.com/httpdocs` has React `index.html` and partial WordPress files but **no active `/apis/` mount** and **no `index.php`**. Last known-good WP under `/apis` is in `httpdocs_backup/apis`.

**Mobile contract:** All store/media/radio WP URLs assume base `https://godkingdomprinciplesradio.com/apis/wp-json` unless overridden by `EXPO_PUBLIC_*` env vars.

**Status (2026-05-27):** API routing restored; `home` / `siteurl` set to `https://godkingdomprinciplesradio.com/apis`; checkout and `/apis/shop/` verified. Root `/` still React SPA. Optional: re-upload product image `2026/02/GTA-...png` (file missing on disk).

---

## Phase 0 — Freeze and snapshot

- [ ] Pause GitHub Actions / deploy scripts that copy Vite `dist` into `httpdocs`.
- [ ] Snapshot current state:
  ```bash
  BACKUP_TAG="pre-wp-recovery-$(date +%Y%m%d-%H%M)"
  sudo cp -a /var/www/vhosts/godkingdomprinciplesradio.com/httpdocs \
    "/var/www/vhosts/godkingdomprinciplesradio.com/${BACKUP_TAG}-httpdocs"
  ```
- [ ] Confirm backup WP tree exists:
  ```bash
  ls -la /var/www/vhosts/godkingdomprinciplesradio.com/httpdocs_backup/apis/
  test -f /var/www/vhosts/godkingdomprinciplesradio.com/httpdocs_backup/apis/index.php && echo "backup index.php OK"
  ```

---

## Phase 1 — Validate backup (before touching production routing)

Run from VPS (replace paths if different):

```bash
BACKUP_APIS="/var/www/vhosts/godkingdomprinciplesradio.com/httpdocs_backup/apis"
# Optional: PHP CLI smoke test if wp-cli available
# wp --path="$BACKUP_APIS" rest route list | grep custom-api
```

**External acceptance (after nginx points to backup or temp vhost):**

| Check | Command | Pass criteria |
|-------|---------|---------------|
| Not SPA | `curl -sI 'https://godkingdomprinciplesradio.com/apis/wp-json/custom-api/v1/products' \| grep -i content-type` | **Not** `text/html` |
| Products JSON | `curl -s 'https://godkingdomprinciplesradio.com/apis/wp-json/custom-api/v1/products' \| head -c 200` | Starts with `{`, contains `"success"` |
| Prepare cart route exists | `curl -sI -X OPTIONS 'https://godkingdomprinciplesradio.com/apis/wp-json/custom-api/v1/prepare-cart'` | Not HTML shell |
| Radio status | `curl -s 'https://godkingdomprinciplesradio.com/apis/wp-json/custom-api/v1/radio-status' \| head -c 200` | JSON, not `<!DOCTYPE` |
| WP index | `curl -sI 'https://godkingdomprinciplesradio.com/apis/wp-json' \| grep -i content-type` | `application/json` (route index) |
| Root wp-json (if needed) | `curl -sI 'https://godkingdomprinciplesradio.com/wp-json'` | JSON or 404 JSON — **not** 1463-byte HTML |

**HTML detection (mirrors mobile `merch.ts`):**

```bash
BODY=$(curl -s 'https://godkingdomprinciplesradio.com/apis/wp-json/custom-api/v1/products')
if echo "$BODY" | grep -qE '^<!DOCTYPE|^<html'; then
  echo "FAIL: SPA HTML returned"
  exit 1
fi
echo "PASS: body is not SPA HTML"
```

---

## Phase 2 — Restore recommended layout (Option A: restore `/apis`)

Goal: React at `/`, WordPress at `/apis/` (subdirectory install), matching mobile defaults.

- [ ] Restore `/apis` from backup into active docroot:
  ```bash
  DOCROOT="/var/www/vhosts/godkingdomprinciplesradio.com/httpdocs"
  sudo rsync -a \
    /var/www/vhosts/godkingdomprinciplesradio.com/httpdocs_backup/apis/ \
    "${DOCROOT}/apis/"
  ```
- [ ] Verify WordPress front controller:
  ```bash
  test -f "${DOCROOT}/apis/index.php" && test -f "${DOCROOT}/apis/wp-config.php"
  ```
- [ ] Ensure React SPA remains at `/` (`index.html` for marketing app) **without** deleting `${DOCROOT}/apis/`.
- [ ] Review Plesk vhost includes:
  - `/var/www/vhosts/system/godkingdomprinciplesradio.com/conf/vhost_nginx.conf`
  - `/etc/nginx/plesk.conf.d/vhosts/godkingdomprinciplesradio.com.conf`
- [ ] Nginx must **not** serve `location /apis` from `try_files /index.html`. Typical pattern:
  - `/apis` → PHP-FPM with `root`/`alias` pointing at `${DOCROOT}/apis`
  - `/` → SPA `try_files $uri $uri/ /index.html` **only outside** `/apis`
- [ ] Reload nginx after config change:
  ```bash
  sudo nginx -t && sudo systemctl reload nginx
  ```
- [ ] Re-run **Phase 1** external acceptance table.

**Note:** `/etc/nginx/sites-enabled/gkpradio.conf` is inactive if not included from `nginx.conf` — do not assume it applies; edit Plesk-managed vhost.

---

## Phase 2b — WordPress site URL (required for shop checkout & images)

The products API can work while **checkout and `/shop` still fail** if WordPress `siteurl` / `home` point at the domain root (React SPA) instead of the `/apis` install.

**Symptoms:**

- `prepare-cart` returns `https://godkingdomprinciplesradio.com/?gkp_cart=…` → opens React, not WooCommerce
- `/shop`, `/checkout`, `/wp-content/uploads/…` at **root** return SPA HTML (1463 bytes)
- `/apis/?gkp_cart=…` hits PHP but redirects to root `/shop/` or `/checkout/` (still SPA)

**Fix on VPS (wp-cli or DB):**

```bash
# Example — confirm paths match your install before running
wp option update home 'https://godkingdomprinciplesradio.com/apis' --path=/var/www/vhosts/godkingdomprinciplesradio.com/httpdocs/apis
wp option update siteurl 'https://godkingdomprinciplesradio.com/apis' --path=/var/www/vhosts/godkingdomprinciplesradio.com/httpdocs/apis
```

**Acceptance after siteurl fix:**

```bash
curl -sI 'https://godkingdomprinciplesradio.com/apis/shop/' | grep -i content-type   # not SPA-only html from root
curl -sI 'https://godkingdomprinciplesradio.com/apis/wp-content/uploads/' | head -3    # uploads routable
# prepare-cart should return checkout_url under /apis/ or WC checkout, not root /?gkp_cart only
```

Optional nginx: proxy root `/shop`, `/checkout`, `/cart`, `/wp-content` to the `/apis` WordPress tree if you must keep `siteurl` at root for legacy links.

### If mobile still receives HTML for `/apis/wp-json/...` (curl OK, phone not)

Some clients may hit a `location /apis` `try_files` → SPA rule before the `wp-json` PHP block. Ensure nginx has a **prefix or exact match** for `^~ /apis/wp-json/` that always reaches `index.php` (higher priority than generic `/apis` static).

**Phone sanity check:** open in Safari on the device:

`https://godkingdomprinciplesradio.com/apis/wp-json/custom-api/v1/products`

- JSON → mobile network/DNS OK; reload Expo with `npx expo start -c`
- HTML → device DNS, proxy, or nginx path order; fix server or use cellular / change DNS (8.8.8.8)

---

## Phase 3 — Theme / route registration sanity check

Routes are registered in active theme (per audit):

`httpdocs/wp-content/themes/headless/functions.php`

- [ ] `custom-api/v1/products`
- [ ] `custom-api/v1/prepare-cart`
- [ ] `custom-api/v1/radio-status` (and related)
- [ ] CPT REST: `podcasts`, `videos`

If JSON works from backup `/apis` but not after merge, compare `wp-content/themes` between backup and active `httpdocs`.

---

## Phase 4 — Deploy pipeline guardrails

- [ ] Update CI/deploy so `dist/` copy **never removes** `${DOCROOT}/apis/` or `index.php` under `/apis`.
- [ ] Prefer deploying React to `httpdocs_react` or separate subdomain if SPA and WP must stay isolated.
- [ ] Document canonical layout in VPS repo README:
  - `/` → React static
  - `/apis/` → WordPress
  - Express (if any) → `/api/` on Node/PM2 — **not** used by mobile app today

---

## Phase 5 — Post-recovery mobile verification (no code required)

Ask mobile tester or run against production:

| Feature | Expected |
|---------|----------|
| Ministry Store | Product grid loads |
| Add to cart → Checkout | Safari/browser opens WooCommerce checkout URL |
| Home merch spotlight | 0–3 products (silent fail if still broken) |
| Live radio | Metadata updates; audio plays |
| Media tab | Podcasts/videos (Supabase and/or WP) |

---

## Phase 6 — Optional hardening (later)

- [ ] Dedicated host `api.godkingdomprinciplesradio.com` → WordPress only
- [ ] Update EAS secrets: `EXPO_PUBLIC_WORDPRESS_API_BASE_URL`, optional full `EXPO_PUBLIC_STORE_*_URL`
- [ ] Rotate any credentials exposed in `/srv/gkpradio` git remote or server `.env` files

---

## Rollback

If recovery fails:

```bash
# Restore pre-recovery httpdocs snapshot from Phase 0
sudo rsync -a "/var/www/vhosts/godkingdomprinciplesradio.com/${BACKUP_TAG}-httpdocs/" \
  /var/www/vhosts/godkingdomprinciplesradio.com/httpdocs/
sudo nginx -t && sudo systemctl reload nginx
```

---

## Sign-off

| Role | Name | Date | Products API returns JSON |
|------|------|------|---------------------------|
| VPS | | | ☐ |
| Mobile | | | ☐ |
