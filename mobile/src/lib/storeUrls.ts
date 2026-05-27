/**
 * WordPress runs under /apis on production, but WooCommerce and media URLs are often
 * emitted for the domain root. Root paths currently serve the React SPA, not WP.
 */

const DEFAULT_SITE_HOST = 'godkingdomprinciplesradio.com';

function getWordPressInstallPrefix(): string {
  const base =
    process.env.EXPO_PUBLIC_WORDPRESS_API_BASE_URL ||
    'https://godkingdomprinciplesradio.com/apis/wp-json';
  try {
    const { origin, pathname } = new URL(base);
    const wpJsonIdx = pathname.indexOf('/wp-json');
    const installPath =
      wpJsonIdx >= 0 ? pathname.slice(0, wpJsonIdx) : '/apis';
    const normalized = installPath.replace(/\/$/, '') || '';
    return `${origin}${normalized}`;
  } catch {
    return `https://${DEFAULT_SITE_HOST}/apis`;
  }
}

function isSiteHost(hostname: string): boolean {
  return (
    hostname === DEFAULT_SITE_HOST ||
    hostname === `www.${DEFAULT_SITE_HOST}`
  );
}

/** Media URLs → under the WordPress install path (e.g. /apis/wp-content/...). */
export function normalizeStoreAssetUrl(url: string | undefined | null): string {
  const trimmed = url?.trim();
  if (!trimmed) return '';

  try {
    const parsed = new URL(trimmed);
    if (!isSiteHost(parsed.hostname)) return trimmed;

    const prefix = getWordPressInstallPrefix();
    const installPath = new URL(prefix).pathname.replace(/\/$/, '') || '/apis';

    if (
      parsed.pathname.startsWith('/wp-content/') &&
      !parsed.pathname.startsWith(`${installPath}/wp-content/`)
    ) {
      parsed.pathname = `${installPath}${parsed.pathname}`;
      return parsed.toString();
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}

/**
 * Checkout and shop handoff URLs → WordPress install root so PHP can set cart cookies.
 * WP may still redirect to root /checkout (SPA) until siteurl/home are fixed on the server.
 */
export function normalizeStoreCheckoutUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  try {
    const parsed = new URL(trimmed);
    if (!isSiteHost(parsed.hostname)) return trimmed;

    const installOrigin = getWordPressInstallPrefix();
    const installPath = new URL(installOrigin).pathname.replace(/\/$/, '') || '/apis';

    const gkpCart = parsed.searchParams.get('gkp_cart');
    if (gkpCart && (parsed.pathname === '/' || parsed.pathname === '')) {
      const target = new URL(installOrigin);
      target.searchParams.set('gkp_cart', gkpCart);
      return target.toString();
    }

    for (const segment of ['/checkout', '/shop', '/cart', '/my-account'] as const) {
      if (
        parsed.pathname === segment ||
        parsed.pathname.startsWith(`${segment}/`)
      ) {
        if (!parsed.pathname.startsWith(`${installPath}${segment}`)) {
          parsed.pathname = `${installPath}${parsed.pathname}`;
        }
        return parsed.toString();
      }
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}

/** Browser fallback when the in-app catalog API is unavailable. */
export function getStoreWebShopUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_MERCH_STORE_WEB_URL?.trim();
  if (fromEnv) {
    return normalizeStoreCheckoutUrl(fromEnv.replace(/\/$/, ''));
  }
  return `${getWordPressInstallPrefix()}/shop/`;
}
