import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme, type Theme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import * as Haptics from 'expo-haptics';

interface PackageItem {
  id: string;
  name: string;
  price: string;
  duration: string;
  description: string;
  features: string[];
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  popular?: boolean;
}

const PACKAGES: PackageItem[] = [
  {
    id: 'starter',
    name: 'Faith Starter',
    price: '$99',
    duration: '/month',
    description: 'Perfect for small ministries and local businesses',
    features: [
      '5 sponsor mentions per day',
      'Featured in sponsor carousel',
      'Basic advertisement slots',
      'Community board listing',
      'Monthly performance report',
    ],
    color: '#10b981', // Emerald green
    icon: 'star',
  },
  {
    id: 'growth',
    name: 'Kingdom Growth',
    price: '$249',
    duration: '/month',
    description: 'Ideal for growing ministries and established businesses',
    features: [
      '15 sponsor mentions per day',
      'Premium carousel placement',
      'Video advertisement slots',
      'Featured community posts',
      'Weekly performance reports',
      'Live show mentions',
      'Social media promotion',
    ],
    color: '#d97706', // Gold/Amber
    icon: 'flash',
    popular: true,
  },
  {
    id: 'premium',
    name: 'Divine Premium',
    price: '$499',
    duration: '/month',
    description: 'Maximum exposure for ministries and enterprises',
    features: [
      'Unlimited sponsor mentions',
      'Priority carousel placement',
      'Custom video advertisements',
      'Dedicated show segments',
      'Daily performance reports',
      'Live interview opportunities',
      'Custom landing page',
      'Personal account manager',
      'Cross-platform promotion',
    ],
    color: '#8b5cf6', // Purple
    icon: 'ribbon',
  },
];

const EXPO_PUBLIC_API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://godkingdomprinciplesradio.com/api';

