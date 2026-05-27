# VPS prompt: Fix Ministry Store checkout & WordPress URLs

**Resolved 2026-05-27:** `home` / `siteurl` → `https://godkingdomprinciplesradio.com/apis`; `prepare-cart` returns `/apis/?gkp_cart=…`; checkout chain reaches WooCommerce HTML. Nginx redirects added for root `/shop`, `/checkout`, `/wp-content`.

---

## Historical prompt (for reference)

Copy everything below the line into your VPS / infrastructure agent or ticket.

---

## Task

Fix the **GKP Radio Ministry Store** on production so WooCommerce checkout, shop pages, and media URLs work with WordPress installed under **`/apis`**, while the React marketing app remains at the domain root **`/`**.

**Do not break:** `/apis/wp-json` REST API (already restored and returning JSON).  
**Do not revert:** nginx rules that route `/apis/wp-json/*` to PHP/WordPress.

---

## Background

- **Mobile app** (separate repo) calls:
  - `GET https://godkingdomprinciplesradio.com/apis/wp-json/custom-api/v1/products`
  - `POST https://godkingdomprinciplesradio.com/apis/wp-json/custom-api/v1/prepare-cart`
- **VPS already fixed:** `/apis/` WordPress tree restored from `httpdocs_backup/apis`, nginx dispatches `/apis/wp-json` to PHP. Products API returns valid JSON.
- **Still broken:** WordPress `siteurl` / `home` appear to point at `https://godkingdomprinciplesradio.com` (root), not `https://godkingdomprinciplesradio.com/apis`.

### Observed behavior (verified via curl)

| URL | Current behavior | Expected |
|-----|------------------|----------|
| `/apis/wp-json/custom-api/v1/products` | JSON OK | Keep working |
| `/apis/wp-json/custom-api/v1/prepare-cart` | Returns `checkout_url`: `https://godkingdomprinciplesradio.com/?gkp_cart=TOKEN` | URL under `/apis/` or WC checkout under `/apis/` |
| `/?gkp_cart=TOKEN` (root) | React SPA HTML (1463 bytes) | N/A — should not be primary checkout entry |
| `/apis/?gkp_cart=TOKEN` | PHP 302 → `https://godkingdomprinciplesradio.com/shop/` (root) | Should stay under `/apis/` (e.g. `/apis/checkout/`) |
| `/shop`, `/checkout` (root) | React SPA HTML | WooCommerce pages OR redirect to `/apis/...` |
| `/wp-content/uploads/...` (root) | React SPA HTML | Static/media from WordPress install |
| `/apis/shop/` | 301 → root `/shop/` (SPA) | WooCommerce shop at `/apis/shop/` |

**Root cause hypothesis:** WordPress/WooCommerce thinks the site lives at the domain root, but the active WP install and PHP bootstrap are under **`/var/www/vhosts/godkingdomprinciplesradio.com/httpdocs/apis/`**. Root `httpdocs` is React (`index.html`) without a working root `index.php`.

**Docroot layout:**

- Active: `/var/www/vhosts/godkingdomprinciplesradio.com/httpdocs` — React + partial WP files, **`/apis/`** subdirectory is the real WP install
- Backup (known-good API tree): `httpdocs_backup/apis`
- nginx: Plesk vhost `vhost_nginx.conf` (already patched for `/apis/wp-json`)

---

## Your responsibilities

1. **Confirm WordPress install path**  
   `wp-config.php` lives under `httpdocs/apis/` (or document correct path).

2. **Update WordPress `home` and `siteurl`** to the subdirectory install, e.g.:
   ```bash
   WP_PATH="/var/www/vhosts/godkingdomprinciplesradio.com/httpdocs/apis"
   wp option get home --path="$WP_PATH"
   wp option get siteurl --path="$WP_PATH"
   wp option update home 'https://godkingdomprinciplesradio.com/apis' --path="$WP_PATH"
   wp option update siteurl 'https://godkingdomprinciplesradio.com/apis' --path="$WP_PATH"
   ```
   If `wp-cli` is unavailable, update `wp_options` in the DB (`option_name` = `home` and `siteurl`). Use the **live** DB credentials from the active `wp-config.php` (already merged during API recovery).

