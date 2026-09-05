import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const PURPLE = '#7C4DEE';
const PURPLE_LIGHT = '#9B6DFF';
const INK = '#33215E';
const INK_SOFT = '#6B6480';
const BORDER = '#EDE5FF';

interface PaywallProps {
  featureLabel?: string;
}

export default function Paywall({ featureLabel }: PaywallProps) {
  const [actionLoading, setActionLoading] = useState(false);

  const handleStartTrial = () => {
    Alert.alert(
      'Subscription setup coming next',
      'In-app purchases will be available soon. Thank you for your interest in NextSelf Premium!',
      [{ text: 'OK' }]
    );
  };

  const handleRestore = () => {
    setActionLoading(true);
    setTimeout(() => {
      setActionLoading(false);
      Alert.alert(
        'Subscription setup coming next',
        'Restore purchases will be available once in-app billing is configured.',
        [{ text: 'OK' }]
      );
    }, 600);
  };

  const features = [
    { icon: 'sparkles-outline' as const, text: 'Unlimited affirmations' },
    { icon: 'flag-outline' as const, text: 'Goal setting & progress tracking' },
    { icon: 'chatbubble-ellipses-outline' as const, text: 'AI Coach access' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#FFFFFF', '#F6F2FF', '#EDE5FF']}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroSection}>
            <View style={styles.heroIcon}>
              <LinearGradient
                colors={[PURPLE, PURPLE_LIGHT]}
                style={styles.heroIconGradient}
              >
                <Ionicons name="lock-closed" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.heroTitle}>Unlock Your Full NextSelf</Text>
            <Text style={styles.heroSubtitle}>
              {featureLabel
                ? `${featureLabel} is a Premium feature.`
                : 'Premium unlocks everything NextSelf has to offer.'}
            </Text>
          </View>

          <View style={styles.trialBanner}>
            <Ionicons name="gift-outline" size={20} color={PURPLE} />
            <Text style={styles.trialBannerText}>Try Premium free for 7 days</Text>
          </View>

          <View style={styles.featuresCard}>
            {features.map((feature, index) => (
              <View
                key={index}
                style={[
                  styles.featureRow,
                  index < features.length - 1 && styles.featureRowBorder,
                ]}
              >
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon} size={20} color={PURPLE} />
                </View>
                <Text style={styles.featureText}>{feature.text}</Text>
                <Ionicons name="checkmark-circle" size={20} color={PURPLE_LIGHT} />
              </View>
            ))}
          </View>

          <View style={styles.priceCard}>
            <Text style={styles.pricePrice}>$9.99</Text>
            <Text style={styles.pricePeriod}>per year</Text>
            <Text style={styles.priceTrial}>7 days free, then $9.99/year</Text>
          </View>

          <View style={styles.ctaSection}>
            <TouchableOpacity
              style={styles.trialButton}
              onPress={handleStartTrial}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[PURPLE, PURPLE_LIGHT]}
                style={styles.trialButtonGradient}
              >
                <Text style={styles.trialButtonText}>Start 7-Day Free Trial</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestore}
              disabled={actionLoading}
            >
              <Text style={styles.restoreButtonText}>
                {actionLoading ? 'Restoring...' : 'Restore Purchases'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.finePrint}>
            Subscription automatically renews annually unless auto-renew is turned
            off at least 24 hours before the end of the current period. You can
            manage or cancel your subscription in your App Store account settings.
          </Text>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 130,
    alignItems: 'center',
  },

  heroSection: {
    alignItems: 'center',
    paddingTop: 20,
    marginBottom: 24,
  },
  heroIcon: {
    marginBottom: 16,
  },
  heroIconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: INK,
    textAlign: 'center',
    lineHeight: 32,
  },
  heroSubtitle: {
    fontSize: 15,
    color: INK_SOFT,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
  },

  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4EEFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 24,
    gap: 8,
  },
  trialBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: PURPLE,
  },

  featuresCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  featureRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F4EEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: INK,
  },

  priceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 28,
  },
  pricePrice: {
    fontSize: 44,
    fontWeight: '700',
    color: PURPLE,
  },
  pricePeriod: {
    fontSize: 16,
    color: INK_SOFT,
    marginTop: 2,
  },
  priceTrial: {
    fontSize: 14,
    fontWeight: '600',
    color: PURPLE_LIGHT,
    marginTop: 12,
  },

  ctaSection: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  trialButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  trialButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  trialButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  restoreButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  restoreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: PURPLE,
  },

  finePrint: {
    fontSize: 12,
    color: INK_SOFT,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 16,
    paddingHorizontal: 8,
  },
});
