import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Card,
  Avatar,
  Button,
  Input,
} from '@/components';
import { useWatermelonTheme } from '@/theme';
import { useAuthStore } from '../../src/stores/authStore';
import { useThemeStore } from '../../src/stores/themeStore';
import { apiClient } from '../../src/services/api';
import { CurrencyCode } from '@matrixsplit/shared';

const currencyOptions: { code: CurrencyCode; symbol: string; label: string }[] = [
  { code: 'INR', symbol: '₹', label: 'INR' },
  { code: 'USD', symbol: '$', label: 'USD' },
  { code: 'EUR', symbol: '€', label: 'EUR' },
  { code: 'GBP', symbol: '£', label: 'GBP' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, typography, spacing, borderRadius, isDark } = useWatermelonTheme();
  const { user, logout, setUser } = useAuthStore();
  const { mode, setMode } = useThemeStore();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [currency, setCurrency] = useState<CurrencyCode>(
    user?.defaultCurrency || 'INR'
  );
  const [updating, setUpdating] = useState(false);

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  const handleUpdateProfile = async () => {
    setUpdating(true);
    try {
      const res = await apiClient.patch('/auth/profile', {
        fullName: fullName.trim(),
        defaultCurrency: currency,
      });

      setUser(res.data);
      Alert.alert('Saved', 'Profile updated successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out of MatrixSplit?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and sessions. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete('/users/me');
              logout();
              router.replace('/(auth)/welcome');
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.headerBar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={({ pressed }) => [
            styles.backBtn,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </Pressable>

        <Text
          style={[
            styles.headerTitle,
            { color: theme.text, fontSize: typography.fontSize.base },
          ]}
        >
          Settings & Preferences
        </Text>

        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Avatar Card */}
        <Card
          variant="elevated"
          padding="lg"
          style={{ alignItems: 'center', marginBottom: spacing.md }}
        >
          <Avatar name={user?.fullName || 'User'} size="xl" />
          <Text
            style={[
              styles.userName,
              {
                color: theme.text,
                fontSize: typography.fontSize.xl,
                marginTop: 12,
              },
            ]}
          >
            {user?.fullName || 'MatrixSplit User'}
          </Text>
          <Text style={[styles.userEmail, { color: theme.textMuted }]}>
            {user?.email}
          </Text>
        </Card>

        {/* Appearance / Theme Options */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.textMuted, fontSize: typography.fontSize.xs },
            ]}
          >
            APPEARANCE & THEME
          </Text>
        </View>

        <Card
          variant="outlined"
          padding="md"
          style={{ marginBottom: spacing.md }}
        >
          <View style={styles.themeSelectorRow}>
            {[
              { id: 'system', label: 'System', icon: 'phone-portrait-outline' },
              { id: 'light', label: 'Light', icon: 'sunny-outline' },
              { id: 'dark', label: 'Dark', icon: 'moon-outline' },
            ].map((t) => {
              const isSelected = mode === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setMode(t.id as any)}
                  style={({ pressed }) => [
                    styles.themeOptionCard,
                    {
                      backgroundColor: isSelected
                        ? (isDark ? 'rgba(16,185,129,0.18)' : '#D1FAE5')
                        : theme.surface,
                      borderColor: isSelected ? theme.primary : theme.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name={t.icon as any}
                    size={20}
                    color={isSelected ? theme.primary : theme.textMuted}
                  />
                  <Text
                    style={{
                      color: isSelected ? theme.primary : theme.text,
                      fontWeight: isSelected ? '700' : '500',
                      fontSize: 12,
                      marginTop: 6,
                    }}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Edit Profile Form */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.textMuted, fontSize: typography.fontSize.xs },
            ]}
          >
            PERSONAL INFORMATION
          </Text>
        </View>

        <Card
          variant="outlined"
          padding="md"
          style={{ marginBottom: spacing.md }}
        >
          <Input
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            leftIcon={<Ionicons name="person-outline" size={18} color={theme.textMuted} />}
          />

          <Text
            style={[
              styles.fieldLabel,
              { color: theme.text, fontSize: typography.fontSize.xs },
            ]}
          >
            DEFAULT CURRENCY
          </Text>

          <View style={styles.currencyRow}>
            {currencyOptions.map((c) => {
              const isSelected = currency === c.code;
              return (
                <Pressable
                  key={c.code}
                  onPress={() => setCurrency(c.code)}
                  style={({ pressed }) => [
                    styles.currChip,
                    {
                      backgroundColor: isSelected
                        ? theme.primary
                        : theme.surface,
                      borderColor: isSelected
                        ? theme.primary
                        : theme.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: isSelected ? '#FFFFFF' : theme.text,
                      fontWeight: isSelected ? '700' : '600',
                      fontSize: 13,
                    }}
                  >
                    {c.symbol} {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Button
            label={updating ? 'Saving...' : 'Save Profile Changes'}
            onPress={handleUpdateProfile}
            loading={updating}
            variant="primary"
            style={{ marginTop: 12 }}
          />
        </Card>

        {/* Notification Preferences */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.textMuted, fontSize: typography.fontSize.xs },
            ]}
          >
            NOTIFICATIONS
          </Text>
        </View>

        <Card
          variant="outlined"
          padding="md"
          style={{ marginBottom: spacing.md }}
        >
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                Push Notifications
              </Text>
              <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>
                Instant alerts when you're added to expenses
              </Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: theme.border, true: theme.primary }}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                Email Summaries
              </Text>
              <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>
                Weekly balance digests & settlement receipts
              </Text>
            </View>
            <Switch
              value={emailEnabled}
              onValueChange={setEmailEnabled}
              trackColor={{ false: theme.border, true: theme.primary }}
            />
          </View>
        </Card>

        {/* UI Showcase link */}
        <Card
          variant="outlined"
          padding="md"
          style={{ marginBottom: spacing.md }}
        >
          <Pressable
            onPress={() => router.push('/settings/ui-showcase')}
            style={({ pressed }) => [
              styles.showcaseRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="color-palette-outline" size={20} color={theme.primary} style={{ marginRight: 10 }} />
              <View>
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>
                  Design System Showcase
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>
                  Preview all buttons, badges, avatars & input states
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </Pressable>
        </Card>

        {/* Account Actions */}
        <Card
          variant="outlined"
          padding="sm"
          style={{ marginBottom: spacing.xl }}
        >
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.actionItemRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="log-out-outline" size={18} color={theme.primary} style={{ marginRight: 10 }} />
            <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 14 }}>
              Log Out of MatrixSplit
            </Text>
          </Pressable>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          <Pressable
            onPress={handleDeleteAccount}
            style={({ pressed }) => [
              styles.actionItemRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="trash-outline" size={18} color={theme.negative} style={{ marginRight: 10 }} />
            <Text style={{ color: theme.negative, fontWeight: '700', fontSize: 14 }}>
              Delete Account
            </Text>
          </Pressable>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '800',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  userName: {
    fontWeight: '800',
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: 8,
    marginTop: 4,
  },
  sectionTitle: {
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOptionCard: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  fieldLabel: {
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  currChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  settingLabel: {
    fontWeight: '700',
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  showcaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  actionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
});
