import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Star, Package } from "@/lib/icons";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
  sizes?: string[];
  colors?: string[];
  rating: number;
  inStock: boolean;
}

// Sample product data - replace with actual data from API/database
const sampleProducts: Product[] = [
  {
    id: "1",
    name: "GKP Radio Classic T-Shirt",
    price: 25.99,
    category: "Apparel",
    image: "https://via.placeholder.com/300x400/4B5563/ffffff?text=T-Shirt",
    description: "Premium cotton t-shirt with GKP Radio logo",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Black", "White", "Navy"],
    rating: 4.5,
    inStock: true
  },
  {
    id: "2",
    name: "Faith & Music Hoodie",
    price: 45.99,
    category: "Apparel",
    image: "https://via.placeholder.com/300x400/1F2937/ffffff?text=Hoodie",
    description: "Comfortable hoodie perfect for any weather",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Gray", "Black"],
    rating: 4.8,
    inStock: true
  },
  {
    id: "3",
    name: "GKP Radio Mug",
    price: 14.99,
    category: "Accessories",
    image: "https://via.placeholder.com/300x400/ffffff/000000?text=Mug",
    description: "Ceramic mug with inspirational message",
    colors: ["White"],
    rating: 4.3,
    inStock: true
  },
  {
    id: "4",
    name: "Blessed Cap",
    price: 22.99,
    category: "Accessories",
    image: "https://via.placeholder.com/300x400/10B981/ffffff?text=Cap",
    description: "Adjustable cap with embroidered design",
    colors: ["Black", "Navy", "White"],
    rating: 4.6,
    inStock: true
  },
  {
    id: "5",
    name: "Prayer Journal",
    price: 18.99,
    category: "Books & Media",
    image: "https://via.placeholder.com/300x400/6366F1/ffffff?text=Journal",
    description: "Beautiful leather-bound prayer journal",
    colors: ["Brown", "Black"],
    rating: 4.9,
    inStock: true
  },
  {
    id: "6",
    name: "Gospel Music USB Collection",
    price: 29.99,
    category: "Books & Media",
    image: "https://via.placeholder.com/300x400/F59E0B/ffffff?text=USB",
    description: "Collection of uplifting gospel music",
    rating: 4.7,
    inStock: false
  }
];

const Merch = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [products] = useState<Product[]>(sampleProducts);

  const categories = ["All", "Apparel", "Accessories", "Books & Media"];

  const filteredProducts = selectedCategory === "All" 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "rating":
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < Math.floor(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">({rating})</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 mt-16">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">GKP Radio Merchandise</h1>
          <p className="text-lg text-muted-foreground">
            Show your support with our exclusive collection of faith-inspired merchandise
          </p>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className="font-medium"
                data-testid={`button-category-${category.toLowerCase().replace(/\s/g, '-')}`}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="ml-auto">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]" data-testid="select-sort">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured" data-testid="select-item-featured">Featured</SelectItem>
                <SelectItem value="price-low" data-testid="select-item-price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high" data-testid="select-item-price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating" data-testid="select-item-rating">Best Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedProducts.map((product) => (
            <Card 
              key={product.id} 
              className="overflow-hidden hover:shadow-lg transition-shadow duration-300"
              data-testid={`card-product-${product.id}`}
            >
              {/* Product Image */}
              <div className="relative aspect-[3/4] bg-gray-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  data-testid={`img-product-${product.id}`}
                />
                {!product.inStock && (
                  <Badge 
                    className="absolute top-2 right-2 bg-red-500 text-white"
                    data-testid={`badge-out-of-stock-${product.id}`}
                  >
                    Out of Stock
                  </Badge>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <Badge variant="outline" className="mb-2" data-testid={`badge-category-${product.id}`}>
                  {product.category}
                </Badge>
                
                <h3 className="font-semibold text-lg mb-2" data-testid={`text-product-name-${product.id}`}>
                  {product.name}
                </h3>
                
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid={`text-description-${product.id}`}>
                  {product.description}
                </p>

                {renderStars(product.rating)}

                <div className="flex items-center justify-between mt-4">
                  <span className="text-2xl font-bold" data-testid={`text-price-${product.id}`}>
                    ${product.price.toFixed(2)}
                  </span>
                  
                  <Button 
                    size="sm"
                    disabled={!product.inStock}
                    className="gap-2"
                    data-testid={`button-add-to-cart-${product.id}`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </Button>
                </div>

                {/* Size/Color Options (if applicable) */}
                {(product.sizes || product.colors) && (
                  <div className="mt-3 pt-3 border-t">
                    {product.sizes && (
                      <p className="text-xs text-muted-foreground" data-testid={`text-sizes-${product.id}`}>
                        Sizes: {product.sizes.join(", ")}
                      </p>
                    )}
                    {product.colors && (
                      <p className="text-xs text-muted-foreground" data-testid={`text-colors-${product.id}`}>
                        Colors: {product.colors.join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {sortedProducts.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">
              Try selecting a different category or check back later for new items.
            </p>
          </div>
        )}

        {/* Promotional Banner */}
        <div className="mt-16 p-8 bg-accent rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-3">Free Shipping on Orders Over $50!</h2>
          <p className="text-muted-foreground mb-4">
            Use code FAITH10 for 10% off your first order
          </p>
          <Button size="lg" className="font-medium" data-testid="button-shop-all">
            Shop All Products
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Merch;