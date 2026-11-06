import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Button,
  Input,
  useWatermelonTheme,
} from '@matrixsplit/watermelon-ui';
import { apiClient, API_BASE_URL } from '../../src/services/api';
import { useAuthStore } from '../../src/stores/authStore';
import { CurrencyCode } from '@matrixsplit/shared';

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
      const serverMsg = err.response?.data?.message;
      const netMsg = err.message === 'Network Error' || !err.response
        ? `Cannot reach backend at ${API_BASE_URL}.\nMake sure the NestJS backend is running.`
        : err.message;
      Alert.alert('Sign Up Error', serverMsg || netMsg || 'Failed to sign up.');
    } finally {
      setLoading(false);
    }
  };

  const currencyOptions: CurrencyCode[] = ['INR', 'USD', 'EUR', 'GBP'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { flexDirection: 'row', alignItems: 'center' }]}
          >
            <Ionicons name="chevron-back" size={22} color={theme.text} />
            <Text style={[styles.backText, { color: theme.text, marginLeft: 2 }]}>Back</Text>
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
              label="Password (min 8 characters)"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
            />

            {/* Default Currency Selection */}
            <Text
              style={[
                styles.currencyLabel,
                { color: theme.text, fontSize: typography.fontSize.sm },
              ]}
            >
              Default Currency
            </Text>
            <View style={styles.currencyRow}>
              {currencyOptions.map((curr) => {
                const selected = defaultCurrency === curr;
                return (
                  <TouchableOpacity
                    key={curr}
                    activeOpacity={0.8}
                    onPress={() => setDefaultCurrency(curr)}
                    style={[
                      styles.currencyChip,
                      {
                        backgroundColor: selected
                          ? theme.primary
                          : theme.card,
                        borderColor: selected
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
                          color: selected ? '#FFFFFF' : theme.text,
                          fontWeight: selected ? '700' : '500',
                        },
                      ]}
                    >
                      {curr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
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
              <Text style={{ color: theme.primary, fontWeight: '700' }}>Log In</Text>
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
    marginTop: 16,
    marginBottom: 24,
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
    marginTop: 4,
  },
  currencyRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  currencyChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
  },
  currencyChipText: {
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
});
