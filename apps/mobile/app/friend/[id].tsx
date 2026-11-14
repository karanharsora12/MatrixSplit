import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Card,
  Avatar,
  Badge,
  Button,
  SegmentedControl,
} from '@/components';
import { useWatermelonTheme } from '@/theme';
import {
  useFriends,
  useRecentExpenses,
  useRecentSettlements,
} from '../../src/hooks/useQueries';
import { useAuthStore } from '../../src/stores/authStore';
import { formatCurrency } from '@matrixsplit/shared';

export default function FriendDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, typography, spacing, borderRadius, isDark } = useWatermelonTheme();
  const user = useAuthStore((s) => s.user);

  const { data: friends } = useFriends();
  const { data: expenses } = useRecentExpenses(30);
  const { data: settlements } = useRecentSettlements(30);

  const [activeTab, setActiveTab] = useState<'expenses' | 'settlements'>('expenses');

  const friend = friends?.find((f: any) => f.id === id);
  const friendName = friend?.fullName || 'Friend';
  const balanceMinor = friend?.netBalanceMinor || friend?.balanceMinor || 0;
  const currency = friend?.defaultCurrency || user?.defaultCurrency || 'INR';

  // Filter shared expenses with this friend
  const sharedExpenses =
    expenses?.filter((e: any) => {
      const isPayer = e.payerId === id || e.payerId === user?.id;
      const isParticipant = e.participants?.some(
        (p: any) => p.userId === id || p.userId === user?.id
      );
      return isPayer && isParticipant;
    }) || [];

  // Filter shared settlements with this friend
  const sharedSettlements =
    settlements?.filter(
      (s: any) =>
        (s.payerId === user?.id && s.receiverId === id) ||
        (s.payerId === id && s.receiverId === user?.id)
    ) || [];

  const handleRemind = async () => {
    if (balanceMinor <= 0) {
      Alert.alert(
        'No Debt to Remind',
        `${friendName} does not currently owe you any balance.`
      );
      return;
    }

    const formattedAmount = formatCurrency(balanceMinor, currency);
    const message = `Hi ${friendName}! 👋 Just a friendly reminder from MatrixSplit about our shared balance of ${formattedAmount}. Whenever you're ready, you can settle up directly in the app. Thanks!`;

    try {
      await Share.share({
        message,
        title: `MatrixSplit Balance Reminder for ${friendName}`,
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSettleUp = () => {
    router.push({
      pathname: '/settle',
      params: {
        targetUserId: id,
        targetName: friendName,
        amountMinor: Math.abs(balanceMinor).toString(),
      },
    });
  };

  const handleAddExpense = () => {
    router.push('/expense/add');
  };

  const isPositive = balanceMinor > 0;
  const isNegative = balanceMinor < 0;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.background }]}>
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
          numberOfLines={1}
          style={[
            styles.headerTitle,
            { color: theme.text, fontSize: typography.fontSize.base },
          ]}
        >
          {friendName}
        </Text>

        <Pressable
          onPress={handleRemind}
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
          <Ionicons name="notifications-outline" size={18} color={theme.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile & Net Balance Card */}
        <Card
          variant="elevated"
          padding="lg"
          style={{ marginBottom: spacing.md, alignItems: 'center' }}
        >
          <Avatar name={friendName} size="xl" />
          <Text
            style={[
              styles.profileName,
              { color: theme.text, fontSize: typography.fontSize['2xl'] },
            ]}
          >
            {friendName}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 13, marginBottom: 14 }}>
            {friend?.email || 'Friend on MatrixSplit'}
          </Text>

          {/* Balance Status Banner */}
          <View
            style={[
              styles.balanceBanner,
              {
                backgroundColor: isPositive
                  ? (isDark ? 'rgba(16,185,129,0.12)' : '#ECFDF5')
                  : isNegative
                  ? (isDark ? 'rgba(239,68,68,0.12)' : '#FEF2F2')
                  : theme.surface,
                borderColor: isPositive
                  ? theme.primary
                  : isNegative
                  ? theme.negative
                  : theme.border,
              },
            ]}
          >
            <Text
              style={{
                color: isPositive
                  ? theme.positive
                  : isNegative
                  ? theme.negative
                  : theme.text,
                fontWeight: '800',
                fontSize: 16,
              }}
            >
              {isPositive
                ? `${friendName} owes you ${formatCurrency(balanceMinor, currency)}`
                : isNegative
                ? `You owe ${friendName} ${formatCurrency(Math.abs(balanceMinor), currency)}`
                : `You and ${friendName} are settled up`}
            </Text>
          </View>

          {/* Quick Action Buttons Grid */}
          <View style={styles.actionButtonsRow}>
            {isNegative && (
              <Button
                label="Settle Up"
                variant="primary"
                size="md"
                onPress={handleSettleUp}
                style={{ flex: 1, marginHorizontal: 4 }}
                icon={<Ionicons name="swap-horizontal" size={16} color="#FFFFFF" />}
              />
            )}

            {isPositive && (
              <Button
                label="Remind"
                variant="primary"
                size="md"
                onPress={handleRemind}
                style={{ flex: 1, marginHorizontal: 4 }}
                icon={<Ionicons name="notifications-outline" size={16} color="#FFFFFF" />}
              />
            )}

            <Button
              label="+ Expense"
              variant="outline"
              size="md"
              onPress={handleAddExpense}
              style={{ flex: 1, marginHorizontal: 4 }}
            />
          </View>
        </Card>

        {/* Tab Controls */}
        <SegmentedControl
          value={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          options={[
            { value: 'expenses', label: `Shared Expenses (${sharedExpenses.length})` },
            { value: 'settlements', label: `Settlements (${sharedSettlements.length})` },
          ]}
        />

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <View style={{ marginTop: 10 }}>
            {sharedExpenses.length > 0 ? (
              sharedExpenses.map((exp: any) => (
                <Pressable
                  key={exp.id}
                  onPress={() => router.push(`/expense/${exp.id}`)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
                >
                  <Card
                    variant="outlined"
                    padding="sm"
                    style={{ marginBottom: spacing.sm }}
                  >
                    <View style={styles.historyRow}>
                      <View style={[styles.historyIconCircle, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#D1FAE5' }]}>
                        <Ionicons name="receipt-outline" size={18} color={theme.primary} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>
                          {exp.title}
                        </Text>
                        <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>
                          Paid by {exp.payerId === user?.id ? 'You' : friendName} •{' '}
                          {new Date(exp.date).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text style={{ color: theme.text, fontWeight: '800', fontSize: 14 }}>
                        {formatCurrency(exp.totalAmountMinor, exp.currency)}
                      </Text>
                    </View>
                  </Card>
                </Pressable>
              ))
            ) : (
              <Card padding="md" variant="outlined" style={{ alignItems: 'center', paddingVertical: 24 }}>
                <Ionicons name="receipt-outline" size={36} color={theme.textMuted} style={{ marginBottom: 6 }} />
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>
                  No shared expenses yet
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>
                  Add a bill or expense between you two to start tracking.
                </Text>
              </Card>
            )}
          </View>
        )}

        {/* Settlements Tab */}
        {activeTab === 'settlements' && (
          <View style={{ marginTop: 10 }}>
            {sharedSettlements.length > 0 ? (
              sharedSettlements.map((s: any) => (
                <Card
                  key={s.id}
                  variant="outlined"
                  padding="sm"
                  style={{ marginBottom: spacing.sm }}
                >
                  <View style={styles.historyRow}>
                    <View style={[styles.historyIconCircle, { backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#DBEAFE' }]}>
                      <Ionicons name="checkmark-done" size={18} color="#3B82F6" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>
                        {s.payerId === user?.id ? 'You paid' : `${friendName} paid`}
                      </Text>
                      <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>
                        Method: {s.paymentMethod.toUpperCase()} •{' '}
                        {new Date(s.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: theme.positive, fontWeight: '800', fontSize: 14 }}>
                        {formatCurrency(s.amountMinor, s.currency)}
                      </Text>
                      <Badge label={s.status} size="sm" variant={s.status === 'confirmed' ? 'positive' : 'warning'} />
                    </View>
                  </View>
                </Card>
              ))
            ) : (
              <Card padding="md" variant="outlined" style={{ alignItems: 'center', paddingVertical: 24 }}>
                <Ionicons name="swap-horizontal-outline" size={36} color={theme.textMuted} style={{ marginBottom: 6 }} />
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>
                  No settlements recorded
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>
                  Recorded repayments will appear here with confirmation status.
                </Text>
              </Card>
            )}
          </View>
        )}
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
  profileName: {
    fontWeight: '800',
    marginTop: 12,
  },
  balanceBanner: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    width: '100%',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
