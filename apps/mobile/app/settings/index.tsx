import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
  useWatermelonTheme,
} from '@matrixsplit/watermelon-ui';
import { useAuthStore } from '../../src/stores/authStore';
import { useThemeStore } from '../../src/stores/themeStore';
import { apiClient } from '../../src/services/api';
import { CurrencyCode, SUPPORTED_CURRENCIES } from '@matrixsplit/shared';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, typography, spacing, borderRadius } = useWatermelonTheme();
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

  const currencies: CurrencyCode[] = ['INR', 'USD', 'EUR', 'GBP'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: theme.text, fontSize: typography.fontSize.base },
          ]}
        >
          Settings & Profile
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
            {user?.fullName}
          </Text>
          <Text style={[styles.userEmail, { color: theme.textMuted }]}>
            {user?.email}
          </Text>
        </Card>

        {/* Edit Profile Form */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.text, fontSize: typography.fontSize.sm },
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
          />

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
              {currencies.map((code) => {
                const isSelected = currency === code;
                return (
                  <TouchableOpacity
                    key={code}
                    onPress={() => setCurrency(code)}
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
                      style={{
                        color: isSelected ? '#FFFFFF' : theme.text,
                        fontWeight: isSelected ? '700' : '500',
                        fontSize: 12,
                      }}
                    >
                      {SUPPORTED_CURRENCIES[code].symbol} {code}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Button
            label="Save Changes"
            onPress={handleUpdateProfile}
            loading={updating}
            size="sm"
            style={{ marginTop: 10 }}
          />
        </Card>

        {/* Appearance / Theme Preferences */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.text, fontSize: typography.fontSize.sm },
            ]}
          >
            APPEARANCE
          </Text>
        </View>

        <Card
          variant="outlined"
          padding="md"
          style={{ marginBottom: spacing.md }}
        >
          <View style={styles.themeRow}>
            <View>
              <Text
                style={[
                  styles.settingLabel,
                  { color: theme.text, fontSize: typography.fontSize.base },
                ]}
              >
                Dark Mode
              </Text>
              <Text
                style={[
                  styles.settingSub,
                  { color: theme.textMuted, fontSize: typography.fontSize.xs },
                ]}
              >
                Toggle between light and dark theme
              </Text>
            </View>
            <Switch
              value={mode === 'dark'}
              onValueChange={(val) => setMode(val ? 'dark' : 'light')}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        {/* Notifications Settings */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.text, fontSize: typography.fontSize.sm },
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
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              Push Notifications
            </Text>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              Email Alerts
            </Text>
            <Switch
              value={emailEnabled}
              onValueChange={setEmailEnabled}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        {/* Account Actions */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.text, fontSize: typography.fontSize.sm },
            ]}
          >
            ACCOUNT
          </Text>
        </View>

        <Card
          variant="outlined"
          padding="md"
          style={{ marginBottom: spacing.xl }}
        >
          <TouchableOpacity onPress={handleLogout} style={[styles.logoutBtn, { flexDirection: 'row', alignItems: 'center' }]}>
            <Ionicons name="log-out-outline" size={18} color={theme.primary} style={{ marginRight: 8 }} />
            <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 15 }}>
              Log Out
            </Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          <TouchableOpacity
            onPress={handleDeleteAccount}
            style={[styles.deleteBtn, { flexDirection: 'row', alignItems: 'center' }]}
          >
            <Ionicons name="trash-outline" size={18} color={theme.negative} style={{ marginRight: 8 }} />
            <Text
              style={{ color: theme.negative, fontWeight: '700', fontSize: 15 }}
            >
              Delete Account
            </Text>
          </TouchableOpacity>
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
    paddingTop: 10,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 28,
    fontWeight: '300',
  },
  headerTitle: {
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  userName: {
    fontWeight: '800',
  },
  userEmail: {
    marginTop: 2,
    fontSize: 13,
  },
  sectionHeader: {
    marginBottom: 6,
    marginLeft: 2,
  },
  sectionTitle: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  currencyLabel: {
    fontWeight: '600',
    marginBottom: 6,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  currencyChip: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  settingLabel: {
    fontWeight: '600',
  },
  settingSub: {
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  logoutBtn: {
    paddingVertical: 6,
  },
  deleteBtn: {
    paddingVertical: 6,
  },
});
