import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
  const { theme, typography, spacing, borderRadius } = useWatermelonTheme();
  const user = useAuthStore((s) => s.user);

  const { data: friends } = useFriends();
  const { data: expenses } = useRecentExpenses(20);
  const { data: settlements } = useRecentSettlements(20);

  const [activeTab, setActiveTab] = useState<'expenses' | 'settlements'>('expenses');

  const friend = friends?.find((f: any) => f.id === id);
  const friendName = friend?.fullName || 'Friend';
  const balanceMinor = friend?.netBalanceMinor || 0;
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
        amountMinor: Math.abs(balanceMinor),
      },
    });
  };

  const handleAddExpense = () => {
    router.push('/expense/add');
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text
          numberOfLines={1}
          style={[
            styles.headerTitle,
            { color: theme.text, fontSize: typography.fontSize.base },
          ]}
        >
          {friendName}
        </Text>
        <TouchableOpacity onPress={handleRemind} style={styles.remindHeaderBtn}>
          <Ionicons name="notifications-outline" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile & Net Balance Card */}
        <Card
          variant="elevated"
          padding="lg"
          style={{ marginBottom: spacing.md, alignItems: 'center' }}
        >
          <Avatar name={friendName} size="lg" />
          <Text
            style={[
              styles.profileName,
              { color: theme.text, fontSize: typography.fontSize['2xl'] },
            ]}
          >
            {friendName}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 13, marginBottom: 12 }}>
            {friend?.email || 'Friend on MatrixSplit'}
          </Text>

          {/* Balance status */}
          <View
            style={[
              styles.balanceStatusBox,
              {
                backgroundColor:
                  balanceMinor > 0
                    ? theme.positiveBg
                    : balanceMinor < 0
                    ? theme.negativeBg
                    : theme.neutralBg,
                borderColor:
                  balanceMinor > 0
                    ? theme.positiveBorder
                    : balanceMinor < 0
                    ? theme.negativeBorder
                    : theme.neutralBorder,
              },
            ]}
          >
            <Text
              style={{
                color:
                  balanceMinor > 0
                    ? theme.positive
                    : balanceMinor < 0
                    ? theme.negative
                    : theme.neutral,
                fontWeight: '800',
                fontSize: 16,
              }}
            >
              {balanceMinor > 0
                ? `${friendName} owes you ${formatCurrency(balanceMinor, currency)}`
                : balanceMinor < 0
                ? `You owe ${friendName} ${formatCurrency(Math.abs(balanceMinor), currency)}`
                : `You and ${friendName} are all settled up`}
            </Text>
          </View>

          {/* Quick Action Buttons */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              onPress={handleSettleUp}
              style={[
                styles.actionBtn,
                { backgroundColor: theme.primary, borderRadius: borderRadius.md },
              ]}
            >
              <Ionicons name="swap-horizontal" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnText}>Settle Up</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRemind}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  borderWidth: 1,
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <Ionicons name="notifications-outline" size={16} color={theme.text} style={{ marginRight: 6 }} />
              <Text style={[styles.actionBtnText, { color: theme.text }]}>
                Remind
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAddExpense}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  borderWidth: 1,
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <Ionicons name="add" size={18} color={theme.text} style={{ marginRight: 4 }} />
              <Text style={[styles.actionBtnText, { color: theme.text }]}>
                Expense
              </Text>
            </TouchableOpacity>
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

        {/* Expenses List */}
        {activeTab === 'expenses' && (
          <View style={{ marginTop: spacing.sm }}>
            {sharedExpenses.length > 0 ? (
              sharedExpenses.map((exp: any) => (
                <TouchableOpacity
                  key={exp.id}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/expense/${exp.id}`)}
                >
                  <Card
                    variant="outlined"
                    padding="sm"
                    style={{ marginBottom: spacing.sm }}
                  >
                    <View style={styles.itemRow}>
                      <Avatar name={exp.payer?.fullName || 'User'} size="sm" />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.itemTitle, { color: theme.text }]}>
                          {exp.title}
                        </Text>
                        <Text style={{ color: theme.textMuted, fontSize: 11 }}>
                          Paid by {exp.payer?.fullName} •{' '}
                          {new Date(exp.date).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.itemAmount,
                          {
                            color:
                              exp.payerId === user?.id
                                ? theme.positive
                                : theme.negative,
                          },
                        ]}
                      >
                        {formatCurrency(exp.totalAmountMinor, exp.currency)}
                      </Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))
            ) : (
              <Card padding="md" variant="outlined">
                <Text style={{ color: theme.textMuted, textAlign: 'center' }}>
                  No shared expenses with {friendName} yet.
                </Text>
              </Card>
            )}
          </View>
        )}

        {/* Settlements List */}
        {activeTab === 'settlements' && (
          <View style={{ marginTop: spacing.sm }}>
            {sharedSettlements.length > 0 ? (
              sharedSettlements.map((s: any) => (
                <Card
                  key={s.id}
                  variant="outlined"
                  padding="sm"
                  style={{ marginBottom: spacing.sm }}
                >
                  <View style={styles.itemRow}>
                    <View
                      style={[
                        styles.settleIconCircle,
                        { backgroundColor: theme.positiveBg },
                      ]}
                    >
                      <Ionicons name="checkmark-done-outline" size={18} color={theme.positive} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.itemTitle, { color: theme.text }]}>
                        {s.payer?.fullName} paid {s.receiver?.fullName}
                      </Text>
                      <Text style={{ color: theme.textMuted, fontSize: 11 }}>
                        Method: {s.paymentMethod.toUpperCase()} •{' '}
                        {new Date(s.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.itemAmount, { color: theme.text }]}>
                        {formatCurrency(s.amountMinor, s.currency)}
                      </Text>
                      <Badge
                        label={s.status}
                        size="sm"
                        variant={s.status === 'confirmed' ? 'positive' : 'warning'}
                      />
                    </View>
                  </View>
                </Card>
              ))
            ) : (
              <Card padding="md" variant="outlined">
                <Text style={{ color: theme.textMuted, textAlign: 'center' }}>
                  No settlements recorded with {friendName} yet.
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
    paddingTop: 10,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '700',
  },
  remindHeaderBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileName: {
    fontWeight: '800',
    marginTop: 8,
  },
  balanceStatusBox: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontWeight: '700',
    fontSize: 12,
    color: '#FFFFFF',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settleIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontWeight: '700',
    fontSize: 14,
  },
  itemAmount: {
    fontWeight: '700',
    fontSize: 14,
  },
});
