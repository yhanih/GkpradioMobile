import axios from 'axios';

const STORE_CLIENT_HEADERS = {
  Accept: 'application/json',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  'User-Agent': 'GKPRadio-Mobile/1.0.4',
} as const;

export interface StoreHttpResult {
  body: string;
  status: number;
  contentType: string;
  requestUrl: string;
  finalUrl: string;
}

function withCacheBuster(url: string): string {
  const parsed = new URL(url);
  parsed.searchParams.set('_cb', String(Date.now()));
  return parsed.toString();
}

function isJsonBody(body: string): boolean {
  const trimmed = body.trimStart();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
}

function logNonJsonResponse(
  label: string,
  requestUrl: string,
  finalUrl: string,
  status: number,
  contentType: string,
  body: string,
  redirected?: boolean,
): void {
  if (!__DEV__) return;
  console.warn(`[merch] ${label} non-JSON response`, {
    requestUrl,
    finalUrl,
    redirected,
    status,
    contentType,
    bodyLength: body.length,
    preview: body.trimStart().slice(0, 120),
  });
}

async function readViaFetch(
  url: string,
  init: RequestInit,
): Promise<StoreHttpResult> {
  const requestUrl = withCacheBuster(url);
  const response = await fetch(requestUrl, {
    ...init,
    cache: 'no-store',
    headers: {
      ...STORE_CLIENT_HEADERS,
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  const body = await response.text();
  return {
    body,
    status: response.status,
    contentType: response.headers.get('content-type') ?? '',
    requestUrl,
    finalUrl: response.url || requestUrl,
  };
}

async function readViaAxios(
  url: string,
  init: { method: 'GET' | 'POST'; body?: string },
): Promise<StoreHttpResult> {
  const requestUrl = withCacheBuster(url);
  const response = await axios.request<string>({
    url: requestUrl,
    method: init.method,
    data: init.body,
    headers: {
      ...STORE_CLIENT_HEADERS,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
    responseType: 'text',
    transformResponse: [(data) => data],
    validateStatus: () => true,
  });

  const body = typeof response.data === 'string' ? response.data : String(response.data ?? '');
  const finalUrl =
    (response.request?.responseURL as string | undefined) ||
    response.config.url ||
    requestUrl;

  return {
    body,
    status: response.status,
    contentType: String(response.headers['content-type'] ?? ''),
    requestUrl,
    finalUrl,
  };
}

/**
 * GET/POST store API with cache-bust.
 * Uses axios first (XHR stack on iOS — matches Safari). Falls back to fetch if needed.
 */
export async function storeHttpRequest(
  url: string,
  init: RequestInit = { method: 'GET' },
): Promise<StoreHttpResult> {
  const method = init.method === 'POST' ? 'POST' : 'GET';
  const bodyPayload =
    typeof init.body === 'string' ? init.body : undefined;

  let result: StoreHttpResult;

  try {
    result = await readViaAxios(url, { method, body: bodyPayload });
  } catch (error) {
    if (__DEV__) {
      console.warn('[merch] axios request failed, trying fetch', error);
    }
    result = await readViaFetch(url, init);
  }

  if (!isJsonBody(result.body)) {
    logNonJsonResponse('axios', result.requestUrl, result.finalUrl, result.status, result.contentType, result.body);
    const fallback = await readViaFetch(url, init);
    if (isJsonBody(fallback.body)) {
      result = fallback;
    }
  }

  if (!isJsonBody(result.body)) {
    logNonJsonResponse('final', result.requestUrl, result.finalUrl, result.status, result.contentType, result.body);
  }

  return result;
}
