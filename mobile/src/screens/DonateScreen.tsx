import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../contexts/ThemeContext';
import { RootStackParamList } from '../types/navigation';
import { AnimatedButton } from '../components/AnimatedPressable';

type DonateScreenNavProp = NativeStackNavigationProp<RootStackParamList>;

const DONATION_AMOUNTS = [10, 25, 50, 100, 250];

export function DonateScreen() {
  const navigation = useNavigation<DonateScreenNavProp>();
  const { theme, isDark } = useTheme();
  const [selectedAmount, setSelectedAmount] = useState<number>(50);

  const handleAmountPress = (amount: number) => {
    Haptics.selectionAsync();
    setSelectedAmount(amount);
  };

  const handleDonatePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const donationUrl = `https://godkingdomprinciplesradio.com/donate?amount=${selectedAmount}`;

    Alert.alert(
      'Secure Online Giving',
      'In compliance with Apple App Store guidelines, charitable donations are processed securely outside the app through our official website browser gateway.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue in Browser',
          onPress: async () => {
            try {
              await Linking.openURL(donationUrl);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert('Error', 'Could not open secure browser. Please try again.');
            }
          },
        },
      ]
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

        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Support GKP Radio</Text>

        <View style={styles.headerButtonPlaceholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Inspirational Scripture Card */}
        <LinearGradient
          colors={isDark 
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

        {/* Support Statement */}
        <View style={styles.statementSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Your Support Matters</Text>
          <Text style={[styles.descriptionText, { color: theme.colors.textSecondary }]}>
            GKP Radio is dedicated to spreading the Gospel across the globe. Your generous contributions directly support digital broadcasting, sermon distribution, community outreach, and helping us keep the radio 100% free for everyone.
          </Text>
        </View>

        {/* Giving Pillars */}
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

        {/* Amount Selector */}
        <View style={styles.amountSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Select Amount</Text>
          <View style={styles.amountsGrid}>
            {DONATION_AMOUNTS.map((amount) => {
              const isSelected = selectedAmount === amount;
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
        </View>

        {/* Compliance Footer Info */}
        <View style={[styles.complianceInfo, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}>
          <Ionicons name="shield-checkmark" size={20} color={theme.colors.success} style={{ marginRight: 10 }} />
          <Text style={[styles.complianceText, { color: theme.colors.textSecondary }]}>
            Apple App Store Compliant: All contributions are processed safely and securely via Safari through our official website giving portal.
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
        <AnimatedButton
          variant="primary"
          style={styles.donateButton}
          onPress={handleDonatePress}
        >
          <View style={styles.donateButtonInner}>
            <Ionicons name="heart" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.donateButtonText}>
              Support GKP Radio with ${selectedAmount}
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
