import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button } from '@/components';
import { useWatermelonTheme } from '@/theme';

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
      'Keep group trips, flatmates, dinners, and couples on the same page with real-time shared expense ledgers.',
    tag: 'SHARED LEDGERS',
  },
  {
    icon: 'git-network-outline',
    title: 'Smart Debt Simplification',
    subtitle:
      'MatrixSplit runs min-cash-flow graph algorithms to reduce 10+ member debts to minimal direct repayments.',
    tag: 'MIN-CASH FLOW',
  },
  {
    icon: 'flash-outline',
    title: 'Instant Multi-Rail Settlements',
    subtitle:
      'Record settlements via UPI, Bank Transfer, PayPal, or Cash with payment proof and instant verification.',
    tag: 'INSTANT SETTLEMENTS',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { theme, typography, spacing, borderRadius, isDark } = useWatermelonTheme();
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
      {/* Top Header */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={[styles.miniLogo, { backgroundColor: theme.primary }]}>
            <Ionicons name="flash" size={14} color="#FFFFFF" />
          </View>
          <Text
            style={[
              styles.brandText,
              { color: theme.text, fontSize: typography.fontSize.base },
            ]}
          >
            MatrixSplit
          </Text>
        </View>

        <Pressable
          onPress={handleSkip}
          style={({ pressed }) => [styles.skipBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text
            style={[
              styles.skipText,
              { color: theme.textMuted, fontSize: typography.fontSize.sm },
            ]}
          >
            Skip
          </Text>
        </Pressable>
      </View>

      {/* Main Slide Card */}
      <View style={styles.slideContainer}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : '#D1FAE5',
              borderRadius: borderRadius.full,
            },
          ]}
        >
          <Ionicons name={slide.icon} size={50} color={theme.primary} />
        </View>

        <View
          style={[
            styles.tagBadge,
            {
              backgroundColor: isDark ? '#111827' : '#F1F5F9',
              borderColor: theme.border,
            },
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
                    idx === currentSlide ? theme.primary : theme.border,
                  width: idx === currentSlide ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <Button
          label={currentSlide === slides.length - 1 ? 'Get Started' : 'Next ›'}
          size="lg"
          variant="primary"
          fullWidth
          onPress={handleNext}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniLogo: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  brandText: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipText: {
    fontWeight: '600',
  },
  slideContainer: {
    alignItems: 'center',
    paddingHorizontal: 28,
    marginTop: -20,
  },
  iconCircle: {
    width: 104,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  tagText: {
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
