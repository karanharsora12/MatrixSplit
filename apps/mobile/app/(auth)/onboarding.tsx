import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button, useWatermelonTheme } from '@matrixsplit/watermelon-ui';

const { width } = Dimensions.get('window');

const slides: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  tag: string;
}[] = [
  {
    icon: 'receipt-outline',
    title: 'Track Every Shared Expense',
    subtitle:
      'Keep group trips, flatmates, dinners, and couples on the same page with real-time expense ledgers.',
    tag: 'SHARED LEDGERS',
  },
  {
    icon: 'git-network-outline',
    title: 'Smart Debt Simplification',
    subtitle:
      'MatrixSplit runs graph optimization algorithms to minimize the number of repayments across group members.',
    tag: 'MIN-CASH FLOW',
  },
  {
    icon: 'flash-outline',
    title: 'Instant Multi-Rail Settlements',
    subtitle:
      'Record settlements via UPI, Bank Transfer, PayPal, or Cash with payment proof and instant receipt verification.',
    tag: 'INSTANT SETTLEMENTS',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { theme, typography, spacing, borderRadius } = useWatermelonTheme();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      router.replace('/(auth)/welcome');
    }
  };

  const handleSkip = () => {
    router.replace('/(auth)/welcome');
  };

  const slide = slides[currentSlide];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom', 'left', 'right']}>
      {/* Top Header / Skip */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Ionicons name="flash" size={20} color={theme.primary} style={{ marginRight: 6 }} />
          <Text
            style={[
              styles.brandText,
              { color: theme.text, fontSize: typography.fontSize.lg },
            ]}
          >
            MatrixSplit
          </Text>
        </View>

        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text
            style={[
              styles.skipText,
              { color: theme.textMuted, fontSize: typography.fontSize.sm },
            ]}
          >
            Skip
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Slide Card */}
      <View style={styles.slideContainer}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: theme.primaryLight,
              borderRadius: borderRadius.full,
            },
          ]}
        >
          <Ionicons name={slide.icon} size={48} color={theme.primary} />
        </View>

        <View
          style={[
            styles.tagBadge,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text
            style={[
              styles.tagText,
              { color: theme.primary, fontSize: typography.fontSize.xs },
            ]}
          >
            {slide.tag}
          </Text>
        </View>

        <Text
          style={[
            styles.title,
            { color: theme.text, fontSize: typography.fontSize['3xl'] },
          ]}
        >
          {slide.title}
        </Text>

        <Text
          style={[
            styles.subtitle,
            { color: theme.textMuted, fontSize: typography.fontSize.base },
          ]}
        >
          {slide.subtitle}
        </Text>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomBar}>
        {/* Pagination Dots */}
        <View style={styles.dotsRow}>
          {slides.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    idx === currentSlide ? theme.primary : theme.divider,
                  width: idx === currentSlide ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <Button
          label={currentSlide === slides.length - 1 ? 'Get Started' : 'Next ›'}
          size="lg"
          onPress={handleNext}
          style={{ width: '100%', marginTop: spacing.md }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  skipBtn: {
    padding: 6,
  },
  skipText: {
    fontWeight: '600',
  },
  slideContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    flex: 1,
    justifyContent: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 56,
  },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  tagText: {
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 12,
    lineHeight: 36,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});
