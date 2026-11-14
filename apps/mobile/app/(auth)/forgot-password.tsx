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
import { apiClient } from '../../src/services/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { theme, typography, spacing, borderRadius, isDark } = useWatermelonTheme();

  const [step, setStep] = useState<'request_otp' | 'reset_password'>('request_otp');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async () => {
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your registered email address');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/auth/forgot-password', { email: email.trim() });
      if (res.data?.debugOtp) {
        Alert.alert('Demo OTP', `Your reset OTP is: ${res.data.debugOtp}`);
      } else {
        Alert.alert('OTP Sent', 'Check your email for the 6-digit verification code.');
      }
      setStep('reset_password');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp.trim() || !newPassword || newPassword.length < 8) {
      Alert.alert('Required', 'Enter the 6-digit OTP and new password (min 8 chars)');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', {
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });

      Alert.alert('Success', 'Password reset successfully! Please sign in.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Invalid or expired OTP');
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
            if (step === 'reset_password') {
              setStep('request_otp');
            } else if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(auth)/login');
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
              <Ionicons name="key-outline" size={24} color="#FFFFFF" />
            </View>
            <Text
              style={[
                styles.title,
                { color: theme.text, fontSize: typography.fontSize['3xl'] },
              ]}
            >
              Reset Password
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: theme.textMuted, fontSize: typography.fontSize.sm },
              ]}
            >
              {step === 'request_otp'
                ? "Enter your email and we'll send a 6-digit verification code"
                : `Enter the verification code sent to ${email}`}
            </Text>

            {/* Stepper Pill */}
            <View style={styles.stepIndicator}>
              <View
                style={[
                  styles.stepDot,
                  { backgroundColor: theme.primary, width: step === 'request_otp' ? 24 : 8 },
                ]}
              />
              <View
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: step === 'reset_password' ? theme.primary : theme.border,
                    width: step === 'reset_password' ? 24 : 8,
                  },
                ]}
              />
            </View>
          </View>

          {/* Form Card */}
          <Card
            variant="elevated"
            padding="lg"
            style={{ marginBottom: 20 }}
          >
            {step === 'request_otp' ? (
              <>
                <Input
                  label="Email Address"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={<Ionicons name="mail-outline" size={18} color={theme.textMuted} />}
                />

                <Button
                  label={loading ? 'Sending Code...' : 'Send Verification Code'}
                  size="lg"
                  variant="primary"
                  fullWidth
                  loading={loading}
                  onPress={handleRequestOtp}
                  style={{ marginTop: 10 }}
                />
              </>
            ) : (
              <>
                <Input
                  label="6-Digit Verification Code"
                  placeholder="123456"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  leftIcon={<Ionicons name="shield-outline" size={18} color={theme.textMuted} />}
                />

                <Input
                  label="New Password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
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

                <Button
                  label={loading ? 'Updating Password...' : 'Save New Password'}
                  size="lg"
                  variant="primary"
                  fullWidth
                  loading={loading}
                  onPress={handleResetPassword}
                  style={{ marginTop: 10 }}
                />

                <Pressable
                  onPress={handleRequestOtp}
                  style={({ pressed }) => [
                    styles.resendBtn,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text style={[styles.resendText, { color: theme.primary }]}>
                    Didn't receive code? Resend OTP
                  </Text>
                </Pressable>
              </>
            )}
          </Card>

          {/* Footer Back to Login */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: theme.textMuted }]}>
              Remembered your password?{' '}
            </Text>
            <Pressable
              onPress={() => router.replace('/(auth)/login')}
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
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 6,
  },
  stepDot: {
    height: 6,
    borderRadius: 3,
  },
  resendBtn: {
    alignItems: 'center',
    marginTop: 14,
  },
  resendText: {
    fontSize: 13,
    fontWeight: '600',
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
