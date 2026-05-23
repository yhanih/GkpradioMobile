export interface Product {
  id: string;
  name: string;
  price: number;
  regularPrice: number;
  salePrice: number | null;
  onSale: boolean;
  category: string;
  image: string;
  description: string;
  sizes?: string[];
  colors?: string[];
  rating: number;
  inStock: boolean;
  slug: string;
  type: string;
}
