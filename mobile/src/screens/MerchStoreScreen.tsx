import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../contexts/ThemeContext';
import { useCart } from '../contexts/CartContext';
import { RootStackParamList } from '../types/navigation';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { fetchStoreProducts, getStoreCategoryFilters } from '../lib/merch';
import { openMerchStoreBrowser } from '../lib/openMerchStoreBrowser';
import type { Product } from '../types/product';

export type { Product };

type MerchStoreNavProp = NativeStackNavigationProp<RootStackParamList>;

export function MerchStoreScreen() {
  const navigation = useNavigation<MerchStoreNavProp>();
  const { theme } = useTheme();
  const { cartCount, addToCart, openCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [openingWebStore, setOpeningWebStore] = useState(false);

  const handleShopOnline = async () => {
    Haptics.selectionAsync();
    setOpeningWebStore(true);
    try {
      await openMerchStoreBrowser();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not open the ministry store website.';
      setError(message);
    } finally {
      setOpeningWebStore(false);
    }
  };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchStoreProducts();
      setProducts(list);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not load store products';
      setError(message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const categories = useMemo(
    () => getStoreCategoryFilters(products),
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleProductPress = (product: Product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('ProductDetail', { product });
  };

  const handleInstantAddToCart = (product: Product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const size = product.sizes ? product.sizes[0] : undefined;
    const color = product.colors ? product.colors[0] : undefined;
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      size,
      color,
      quantity: 1,
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.headerButton, { backgroundColor: theme.colors.surface }, pressed && styles.headerButtonPressed]}
          onPress={() => {
            Haptics.selectionAsync();
            navigation.goBack();
          }}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Ministry Store</Text>

        <Pressable
          style={({ pressed }) => [styles.headerButton, { backgroundColor: theme.colors.surface }, pressed && styles.headerButtonPressed]}
          onPress={() => {
            Haptics.selectionAsync();
            openCart();
          }}
          accessibilityLabel="Open shopping cart"
        >
          <Ionicons name="cart-outline" size={22} color={theme.colors.text} />
          {cartCount > 0 && (
            <View style={[styles.cartBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Ionicons name="search-outline" size={20} color={theme.colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search our collection..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            editable={!loading}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} style={styles.clearSearch}>
              <Ionicons name="close-circle" size={16} color={theme.colors.textMuted} />
            </Pressable>
          )}
        </View>

        <View style={[styles.promoBanner, { backgroundColor: theme.colors.primaryLight }]}>
          <View style={styles.promoTextContainer}>
            <Text style={[styles.promoTitle, { color: theme.colors.primary }]}>Support GKP Radio</Text>
            <Text style={[styles.promoSubtitle, { color: theme.colors.textSecondary }]}>
              Free Shipping on Orders Over $50!
            </Text>
          </View>
          <View style={[styles.promoBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.promoBadgeText}>10% OFF</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centeredState}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.stateText, { color: theme.colors.textSecondary }]}>
              Loading store…
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centeredState}>
            <Ionicons name="cloud-offline-outline" size={48} color={theme.colors.textMuted} />
            <Text style={[styles.stateTitle, { color: theme.colors.text }]}>Could not load store</Text>
            <Text style={[styles.stateText, { color: theme.colors.textMuted }]}>
              Our in-app catalog is temporarily unavailable. You can still browse and checkout on our website.
            </Text>
            <Pressable
              style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                Haptics.selectionAsync();
                void handleShopOnline();
              }}
              disabled={openingWebStore}
            >
              {openingWebStore ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.retryButtonText}>Shop on Website</Text>
              )}
            </Pressable>
            <Pressable
              style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
              onPress={() => {
                Haptics.selectionAsync();
                loadProducts();
              }}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>Try Again</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
            >
              {categories.map((category) => {
                const isSelected = selectedCategory === category;
                return (
                  <Pressable
                    key={category}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedCategory(category);
                    }}
                  >
                    <Text style={[styles.categoryChipText, { color: isSelected ? '#fff' : theme.colors.text }]}>
                      {category}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.productGrid}>
              {filteredProducts.map((product) => (
                <AnimatedPressable
                  key={product.id}
                  style={[styles.productCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                  onPress={() => handleProductPress(product)}
                >
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="cover" />
                    {!product.inStock && (
                      <View style={styles.outOfStockBadge}>
                        <Text style={styles.outOfStockText}>SOLD OUT</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.productInfo}>
                    <Text style={[styles.productCategory, { color: theme.colors.textMuted }]}>
                      {product.category.toUpperCase()}
                    </Text>
                    <Text style={[styles.productName, { color: theme.colors.text }]} numberOfLines={1}>
                      {product.name}
                    </Text>

                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={12} color="#eab308" />
                      <Text style={[styles.ratingText, { color: theme.colors.textSecondary }]}>
                        {product.rating.toFixed(1)}
                      </Text>
                    </View>

                    <View style={styles.productFooter}>
                      <Text style={[styles.productPrice, { color: theme.colors.text }]}>
                        ${product.price.toFixed(2)}
                      </Text>

                      {product.inStock ? (
                        <Pressable
                          style={({ pressed }) => [
                            styles.quickAddButton,
                            { backgroundColor: theme.colors.primaryLight },
                            pressed && styles.quickAddButtonPressed,
                          ]}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleInstantAddToCart(product);
                          }}
                          accessibilityLabel={`Add ${product.name} to cart`}
                        >
                          <Ionicons name="add" size={18} color={theme.colors.primary} />
                        </Pressable>
                      ) : (
                        <View style={styles.disabledAddButton}>
                          <Ionicons name="close" size={16} color={theme.colors.textMuted} />
                        </View>
                      )}
                    </View>
                  </View>
                </AnimatedPressable>
              ))}
            </View>

            {filteredProducts.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="gift-outline" size={48} color={theme.colors.textMuted} />
                <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>No products found</Text>
                <Text style={[styles.emptyStateSub, { color: theme.colors.textMuted }]}>
                  Try altering your search query or choosing another category.
                </Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerButtonPressed: {
    opacity: 0.7,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: 10,
    paddingVertical: 8,
  },
  clearSearch: {
    padding: 4,
  },
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  promoTextContainer: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  promoSubtitle: {
    fontSize: 12,
  },
  promoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  promoBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  categoriesContainer: {
    gap: 8,
    marginBottom: 20,
    paddingBottom: 4,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  productCard: {
    width: (Dimensions.get('window').width - 52) / 2,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  imageContainer: {
    height: 160,
    position: 'relative',
    backgroundColor: '#f4f4f5',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  outOfStockBadge: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  productInfo: {
    padding: 12,
  },
  productCategory: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  quickAddButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAddButtonPressed: {
    opacity: 0.7,
  },
  disabledAddButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f4f4f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSub: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 18,
  },
  centeredState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  stateTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  stateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
