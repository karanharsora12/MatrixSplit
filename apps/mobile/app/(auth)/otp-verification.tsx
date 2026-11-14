import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components';
import { useWatermelonTheme } from '@/theme';

export default function OtpVerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { theme, typography, spacing, borderRadius, isDark } = useWatermelonTheme();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text.slice(-1);
    setOtp(newOtp);

    // Auto move to next input
    if (text && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      Alert.alert('Incomplete Code', 'Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Verified', 'Email verified successfully!', [
        { text: 'Continue', onPress: () => router.replace('/(tabs)') },
      ]);
    }, 1200);
  };

  const handleResend = () => {
    setTimer(30);
    Alert.alert('Code Resent', 'A new 6-digit verification code was sent to your email.');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom', 'left', 'right']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
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
        <View style={styles.content}>
          <View style={styles.header}>
            <View
              style={[
                styles.iconBadge,
                {
                  backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#D1FAE5',
                  borderRadius: borderRadius.xl,
                },
              ]}
            >
              <Ionicons name="mail-unread-outline" size={32} color={theme.primary} />
            </View>
            <Text
              style={[
                styles.title,
                { color: theme.text, fontSize: typography.fontSize['3xl'] },
              ]}
            >
              Verify OTP Code
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: theme.textMuted, fontSize: typography.fontSize.sm },
              ]}
            >
              We sent a 6-digit verification code to{' '}
              <Text style={{ color: theme.text, fontWeight: '700' }}>
                {params.email || 'your email'}
              </Text>
            </Text>
          </View>

          {/* 6 Digit Inputs */}
          <View style={styles.otpRow}>
            {otp.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={(ref) => (inputsRef.current[idx] = ref)}
                style={[
                  styles.otpInput,
                  {
                    backgroundColor: theme.card,
                    borderColor: digit ? theme.primary : theme.border,
                    color: theme.text,
                    borderRadius: borderRadius.md,
                  },
                ]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(val) => handleChange(val, idx)}
                onKeyPress={(e) => handleKeyPress(e, idx)}
                autoFocus={idx === 0}
              />
            ))}
          </View>

          {/* Resend Countdown */}
          <View style={styles.resendContainer}>
            {timer > 0 ? (
              <Text style={{ color: theme.textMuted, fontSize: 13 }}>
                Resend code in <Text style={{ color: theme.primary, fontWeight: '700' }}>{timer}s</Text>
              </Text>
            ) : (
              <Pressable
                onPress={handleResend}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 14 }}>
                  Resend Verification Code
                </Text>
              </Pressable>
            )}
          </View>

          <Button
            label={loading ? 'Verifying...' : 'Verify & Continue'}
            size="lg"
            variant="primary"
            loading={loading}
            onPress={handleVerify}
            style={{ width: '100%', marginTop: 24 }}
          />
        </View>
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
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconBadge: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 280,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
  },
  resendContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
});
