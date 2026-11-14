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
import { Button, Input } from '@/components';
import { useWatermelonTheme } from '@/theme';
import { apiClient } from '../../src/services/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { theme, typography, spacing } = useWatermelonTheme();

  const [step, setStep] = useState<'request_otp' | 'reset_password'>('request_otp');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async () => {
    if (!email) {
      Alert.alert('Required', 'Please enter your registered email address');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/auth/forgot-password', { email });
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
    if (!otp || !newPassword || newPassword.length < 8) {
      Alert.alert('Required', 'Enter the 6-digit OTP and new password (min 8 chars)');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', {
        email,
        otp,
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(auth)/login');
              }
            }}
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
              Reset Password
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: theme.textMuted, fontSize: typography.fontSize.base },
              ]}
            >
              {step === 'request_otp'
                ? "Enter your email and we'll send you a recovery code"
                : 'Enter the 6-digit code and choose a new password'}
            </Text>
          </View>

          <View style={styles.form}>
            {step === 'request_otp' ? (
              <>
                <Input
                  label="Email Address"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Button
                  label="Send Recovery Code"
                  size="lg"
                  onPress={handleRequestOtp}
                  loading={loading}
                  style={{ marginTop: spacing.lg }}
                />
              </>
            ) : (
              <>
                <Input
                  label="6-Digit OTP Code"
                  placeholder="123456"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <Input
                  label="New Password"
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
                <Button
                  label="Reset Password"
                  size="lg"
                  onPress={handleResetPassword}
                  loading={loading}
                  style={{ marginTop: spacing.lg }}
                />
              </>
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={{ color: theme.primary, fontWeight: '700' }}>
                Return to Login
              </Text>
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
    marginTop: 20,
    marginBottom: 28,
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
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
});
