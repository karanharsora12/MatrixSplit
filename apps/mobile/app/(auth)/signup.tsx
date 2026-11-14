import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button, Input, Card } from '@/components';
import { useWatermelonTheme } from '@/theme';
import { apiClient, API_BASE_URL } from '../../src/services/api';
import { useAuthStore } from '../../src/stores/authStore';
import { CurrencyCode } from '@matrixsplit/shared';

const currencyData: { code: CurrencyCode; symbol: string; name: string }[] = [
  { code: 'INR', symbol: '₹', name: 'Rupee' },
  { code: 'USD', symbol: '$', name: 'Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'Pound' },
];

export default function SignupScreen() {
  const router = useRouter();
  const { theme, typography, spacing, borderRadius, isDark } = useWatermelonTheme();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [defaultCurrency, setDefaultCurrency] = useState<CurrencyCode>('INR');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSignup = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!email.trim()) newErrors.email = 'Valid email is required';
    if (!password || password.length < 8)
      newErrors.password = 'Password must be at least 8 characters';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/auth/signup', {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        defaultCurrency,
      });

      const { user, accessToken, refreshToken } = res.data;
      setAuth(user, accessToken, refreshToken);
      router.replace('/(tabs)');
    } catch (err: any) {
      const serverMsg = err.response?.data?.message;
      const netMsg =
        err.message === 'Network Error' || !err.response
          ? `Cannot reach backend at ${API_BASE_URL}.\nMake sure the NestJS backend is running.`
          : err.message;
      Alert.alert('Sign Up Error', serverMsg || netMsg || 'Failed to sign up.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom', 'left', 'right']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(auth)/welcome');
            }
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={({ pressed }) => [
            styles.iconButton,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.brandIcon,
                { backgroundColor: theme.primary, borderRadius: 16 },
              ]}
            >
              <Ionicons name="person-add-outline" size={24} color="#FFFFFF" />
            </View>
            <Text
              style={[
                styles.title,
                { color: theme.text, fontSize: typography.fontSize['3xl'] },
              ]}
            >
              Create Account
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: theme.textMuted, fontSize: typography.fontSize.sm },
              ]}
            >
              Join MatrixSplit to manage shared bills with friends & groups
            </Text>
          </View>

          {/* Form Card */}
          <Card
            variant="elevated"
            padding="lg"
            style={{ marginBottom: 20 }}
          >
            <Input
              label="Full Name"
              placeholder="e.g. Alice Johnson"
              value={fullName}
              onChangeText={setFullName}
              error={errors.fullName}
              leftIcon={<Ionicons name="person-outline" size={18} color={theme.textMuted} />}
            />

            <Input
              label="Email Address"
              placeholder="alice@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              leftIcon={<Ionicons name="mail-outline" size={18} color={theme.textMuted} />}
            />

            <Input
              label="Password (min 8 characters)"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              error={errors.password}
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={theme.textMuted} />}
              rightIcon={
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={theme.textMuted}
                />
              }
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            {/* Default Currency Selection */}
            <Text
              style={[
                styles.currencyLabel,
                { color: theme.textMuted, fontSize: typography.fontSize.xs },
              ]}
            >
              DEFAULT CURRENCY
            </Text>
            <View style={styles.currencyRow}>
              {currencyData.map((curr) => {
                const selected = defaultCurrency === curr.code;
                return (
                  <Pressable
                    key={curr.code}
                    onPress={() => setDefaultCurrency(curr.code)}
                    style={({ pressed }) => [
                      styles.currencyChip,
                      {
                        backgroundColor: selected
                          ? '#10B981'
                          : isDark
                          ? '#1E293B'
                          : '#F1F5F9',
                        borderColor: selected
                          ? '#10B981'
                          : isDark
                          ? '#334155'
                          : '#CBD5E1',
                        borderWidth: 1.5,
                        opacity: pressed ? 0.8 : 1,
                        transform: [{ scale: pressed ? 0.96 : 1 }],
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.currencySymbol,
                        { color: selected ? '#FFFFFF' : (isDark ? '#34D399' : '#059669') },
                      ]}
                    >
                      {curr.symbol}
                    </Text>
                    <Text
                      style={[
                        styles.currencyCode,
                        {
                          color: selected ? '#FFFFFF' : (isDark ? '#F8FAFC' : '#0F172A'),
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {curr.code}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Button
              label={loading ? 'Creating Account...' : 'Create Account'}
              size="lg"
              variant="primary"
              fullWidth
              loading={loading}
              onPress={handleSignup}
              style={{ marginTop: 14 }}
            />
          </Card>

          {/* Footer */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: theme.textMuted }]}>
              Already have an account?{' '}
            </Text>
            <Pressable
              onPress={() => router.push('/(auth)/login')}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={[styles.signInLink, { color: theme.primary }]}>
                Sign In
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 290,
    lineHeight: 19,
  },
  currencyLabel: {
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  currencyChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  currencyCode: {
    fontSize: 11,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