export function PromotionsScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Selected package for form
  const [selectedPkg, setSelectedPkg] = useState<PackageItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form State
  const [businessName, setBusinessName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [socialMediaLinks, setSocialMediaLinks] = useState('');
  const [ministryDescription, setMinistryDescription] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Prefill user data if logged in
  useEffect(() => {
    if (user) {
      setContactPerson(user.fullname || '');
      setContactEmail(user.email || '');
    }
  }, [user, isFormOpen]);

  const handleOpenForm = (pkg: PackageItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedPkg(pkg);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    if (!loading) {
      setIsFormOpen(false);
      setSelectedPkg(null);
      // Reset form fields
      setBusinessName('');
      setContactPerson(user?.fullname || '');
      setContactEmail(user?.email || '');
      setPhone('');
      setWebsiteUrl('');
      setSocialMediaLinks('');
      setMinistryDescription('');
      setMessage('');
    }
  };

  const handleSubmit = async () => {
    if (!selectedPkg) return;

    if (
      !businessName.trim() ||
      !contactPerson.trim() ||
      !contactEmail.trim() ||
      !ministryDescription.trim()
    ) {
      Alert.alert('Required Fields', 'Please fill in all required fields marked with *');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const response = await fetch(`${EXPO_PUBLIC_API_URL}/promotional-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName: businessName.trim(),
          contactPerson: contactPerson.trim(),
          contactEmail: contactEmail.trim(),
          phone: phone.trim() || null,
          websiteUrl: websiteUrl.trim() || null,
          socialMediaLinks: socialMediaLinks.trim() || null,
          ministryDescription: ministryDescription.trim(),
          message: message.trim() || null,
          packageType: selectedPkg.name,
          packagePrice: selectedPkg.price,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit order');
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Application Submitted!',
        "We'll review your application and contact you within 24-48 hours regarding your " +
          selectedPkg.name +
          ' package.',
        [{ text: 'OK', onPress: handleCloseForm }]
      );
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Submission Failed',
        error?.message || 'Something went wrong. Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={theme.colors.text} />
          </Pressable>
        )}
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Promotions</Text>
          <Text style={styles.headerSubtitle}>Advertising Sponsorships</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={styles.introCard}>
          <Text style={[styles.introTitle, { color: theme.colors.text }]}>
            Partner with GKP Radio
          </Text>
          <Text style={[styles.introDesc, { color: theme.colors.textSecondary }]}>
            Reach thousands of faithful listeners across our community. Sponsor our broadcasts to share your ministry, business, or message with our growing audience of believers.
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={[styles.statDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.statLabel}>2.5K+ Daily Listeners</Text>
            </View>
            <View style={styles.statBox}>
              <View style={[styles.statDot, { backgroundColor: '#d97706' }]} />
              <Text style={styles.statLabel}>24/7 Broadcasting</Text>
            </View>
          </View>
        </View>

        {/* Packages List */}
        <Text style={styles.sectionTitle}>Sponsorship Packages</Text>

        {PACKAGES.map((pkg) => (
          <View
            key={pkg.id}
            style={[
              styles.packageCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              pkg.popular && { borderColor: '#d97706', borderWidth: 2 },
            ]}
          >
            {pkg.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
              </View>
            )}

            {/* Card Header */}
            <View style={styles.packageCardHeader}>
              <View style={[styles.iconWrap, { backgroundColor: `${pkg.color}15` }]}>
                <Ionicons name={pkg.icon} size={24} color={pkg.color} />
              </View>
              <View style={styles.titleInfo}>
                <Text style={[styles.packageName, { color: theme.colors.text }]}>
                  {pkg.name}
                </Text>
                <Text style={[styles.packageDesc, { color: theme.colors.textSecondary }]}>
                  {pkg.description}
                </Text>
              </View>
            </View>

            {/* Price Box */}
            <View style={styles.priceRow}>
              <Text style={[styles.priceText, { color: theme.colors.text }]}>
                {pkg.price}
              </Text>
              <Text style={[styles.durationText, { color: theme.colors.textSecondary }]}>
                {pkg.duration}
              </Text>
            </View>

            {/* Features list */}
            <View style={styles.featuresList}>
              {pkg.features.map((feature, i) => (
                <View key={i} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={pkg.color} style={styles.checkIcon} />
                  <Text style={[styles.featureText, { color: theme.colors.text }]}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>

            {/* Choose button */}
            <Pressable
              style={({ pressed }) => [
                styles.chooseButton,
                { backgroundColor: pkg.popular ? '#d97706' : theme.colors.primary },
                pressed && { opacity: 0.9 },
              ]}
              onPress={() => handleOpenForm(pkg)}
            >
              <Text style={styles.chooseButtonText}>Choose {pkg.name}</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </Pressable>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Order Modal Form */}
      <Modal
        visible={isFormOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseForm}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Pressable onPress={handleCloseForm} style={styles.closeButton} disabled={loading}>
                <Ionicons name="close" size={28} color={theme.colors.text} />
              </Pressable>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={styles.modalTitle}>Submit Application</Text>
                {selectedPkg && (
                  <Text style={[styles.modalSubtitle, { color: selectedPkg.color }]}>
                    {selectedPkg.name} ({selectedPkg.price})
                  </Text>
                )}
              </View>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView
              style={styles.formScroll}
              contentContainerStyle={styles.formScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.formIntro, { color: theme.colors.textSecondary }]}>
                Please fill in your ministry or business details. We'll review your application and contact you within 24-48 hours.
              </Text>

              {/* Form Input fields */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                  Business/Ministry Name *
                </Text>
                <TextInput
                  style={[styles.textInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="Enter your business or ministry name"
                  placeholderTextColor={theme.colors.textMuted}
                  value={businessName}
                  onChangeText={setBusinessName}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                  Contact Person *
                </Text>
                <TextInput
                  style={[styles.textInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="Full name of primary contact"
                  placeholderTextColor={theme.colors.textMuted}
                  value={contactPerson}
                  onChangeText={setContactPerson}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                  Contact Email *
                </Text>
                <TextInput
                  style={[styles.textInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="your@email.com"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={contactEmail}
                  onChangeText={setContactEmail}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                  Phone Number
                </Text>
                <TextInput
                  style={[styles.textInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="(555) 123-4567"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                  Website URL
                </Text>
                <TextInput
                  style={[styles.textInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="https://www.yourwebsite.com"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="url"
                  autoCapitalize="none"
                  value={websiteUrl}
                  onChangeText={setWebsiteUrl}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                  Social Media Links
                </Text>
                <TextInput
                  style={[styles.textInput, styles.textArea, { color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="Facebook, Instagram, etc. (one per line)"
                  placeholderTextColor={theme.colors.textMuted}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                  value={socialMediaLinks}
                  onChangeText={setSocialMediaLinks}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                  Ministry/Business Description *
                </Text>
                <TextInput
                  style={[styles.textInput, styles.textArea, { color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="Describe your ministry or business and how it aligns with Kingdom principles..."
                  placeholderTextColor={theme.colors.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={ministryDescription}
                  onChangeText={setMinistryDescription}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                  Additional Message / Special Request
                </Text>
                <TextInput
                  style={[styles.textInput, styles.textArea, { color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="Any specific goals or questions regarding your sponsorship..."
                  placeholderTextColor={theme.colors.textMuted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  value={message}
                  onChangeText={setMessage}
                  editable={!loading}
                />
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Modal Footer */}
            <View style={[styles.modalFooter, { borderTopColor: theme.colors.border }]}>
              <Pressable
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <LinearGradient
                    colors={[theme.colors.primary, '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitGradient}
                  >
                    <Ionicons name="send" size={18} color="#fff" />
                    <Text style={styles.submitText}>Submit for Review</Text>
                  </LinearGradient>
                )}
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
      gap: 8,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    headerTitleGroup: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
    },
    headerSubtitle: {
      fontSize: 12,
      color: theme.colors.textMuted,
      marginTop: 1,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    introCard: {
      backgroundColor: theme.dark ? 'rgba(4, 120, 87, 0.05)' : '#f0fdf4',
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(4, 120, 87, 0.2)' : '#dcfce7',
      borderRadius: 20,
      padding: 20,
      marginBottom: 24,
    },
    introTitle: {
      fontSize: 19,
      fontWeight: '700',
      marginBottom: 8,
    },
    introDesc: {
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 16,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 16,
    },
    statBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 16,
    },
    packageCard: {
      borderRadius: 20,
      borderWidth: 1,
      padding: 20,
      marginBottom: 20,
      position: 'relative',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: theme.dark ? 0.2 : 0.04,
      shadowRadius: 10,
      elevation: 2,
    },
    popularBadge: {
      position: 'absolute',
      top: -12,
      left: 20,
      backgroundColor: '#d97706',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    popularBadgeText: {
      color: '#fff',
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    packageCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginBottom: 16,
    },
    iconWrap: {
      width: 46,
      height: 46,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    titleInfo: {
      flex: 1,
    },
    packageName: {
      fontSize: 18,
      fontWeight: '700',
    },
    packageDesc: {
      fontSize: 12,
      marginTop: 2,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: 16,
      backgroundColor: theme.colors.borderLight,
      padding: 12,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    priceText: {
      fontSize: 26,
      fontWeight: '800',
    },
    durationText: {
      fontSize: 14,
      marginLeft: 4,
      fontWeight: '600',
    },
    featuresList: {
      marginBottom: 20,
      gap: 10,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    checkIcon: {
      flexShrink: 0,
    },
    featureText: {
      fontSize: 13,
      lineHeight: 18,
      flex: 1,
    },
    chooseButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 14,
      gap: 8,
    },
    chooseButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
    },
    // Modal Styles
    modalContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    keyboardAvoid: {
      flex: 1,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    closeButton: {
      padding: 4,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.text,
    },
    modalSubtitle: {
      fontSize: 12,
      fontWeight: '600',
      marginTop: 2,
    },
    formScroll: {
      flex: 1,
    },
    formScrollContent: {
      padding: 20,
    },
    formIntro: {
      fontSize: 13,
      lineHeight: 18,
      marginBottom: 20,
    },
    inputGroup: {
      marginBottom: 18,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },
    textInput: {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      backgroundColor: theme.colors.borderLight,
    },
    textArea: {
      minHeight: 80,
    },
    modalFooter: {
      padding: 20,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    submitButton: {
      borderRadius: 14,
      overflow: 'hidden',
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 16,
    },
    submitText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#fff',
    },
  });
}
