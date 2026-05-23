import type { CartItem } from '../contexts/CartContext';
import type { Product } from '../types/product';

const WORDPRESS_API_BASE_URL =
  process.env.EXPO_PUBLIC_WORDPRESS_API_BASE_URL ||
  'https://godkingdomprinciplesradio.com/apis/wp-json';

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
    image: api.image,
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
  const url = `${WORDPRESS_API_BASE_URL}/custom-api/v1/products`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Store products request failed (${response.status})`);
  }

  const data = (await response.json()) as ProductsApiResponse;

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

  const url = `${WORDPRESS_API_BASE_URL}/custom-api/v1/prepare-cart`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });

  if (!response.ok) {
    throw new Error(`Checkout request failed (${response.status})`);
  }

  const data = (await response.json()) as PrepareCartApiResponse;

  if (!data.success || !data.checkout_url) {
    throw new Error(data.message || 'Could not prepare checkout');
  }

  return data.checkout_url;
}

export function getStoreCategoryFilters(products: Product[]): string[] {
  const names = new Set<string>();
  for (const product of products) {
    if (product.category) names.add(product.category);
  }
  return ['All', ...Array.from(names).sort()];
}
