import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, useWatermelonTheme } from '@matrixsplit/watermelon-ui';

export default function OtpVerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { theme, typography, spacing, borderRadius } = useWatermelonTheme();

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
    // Simulate verification
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.content}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { flexDirection: 'row', alignItems: 'center' }]}
          >
            <Ionicons name="chevron-back" size={22} color={theme.text} />
            <Text style={[styles.backText, { color: theme.text, marginLeft: 2 }]}>Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: theme.primaryLight, borderRadius: borderRadius.xl },
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
              <TouchableOpacity onPress={handleResend}>
                <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 14 }}>
                  Resend Verification Code
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Button
            label="Verify & Continue"
            size="lg"
            onPress={handleVerify}
            loading={loading}
            style={{ marginTop: spacing.xl }}
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
  content: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flex: 1,
  },
  backBtn: {
    paddingVertical: 8,
  },
  backText: {
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  iconBadge: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
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
    alignItems: 'center',
    marginTop: 16,
  },
});
