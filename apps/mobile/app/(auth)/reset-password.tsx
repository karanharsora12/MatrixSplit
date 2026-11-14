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

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { theme, typography, spacing } = useWatermelonTheme();

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    setError('');
    if (!code) {
      setError('Please enter the reset code sent to your email.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Password Reset',
        'Your password has been successfully updated. You can now log in with your new password.',
        [{ text: 'Sign In', onPress: () => router.replace('/(auth)/login') }]
      );
    }, 1200);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { flexDirection: 'row', alignItems: 'center' }]}
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
                { color: theme.textMuted, fontSize: typography.fontSize.sm },
              ]}
            >
              Enter the reset code sent to your email along with your new password.
            </Text>
          </View>

          <View style={styles.form}>
            {error ? (
              <View
                style={[
                  styles.errorBox,
                  { backgroundColor: theme.negativeBg, borderColor: theme.negativeBorder },
                ]}
              >
                <Text style={{ color: theme.negative, fontSize: 13, fontWeight: '600' }}>
                  {error}
                </Text>
              </View>
            ) : null}

            <Input
              label="Reset Code / Token"
              placeholder="e.g. 123456"
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
            />

            <Input
              label="New Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Input
              label="Confirm New Password"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <Button
              label="Save New Password"
              size="lg"
              onPress={handleReset}
              loading={loading}
              style={{ marginTop: spacing.md }}
            />
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
  },
  backBtn: {
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
    lineHeight: 20,
  },
  form: {
    flex: 1,
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
});
