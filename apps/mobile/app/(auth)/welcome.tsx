import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button } from '@/components';
import { useWatermelonTheme } from '@/theme';
import { useAuthStore } from '../../src/stores/authStore';

export default function WelcomeScreen() {
  const router = useRouter();
  const { theme, typography, spacing, borderRadius, isDark } = useWatermelonTheme();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleInstantDemo = () => {
    setAuth(
      {
        id: 'usr-demo-alice',
        email: 'alice@matrixsplit.com',
        fullName: 'Alice Johnson',
        defaultCurrency: 'INR',
        preferredLanguage: 'en',
        themePreference: 'system',
        isEmailVerified: true,
        profileImage: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      'demo_access_token',
      'demo_refresh_token'
    );
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <View style={styles.brandPill}>
          <Ionicons name="sparkles" size={14} color={theme.primary} />
          <Text style={[styles.brandPillText, { color: theme.primary }]}>Smart Expense Tracker</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Hero */}
        <View style={styles.heroSection}>
          <View
            style={[
              styles.logoBadge,
              {
                backgroundColor: theme.primary,
                borderRadius: borderRadius['2xl'],
                shadowColor: theme.primary,
              },
            ]}
          >
            <Ionicons name="flash" size={38} color="#FFFFFF" />
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
            Effortless bill splitting, smart debt simplification, and instant settlements with friends and groups.
          </Text>
        </View>

        {/* Feature Cards Grid */}
        <View
          style={[
            styles.featuresCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              borderRadius: borderRadius.xl,
            },
          ]}
        >
          <View style={styles.featureItem}>
            <View style={[styles.featureIconWrap, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#D1FAE5' }]}>
              <Ionicons name="git-network-outline" size={20} color={theme.primary} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={[styles.featureTitle, { color: theme.text }]}>
                Debt Minimization
              </Text>
              <Text style={[styles.featureDesc, { color: theme.textMuted }]}>
                Graph simplification reduces 10+ group payments down to just 2 or 3.
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          <View style={styles.featureItem}>
            <View style={[styles.featureIconWrap, { backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#DBEAFE' }]}>
              <Ionicons name="pie-chart-outline" size={20} color="#3B82F6" />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={[styles.featureTitle, { color: theme.text }]}>
                4 Split Methods
              </Text>
              <Text style={[styles.featureDesc, { color: theme.textMuted }]}>
                Equal shares, exact rupee amounts, percentages, or weighted ratios.
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          <View style={styles.featureItem}>
            <View style={[styles.featureIconWrap, { backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#FEF3C7' }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#F59E0B" />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={[styles.featureTitle, { color: theme.text }]}>
                Real-Time Settlements
              </Text>
              <Text style={[styles.featureDesc, { color: theme.textMuted }]}>
                Record UPI, cash, and bank transfers with live balance verification.
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            label="Get Started"
            size="lg"
            variant="primary"
            onPress={() => router.push('/(auth)/signup')}
            style={{ marginBottom: 10 }}
          />

          <Button
            label="I already have an account"
            size="lg"
            variant="outline"
            onPress={() => router.push('/(auth)/login')}
            style={{ marginBottom: 12 }}
          />

          {/* Quick Demo Exploration Shortcut */}
          <Pressable
            onPress={handleInstantDemo}
            style={({ pressed }) => [
              styles.demoChip,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Ionicons name="rocket-outline" size={16} color={theme.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.demoChipText, { color: theme.text }]}>
              Try Instant Demo Mode (No signup needed)
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  brandPillText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  themeToggleBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    justifyContent: 'space-between',
    flexGrow: 1,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  logoBadge: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
    maxWidth: 340,
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
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
    lineHeight: 17,
  },
  divider: {
    height: 1,
    marginVertical: 6,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 8,
  },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  demoChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