3. **Verify `prepare-cart` checkout URLs**  
   After siteurl fix:
   ```bash
   curl -s -X POST 'https://godkingdomprinciplesradio.com/apis/wp-json/custom-api/v1/prepare-cart' \
     -H 'Content-Type: application/json' \
     -d '{"items":[{"product_id":92,"quantity":1,"variation_id":0,"variation":{}}]}'
   ```
   - Response must include `"success":true` and a `checkout_url` that hits **WordPress/WooCommerce**, not the React shell.
   - Opening that URL (or following redirects with cookies) must reach a real cart/checkout page.

4. **Fix media/upload URLs (if still broken)**  
   - Product API returns images like `https://godkingdomprinciplesradio.com/wp-content/uploads/...` (no `/apis` prefix).
   - Either:
     - **A)** siteurl fix makes WP emit `/apis/wp-content/...`, or  
     - **B)** nginx serves `/wp-content/` from the WP install under `/apis`, or  
     - **C)** confirm uploads exist on disk under `httpdocs/apis/wp-content/uploads/`.

5. **Optional nginx (only if siteurl alone is insufficient)**  
   Proxy or redirect root paths used by WooCommerce to the `/apis` install:
   - `/shop`, `/checkout`, `/cart`, `/my-account`
   - `/wp-content/` (uploads)  
   Do **not** break `/` → React `index.html` for the marketing app.

6. **Harden deploy pipeline**  
   Document or fix CI so future Vite/React deploys to `httpdocs` do **not** delete `httpdocs/apis/` or overwrite WordPress `index.php`.

7. **Register missing REST route (lower priority)**  
   `GET /apis/wp-json/custom-api/v1/radio-status` returns `404 rest_no_route`. Mobile falls back to AzuraCast; optional to add route in theme `headless/functions.php`.

---

## Acceptance criteria (all required)

```bash
# 1) Products API still JSON
curl -s 'https://godkingdomprinciplesradio.com/apis/wp-json/custom-api/v1/products' | head -c 80
# Must start with {"success":true

# 2) Root shop/checkout are NOT the React SPA only
curl -sI 'https://godkingdomprinciplesradio.com/apis/shop/' | grep -iE 'HTTP|content-type|location'
curl -sI 'https://godkingdomprinciplesradio.com/apis/checkout/' | grep -iE 'HTTP|content-type|location'
# Must NOT be 200 text/html with Content-Length: 1463 and Last-Modified matching React build only

# 3) prepare-cart checkout URL works
# (run POST above; open checkout_url in curl -L with cookies and confirm WC HTML or redirect chain ends at checkout, not marketing SPA)

# 4) Sample upload URL (adjust path from live product JSON)
curl -sI 'https://godkingdomprinciplesradio.com/apis/wp-content/uploads/2026/02/<filename>.png' | grep -i HTTP
# Prefer 200 image/*, not 404 and not SPA html
```

**Sign-off:** Reply with before/after values for `home`, `siteurl`, sample `checkout_url` from `prepare-cart`, and curl output for `/apis/shop/`.

---

## Out of scope

- Mobile app code changes (already adds URL rewrites as mitigation; **server fix is required** for reliable checkout).
- Moving WordPress back to docroot `/` (would break current `/apis/wp-json` mobile contract unless mobile env is updated everywhere).

## References

- Recovery checklist: `mobile/docs/VPS_WORDPRESS_RECOVERY_CHECKLIST.md` (Phase 2b) 
- Mobile endpoint inventory: `mobile/docs/MOBILE_ENDPOINT_INVENTORY.md`
- Backups from prior recovery: `pre-wp-recovery-20260527-180527-httpdocs`, `vhost_nginx.conf.pre-wp-recovery-*`

---
I love when a get 