import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../contexts/ThemeContext';
import { useCart } from '../contexts/CartContext';
import { RootStackParamList } from '../types/navigation';
import { AnimatedButton } from '../components/AnimatedPressable';
import type { Product } from '../types/product';

type ProductDetailRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;
type ProductDetailNavProp = NativeStackNavigationProp<RootStackParamList>;

export function ProductDetailScreen() {
  const route = useRoute<ProductDetailRouteProp>();
  const navigation = useNavigation<ProductDetailNavProp>();
  const { theme } = useTheme();
  const { addToCart, cartCount, openCart } = useCart();
  const { product } = route.params as { product: Product };

  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined
  );
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    product.colors && product.colors.length > 0 ? product.colors[0] : undefined
  );
  const handleAddToCart = () => {
    if (!product.inStock) {
      Alert.alert('Out of Stock', 'This item is currently sold out.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      size: selectedSize,
      color: selectedColor,
      quantity: 1,
    });

    Alert.alert(
      'Added to Cart',
      `${product.name} has been added to your shopping cart.`,
      [
        { text: 'Continue Shopping', style: 'cancel' },
        {
          text: 'View Cart',
          onPress: () => {
            Haptics.selectionAsync();
            openCart();
          },
        },
      ]
    );
  };

  const renderStarRating = () => {
    return (
      <View style={styles.ratingRow}>
        {[...Array(5)].map((_, i) => (
          <Ionicons
            key={i}
            name={i < Math.floor(product.rating) ? 'star' : 'star-outline'}
            size={16}
            color="#eab308"
            style={{ marginRight: 2 }}
          />
        ))}
        <Text style={[styles.ratingText, { color: theme.colors.textSecondary }]}>
          ({product.rating.toFixed(1)})
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
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

        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Product Details</Text>

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
        {/* Large Product Image */}
        <View style={[styles.imageContainer, { backgroundColor: theme.colors.surface }]}>
          <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="cover" />
          {!product.inStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>SOLD OUT</Text>
            </View>
          )}
        </View>

        {/* Category & Title */}
        <View style={styles.detailsContainer}>
          <View style={styles.categoryRow}>
            <View style={[styles.categoryBadge, { backgroundColor: theme.colors.primaryLight }]}>
              <Text style={[styles.categoryText, { color: theme.colors.primary }]}>
                {product.category.toUpperCase()}
              </Text>
            </View>
            <View style={styles.stockBadge}>
              <Ionicons
                name={product.inStock ? 'checkmark-circle-outline' : 'close-circle-outline'}
                size={16}
                color={product.inStock ? theme.colors.success : theme.colors.error}
              />
              <Text style={[styles.stockText, { color: product.inStock ? theme.colors.success : theme.colors.error }]}>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </Text>
            </View>
          </View>

          <Text style={[styles.productName, { color: theme.colors.text }]}>{product.name}</Text>

          <View style={styles.priceRow}>
            <Text style={[styles.productPrice, { color: theme.colors.text }]}>
              ${product.price.toFixed(2)}
            </Text>
            {renderStarRating()}
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          {/* Description */}
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Description</Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {product.description}
          </Text>

          {/* Size Selector */}
          {product.sizes && product.sizes.length > 0 && (
            <View style={styles.optionSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Select Size</Text>
              <View style={styles.optionsRow}>
                {product.sizes.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <Pressable
                      key={size}
                      style={[
                        styles.sizeChip,
                        {
                          backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedSize(size);
                      }}
                    >
                      <Text style={[styles.sizeText, { color: isSelected ? '#fff' : theme.colors.text }]}>
                        {size}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Color Selector */}
          {product.colors && product.colors.length > 0 && (
            <View style={styles.optionSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Select Color</Text>
              <View style={styles.optionsRow}>
                {product.colors.map((color) => {
                  const isSelected = selectedColor === color;
                  // Map color names to hex codes for UI display
                  let colorCode = '#e4e4e7';
                  if (color.toLowerCase() === 'black') colorCode = '#18181b';
                  else if (color.toLowerCase() === 'white') colorCode = '#ffffff';
                  else if (color.toLowerCase() === 'navy') colorCode = '#1e3a8a';
                  else if (color.toLowerCase() === 'gray') colorCode = '#71717a';
                  else if (color.toLowerCase() === 'brown') colorCode = '#78350f';
                  else if (color.toLowerCase() === 'green') colorCode = '#065f46';

                  return (
                    <Pressable
                      key={color}
                      style={[
                        styles.colorBorder,
                        {
                          borderColor: isSelected ? theme.colors.primary : 'transparent',
                        },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedColor(color);
                      }}
                    >
                      <View style={[styles.colorDot, { backgroundColor: colorCode, borderWidth: color.toLowerCase() === 'white' ? 1 : 0, borderColor: theme.colors.border }]} />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed bottom checkout button */}
      <View style={[styles.bottomBar, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
        <AnimatedButton
          variant="primary"
          style={styles.addToCartButton}
          onPress={handleAddToCart}
          disabled={!product.inStock}
        >
          <View style={styles.addToCartInner}>
            <Ionicons name="cart" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.addToCartText}>
              {product.inStock ? 'Add to Shopping Cart' : 'Currently Out of Stock'}
            </Text>
          </View>
        </AnimatedButton>
      </View>

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
    paddingBottom: 40,
  },
  imageContainer: {
    height: Dimensions.get('window').height * 0.4,
    width: '100%',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  detailsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
  },
  productName: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: '800',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  divider: {
    height: 1,
    marginVertical: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  optionSection: {
    marginBottom: 20,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  sizeChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 46,
    alignItems: 'center',
  },
  sizeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  colorBorder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  addToCartButton: {
    width: '100%',
  },
  addToCartInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
