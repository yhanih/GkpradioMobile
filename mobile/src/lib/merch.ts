import type { CartItem } from '../contexts/CartContext';
import type { Product } from '../types/product';
import { storeHttpRequest } from './storeHttp';
import { normalizeStoreAssetUrl, normalizeStoreCheckoutUrl } from './storeUrls';

const DEFAULT_WORDPRESS_API_BASE = 'https://godkingdomprinciplesradio.com/apis/wp-json';

/** Resolved at request time so Metro reload picks up .env changes. */
function getWordPressApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_WORDPRESS_API_BASE_URL?.trim();
  return fromEnv || DEFAULT_WORDPRESS_API_BASE;
}

export function getStoreProductsUrl(): string {
  const override = process.env.EXPO_PUBLIC_STORE_PRODUCTS_URL?.trim();
  if (override) return override;
  return `${getWordPressApiBaseUrl()}/custom-api/v1/products`;
}

function getStorePrepareCartUrl(): string {
  const override = process.env.EXPO_PUBLIC_STORE_PREPARE_CART_URL?.trim();
  if (override) return override;
  return `${getWordPressApiBaseUrl()}/custom-api/v1/prepare-cart`;
}

function parseStoreJson<T>(body: string, requestUrl: string, finalUrl: string): T {
  const trimmed = body.trimStart();

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(body) as T;
    } catch {
      throw new Error('Store API returned invalid JSON.');
    }
  }

  if (
    trimmed.startsWith('<!DOCTYPE') ||
    trimmed.startsWith('<html')
  ) {
    if (__DEV__) {
      console.warn('[merch] Expected JSON but received HTML.', {
        requestUrl,
        finalUrl,
        preview: trimmed.slice(0, 120),
      });
    }
    throw new Error(
      'Store catalog API is unavailable (server returned a web page instead of product data). Check DNS/network on this device or open the products URL in Safari.',
    );
  }

  throw new Error('Store API returned invalid JSON.');
}

export interface WcApiProduct {
  id: number;
  name: string;
  slug: string;
  type: string;
  price: number;
  regular_price: number;
  sale_price: number | null;
  on_sale: boolean;
  description: string;
  short_description: string;
  image: string;
  gallery: string[];
  categories: { id?: number; name?: string; slug?: string }[] | string[];
  attributes: Record<string, string[]>;
  variations: unknown[];
  in_stock: boolean;
  stock_quantity: number | null;
}

interface ProductsApiResponse {
  success: boolean;
  products?: WcApiProduct[];
  message?: string;
}

interface PrepareCartApiResponse {
  success: boolean;
  checkout_url?: string;
  expires_in?: number;
  message?: string;
}

const DEFAULT_RATING = 4.5;
const DEFAULT_CATEGORY = 'Merch';
const DEFAULT_PRODUCT_IMAGE =
  'https://godkingdomprinciplesradio.com/apis/wp-content/uploads/woocommerce-placeholder.webp';

function resolveProductImage(url: string | undefined | null): string {
  const normalized = normalizeStoreAssetUrl(url);
  return normalized.trim() || DEFAULT_PRODUCT_IMAGE;
}

function parseCategoryName(
  categories: WcApiProduct['categories']
): string {
  if (!categories?.length) return DEFAULT_CATEGORY;
  const first = categories[0];
  if (typeof first === 'string') return first;
  if (first && typeof first === 'object' && 'name' in first && first.name) {
    return String(first.name);
  }
  return DEFAULT_CATEGORY;
}

function attributeList(attributes: Record<string, string[]>, key: string): string[] | undefined {
  const values = attributes[key];
  if (!values?.length) return undefined;
  return values;
}

export function mapApiProductToProduct(api: WcApiProduct): Product {
  const price =
    api.on_sale && api.sale_price != null ? api.sale_price : api.price;

  return {
    id: String(api.id),
    name: api.name,
    price,
    regularPrice: api.regular_price,
    salePrice: api.sale_price,
    onSale: api.on_sale,
    category: parseCategoryName(api.categories),
    image: resolveProductImage(api.image),
    description: api.description || api.short_description || '',
    sizes: attributeList(api.attributes, 'Size'),
    colors: attributeList(api.attributes, 'Color'),
    rating: DEFAULT_RATING,
    inStock: api.in_stock,
    slug: api.slug,
    type: api.type,
  };
}

export async function fetchStoreProducts(): Promise<Product[]> {
  const url = getStoreProductsUrl();
  const { body, status, requestUrl, finalUrl } = await storeHttpRequest(url, { method: 'GET' });

  if (status < 200 || status >= 300) {
    throw new Error(`Store products request failed (${status})`);
  }

  const data = parseStoreJson<ProductsApiResponse>(body, requestUrl, finalUrl);

  if (!data.success || !Array.isArray(data.products)) {
    throw new Error(data.message || 'Could not load store products');
  }

  return data.products.map(mapApiProductToProduct);
}

function buildVariationPayload(item: CartItem): Record<string, string> {
  const variation: Record<string, string> = {};
  if (item.size) variation.Size = item.size;
  if (item.color) variation.Color = item.color;
  return variation;
}

export async function prepareStoreCheckout(cartItems: CartItem[]): Promise<string> {
  if (cartItems.length === 0) {
    throw new Error('Your cart is empty');
  }

  const items = cartItems.map((item) => {
    const productId = Number.parseInt(item.productId, 10);
    if (!Number.isFinite(productId)) {
      throw new Error(`Invalid product in cart: ${item.name}`);
    }
    return {
      product_id: productId,
      quantity: item.quantity,
      variation_id: 0,
      variation: buildVariationPayload(item),
    };
  });

  const url = getStorePrepareCartUrl();
  const { body, status, requestUrl, finalUrl } = await storeHttpRequest(url, {
    method: 'POST',
    body: JSON.stringify({ items }),
  });

  const data = parseStoreJson<
    PrepareCartApiResponse & { code?: string }
  >(body, requestUrl, finalUrl);

  if (status < 200 || status >= 300 || !data.success || !data.checkout_url) {
    const message =
      data.message ||
      (status === 400
        ? 'One or more items could not be added to checkout. Open the product and try again.'
        : `Checkout request failed (${status})`);
    throw new Error(message);
  }

  return normalizeStoreCheckoutUrl(data.checkout_url);
}

export function getStoreCategoryFilters(products: Product[]): string[] {
  const names = new Set<string>();
  for (const product of products) {
    if (product.category) names.add(product.category);
  }
  return ['All', ...Array.from(names).sort()];
}
