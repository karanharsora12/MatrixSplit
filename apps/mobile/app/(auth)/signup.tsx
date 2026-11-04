import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Button,
  Input,
  useWatermelonTheme,
} from '@matrixsplit/watermelon-ui';
import { apiClient } from '../../src/services/api';
import { useAuthStore } from '../../src/stores/authStore';
import { CurrencyCode, SUPPORTED_CURRENCIES } from '@matrixsplit/shared';

export default function SignupScreen() {
  const router = useRouter();
  const { theme, typography, spacing, borderRadius } = useWatermelonTheme();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      const msg = err.response?.data?.message || 'Failed to sign up. Please try again.';
      Alert.alert('Sign Up Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const currencyOptions: CurrencyCode[] = ['INR', 'USD', 'EUR', 'GBP'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={[styles.backText, { color: theme.text }]}>‹ Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
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
                { color: theme.textMuted, fontSize: typography.fontSize.base },
              ]}
            >
              Start tracking and splitting expenses cleanly
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="e.g. Alice Johnson"
              value={fullName}
              onChangeText={setFullName}
              error={errors.fullName}
            />

            <Input
              label="Email Address"
              placeholder="alice@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Input
              label="Password"
              placeholder="Minimum 8 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
            />

            {/* Currency selector chips */}
            <View style={{ marginVertical: 8 }}>
              <Text
                style={[
                  styles.currencyLabel,
                  { color: theme.text, fontSize: typography.fontSize.sm },
                ]}
              >
                Default Currency
              </Text>
              <View style={styles.currencyRow}>
                {currencyOptions.map((code) => {
                  const isSelected = defaultCurrency === code;
                  const cfg = SUPPORTED_CURRENCIES[code];
                  return (
                    <TouchableOpacity
                      key={code}
                      onPress={() => setDefaultCurrency(code)}
                      style={[
                        styles.currencyChip,
                        {
                          backgroundColor: isSelected
                            ? theme.primary
                            : theme.surface,
                          borderColor: isSelected
                            ? theme.primary
                            : theme.border,
                          borderRadius: borderRadius.md,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.currencyChipText,
                          {
                            color: isSelected ? '#FFFFFF' : theme.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {cfg.symbol} {code}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Button
              label="Create Account"
              size="lg"
              onPress={handleSignup}
              loading={loading}
              style={{ marginTop: spacing.md }}
            />
          </View>

          <View style={styles.footer}>
            <Text style={{ color: theme.textMuted }}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={{ color: theme.primary, fontWeight: '700' }}>Sign In</Text>
            </TouchableOpacity>
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  backButton: {
    paddingVertical: 8,
  },
  backText: {
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    marginTop: 10,
    marginBottom: 20,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 6,
  },
  form: {
    flex: 1,
  },
  currencyLabel: {
    fontWeight: '600',
    marginBottom: 8,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  currencyChip: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyChipText: {
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
});
