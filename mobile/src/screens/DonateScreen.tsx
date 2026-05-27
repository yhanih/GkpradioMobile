import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '../contexts/ThemeContext';
import { RootStackParamList } from '../types/navigation';
import { AnimatedButton } from '../components/AnimatedPressable';
import {
  DONATION_AMOUNTS,
  DONATION_AMOUNT_STORAGE_KEY,
  DONATION_DEFAULT_AMOUNT,
  isPresetDonationAmount,
  parseDonationAmount,
} from '../lib/donation';
import { openDonationBrowser } from '../lib/openDonationBrowser';

type DonateScreenNavProp = NativeStackNavigationProp<RootStackParamList>;
type DonateRouteProp = RouteProp<RootStackParamList, 'Donate'>;

export function DonateScreen() {
  const navigation = useNavigation<DonateScreenNavProp>();
  const route = useRoute<DonateRouteProp>();
  const { theme, isDark } = useTheme();

  const userEditedRef = useRef(false);
  const [selectedAmount, setSelectedAmount] = useState(DONATION_DEFAULT_AMOUNT);
  const [customAmountText, setCustomAmountText] = useState('');
  const [hydrating, setHydrating] = useState(true);
  const [openingBrowser, setOpeningBrowser] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (userEditedRef.current) return;

        const fromRoute = route.params?.amount;
        const stored = await AsyncStorage.getItem(DONATION_AMOUNT_STORAGE_KEY);
        const resolved = parseDonationAmount(
          fromRoute ?? stored ?? DONATION_DEFAULT_AMOUNT,
          DONATION_DEFAULT_AMOUNT,
        );

        if (cancelled || userEditedRef.current) return;

        setSelectedAmount(resolved);
        setCustomAmountText(isPresetDonationAmount(resolved) ? '' : String(resolved));
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [route.params?.amount]);

  const activeAmount = useMemo(() => {
    const trimmed = customAmountText.trim().replace(/[^0-9.]/g, '');
    if (trimmed) {
      const custom = Number(trimmed);
      if (Number.isFinite(custom) && custom > 0) {
        return Math.round(custom);
      }
    }
    return selectedAmount;
  }, [customAmountText, selectedAmount]);

  const commitAmount = (amount: number) => {
    const resolved = parseDonationAmount(amount, DONATION_DEFAULT_AMOUNT);
    userEditedRef.current = true;
    setSelectedAmount(resolved);
    if (!isPresetDonationAmount(resolved)) {
      setCustomAmountText(String(resolved));
    }
    AsyncStorage.setItem(DONATION_AMOUNT_STORAGE_KEY, String(resolved)).catch(() => {});
    return resolved;
  };

  const handleAmountPress = (amount: number) => {
    Haptics.selectionAsync();
    commitAmount(amount);
    setCustomAmountText('');
  };

  const handleDonatePress = async () => {
    if (openingBrowser) return;

    const amount = commitAmount(activeAmount);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOpeningBrowser(true);

    try {
      await openDonationBrowser(amount);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert(
        'Could not open giving page',
        `We could not open the browser with your $${amount} gift. Please try again.`,
      );
    } finally {
      setOpeningBrowser(false);
    }
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

        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Support GKP Radio</Text>

        <View style={styles.headerButtonPlaceholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={
            isDark
              ? ['#065f46', '#047857', '#064e3b']
              : ['#047857', '#059669', '#0d9488']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.scriptureCard}
        >
          <Ionicons name="heart" size={32} color="#fff" style={styles.heartIcon} />
          <Text style={styles.scriptureText}>
            "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver."
          </Text>
          <Text style={styles.scriptureRef}>2 Corinthians 9:7</Text>
        </LinearGradient>

        <View style={styles.statementSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Your Support Matters</Text>
          <Text style={[styles.descriptionText, { color: theme.colors.textSecondary }]}>
            GKP Radio is dedicated to spreading the Gospel across the globe. Your generous contributions directly support digital broadcasting, sermon distribution, community outreach, and helping us keep the radio 100% free for everyone.
          </Text>
        </View>

        <View style={styles.pillarsGrid}>
          <View style={[styles.pillarCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={[styles.pillarIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
              <Ionicons name="radio" size={20} color={theme.colors.primary} />
            </View>
            <Text style={[styles.pillarTitle, { color: theme.colors.text }]}>Global Radio</Text>
            <Text style={[styles.pillarDesc, { color: theme.colors.textMuted }]}>Broadcasting faith worldwide 24/7</Text>
          </View>

          <View style={[styles.pillarCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={[styles.pillarIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
              <Ionicons name="people" size={20} color={theme.colors.primary} />
            </View>
            <Text style={[styles.pillarTitle, { color: theme.colors.text }]}>Community</Text>
            <Text style={[styles.pillarDesc, { color: theme.colors.textMuted }]}>Providing free prayer and support networks</Text>
          </View>
        </View>

        <View style={styles.amountSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Select Amount</Text>
          <Text style={[styles.amountHint, { color: theme.colors.textMuted }]}>
            Tap below to open our giving page with ${activeAmount} pre-selected. Sign in on the website with the same account you use in this app.
          </Text>
          {hydrating ? (
            <ActivityIndicator style={styles.amountLoader} color={theme.colors.primary} />
          ) : (
            <View style={styles.amountsGrid}>
              {DONATION_AMOUNTS.map((amount) => {
                const isSelected = !customAmountText.trim() && activeAmount === amount;
                return (
                  <Pressable
                    key={amount}
                    style={[
                      styles.amountChip,
                      {
                        backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                    onPress={() => handleAmountPress(amount)}
                  >
                    <Text style={[styles.amountText, { color: isSelected ? '#fff' : theme.colors.text }]}>
                      ${amount}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <Text style={[styles.customLabel, { color: theme.colors.textSecondary }]}>Or enter a custom amount</Text>
          <View
            style={[
              styles.customInputRow,
              {
                backgroundColor: theme.colors.surface,
                borderColor: customAmountText.trim() ? theme.colors.primary : theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.currencyPrefix, { color: theme.colors.textMuted }]}>$</Text>
            <TextInput
              style={[styles.customInput, { color: theme.colors.text }]}
              placeholder="Other amount"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="decimal-pad"
              value={customAmountText}
              onChangeText={(text) => {
                userEditedRef.current = true;
                setCustomAmountText(text.replace(/[^0-9.]/g, ''));
              }}
            />
          </View>
        </View>

        <View style={[styles.complianceInfo, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}>
          <Ionicons name="shield-checkmark" size={20} color={theme.colors.success} style={{ marginRight: 10 }} />
          <Text style={[styles.complianceText, { color: theme.colors.textSecondary }]}>
            Apple App Store Compliant: All contributions are processed safely and securely through our official website giving portal.
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
        <AnimatedButton
          variant="primary"
          style={styles.donateButton}
          onPress={handleDonatePress}
          disabled={openingBrowser || hydrating || activeAmount <= 0}
        >
          <View style={styles.donateButtonInner}>
            {openingBrowser ? (
              <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="heart" size={20} color="#fff" style={{ marginRight: 8 }} />
            )}
            <Text style={styles.donateButtonText}>
              {openingBrowser ? 'Opening…' : `Give $${activeAmount} in Browser`}
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
  },
  headerButtonPressed: {
    opacity: 0.7,
  },
  headerButtonPlaceholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  scriptureCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  heartIcon: {
    marginBottom: 12,
  },
  scriptureText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  scriptureRef: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 12,
  },
  statementSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
  },
  pillarsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  pillarCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  pillarIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  pillarTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  pillarDesc: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  amountSection: {
    marginBottom: 24,
  },
  amountHint: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  amountLoader: {
    marginVertical: 16,
  },
  amountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  amountChip: {
    flex: 1,
    minWidth: 50,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '700',
  },
  customLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 6,
  },
  customInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  complianceInfo: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 24,
  },
  complianceText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
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
  donateButton: {
    width: '100%',
  },
  donateButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
