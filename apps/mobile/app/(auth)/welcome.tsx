import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Button,
  useWatermelonTheme,
} from '@matrixsplit/watermelon-ui';

export default function WelcomeScreen() {
  const router = useRouter();
  const { theme, typography, spacing, borderRadius } = useWatermelonTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Logo / Brand Badge */}
        <View style={styles.brandContainer}>
          <View
            style={[
              styles.logoBadge,
              { backgroundColor: theme.primary, borderRadius: borderRadius.xl },
            ]}
          >
            <Text style={styles.logoIcon}>⚡</Text>
          </View>
          <Text
            style={[
              styles.title,
              { color: theme.text, fontSize: typography.fontSize['4xl'] },
            ]}
          >
            MatrixSplit
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: theme.textMuted, fontSize: typography.fontSize.base },
            ]}
          >
            Shared expense management simplified. Split bills effortlessly with
            friends, roommates, and groups.
          </Text>
        </View>

        {/* Feature Highlights Card */}
        <View
          style={[
            styles.featuresCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              borderRadius: borderRadius.lg,
            },
          ]}
        >
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>✨</Text>
            <View style={styles.featureTextContainer}>
              <Text style={[styles.featureTitle, { color: theme.text }]}>
                Smart Debt Simplification
              </Text>
              <Text style={[styles.featureDesc, { color: theme.textMuted }]}>
                Minimizes the number of payments to settle up group balances.
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📊</Text>
            <View style={styles.featureTextContainer}>
              <Text style={[styles.featureTitle, { color: theme.text }]}>
                Precise Split Algorithms
              </Text>
              <Text style={[styles.featureDesc, { color: theme.textMuted }]}>
                Split equally, by exact amount, percentages, or custom shares.
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>⚡</Text>
            <View style={styles.featureTextContainer}>
              <Text style={[styles.featureTitle, { color: theme.text }]}>
                Real-Time Settlements
              </Text>
              <Text style={[styles.featureDesc, { color: theme.textMuted }]}>
                Record cash, bank transfer, and UPI payments seamlessly.
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.buttonContainer}>
          <Button
            label="Get Started"
            size="lg"
            variant="primary"
            onPress={() => router.push('/(auth)/signup')}
            style={{ marginBottom: spacing.md }}
          />
          <Button
            label="I already have an account"
            size="lg"
            variant="outline"
            onPress={() => router.push('/(auth)/login')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoBadge: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  logoIcon: {
    fontSize: 32,
    color: '#FFFFFF',
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
    maxWidth: 320,
  },
  featuresCard: {
    padding: 16,
    borderWidth: 1,
    marginVertical: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 14,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    marginVertical: 6,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 10,
  },
});
