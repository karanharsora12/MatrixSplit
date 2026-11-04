import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Card,
  Avatar,
  Badge,
  Button,
  SegmentedControl,
  BalancePill,
  SkeletonCard,
  useWatermelonTheme,
} from '@matrixsplit/watermelon-ui';
import {
  useGroupDetails,
  useGroupExpenses,
  useGroupBalances,
} from '../../src/hooks/useQueries';
import { useAuthStore } from '../../src/stores/authStore';
import { formatCurrency } from '@matrixsplit/shared';

export default function GroupDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, typography, spacing, borderRadius } = useWatermelonTheme();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'activity'>('expenses');

  const { data: group, isLoading: loadingGroup, refetch: refetchGroup } = useGroupDetails(id!);
  const { data: expenses, isLoading: loadingExpenses, refetch: refetchExpenses } =
    useGroupExpenses(id!);
  const { data: balanceData, isLoading: loadingBalances, refetch: refetchBalances } =
    useGroupBalances(id!);

  const onRefresh = () => {
    refetchGroup();
    refetchExpenses();
    refetchBalances();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.headerBar,
          { backgroundColor: theme.surface, borderBottomColor: theme.divider },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Text style={[styles.backText, { color: theme.text }]}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text
            numberOfLines={1}
            style={[styles.headerTitle, { color: theme.text }]}
          >
            {group?.name || 'Group Details'}
          </Text>
          <Text
            style={[styles.headerSub, { color: theme.textMuted }]}
          >
            Invite Code: <Text style={{ fontWeight: '700' }}>{group?.inviteCode}</Text>
          </Text>
        </View>

        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/expense/add',
              params: { preselectedGroupId: id },
            })
          }
          style={[styles.addExpBtn, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.addExpBtnText}>+ Expense</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loadingGroup || loadingExpenses}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Group Hero Card */}
        {group && (
          <Card
            variant="elevated"
            padding="md"
            style={{ marginBottom: spacing.md }}
          >
            <View style={styles.heroTop}>
              <View
                style={[
                  styles.categoryCircle,
                  { backgroundColor: theme.primaryLight },
                ]}
              >
                <Text style={{ fontSize: 24 }}>🌴</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text
                  style={[
                    styles.heroTitle,
                    { color: theme.text, fontSize: typography.fontSize.xl },
                  ]}
                >
                  {group.name}
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                  {group.membersCount || 1} members • Currency: {group.defaultCurrency}
                </Text>
              </View>
              <Badge label={group.category} size="sm" variant="info" />
            </View>

            {/* User net balance in this group */}
            {balanceData && (
              <View
                style={[
                  styles.userGroupBalanceBox,
                  {
                    backgroundColor:
                      balanceData.userNetBalanceMinor > 0
                        ? theme.positiveBg
                        : balanceData.userNetBalanceMinor < 0
                        ? theme.negativeBg
                        : theme.neutralBg,
                    borderColor:
                      balanceData.userNetBalanceMinor > 0
                        ? theme.positiveBorder
                        : balanceData.userNetBalanceMinor < 0
                        ? theme.negativeBorder
                        : theme.neutralBorder,
                  },
                ]}
              >
                <Text
                  style={{
                    color:
                      balanceData.userNetBalanceMinor > 0
                        ? theme.positive
                        : balanceData.userNetBalanceMinor < 0
                        ? theme.negative
                        : theme.neutral,
                    fontWeight: '700',
                    fontSize: 13,
                  }}
                >
                  {balanceData.userNetBalanceMinor > 0
                    ? `You are owed ${formatCurrency(balanceData.userNetBalanceMinor, group.defaultCurrency)} in this group`
                    : balanceData.userNetBalanceMinor < 0
                    ? `You owe ${formatCurrency(Math.abs(balanceData.userNetBalanceMinor), group.defaultCurrency)} in this group`
                    : 'You are all settled up in this group'}
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* Tab Controls */}
        <SegmentedControl
          value={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          options={[
            { value: 'expenses', label: 'Expenses' },
            { value: 'balances', label: 'Balances & Settle' },
          ]}
        />

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <View style={{ marginTop: 8 }}>
            {loadingExpenses ? (
              <SkeletonCard />
            ) : expenses && expenses.length > 0 ? (
              expenses.map((exp: any) => (
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
                    <View style={styles.expenseItemRow}>
                      <Avatar name={exp.payer?.fullName || 'User'} size="sm" />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text
                          style={[styles.expItemTitle, { color: theme.text }]}
                        >
                          {exp.title}
                        </Text>
                        <Text
                          style={[
                            styles.expItemSub,
                            { color: theme.textMuted },
                          ]}
                        >
                          Paid by {exp.payer?.fullName} •{' '}
                          {new Date(exp.date).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text
                          style={[
                            styles.expTotalAmount,
                            { color: theme.text },
                          ]}
                        >
                          {formatCurrency(exp.totalAmountMinor, exp.currency)}
                        </Text>
                        <Text
                          style={{
                            color: theme.textMuted,
                            fontSize: 11,
                            marginTop: 2,
                          }}
                        >
                          Your share:{' '}
                          {formatCurrency(exp.userShareMinor || 0, exp.currency)}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))
            ) : (
              <Card padding="md" variant="outlined">
                <Text style={{ color: theme.textMuted, textAlign: 'center' }}>
                  No expenses in this group yet. Tap '+ Expense' to add one!
                </Text>
              </Card>
            )}
          </View>
        )}

        {/* Balances & Debt Simplification Tab */}
        {activeTab === 'balances' && (
          <View style={{ marginTop: 8 }}>
            {/* Simplified Debts Plan (Section 9) */}
            <View style={styles.subSectionHeader}>
              <Text
                style={[
                  styles.subSectionTitle,
                  { color: theme.text, fontSize: typography.fontSize.base },
                ]}
              >
                ✨ Simplified Settlements Plan
              </Text>
              <Text
                style={[
                  styles.subSectionDesc,
                  { color: theme.textMuted, fontSize: typography.fontSize.xs },
                ]}
              >
                Calculated by MatrixSplit's debt simplification algorithm to
                minimize transactions:
              </Text>
            </View>

            {balanceData?.simplifiedDebts && balanceData.simplifiedDebts.length > 0 ? (
              balanceData.simplifiedDebts.map((debt: any, idx: number) => {
                const isDebtor = debt.fromUserId === currentUserId;
                const isCreditor = debt.toUserId === currentUserId;

                return (
                  <Card
                    key={idx}
                    variant="outlined"
                    padding="md"
                    style={{
                      marginBottom: spacing.sm,
                      borderColor: isDebtor
                        ? theme.negative
                        : isCreditor
                        ? theme.positive
                        : theme.border,
                    }}
                  >
                    <View style={styles.debtPlanRow}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.debtPlanTitle,
                            { color: theme.text },
                          ]}
                        >
                          <Text style={{ fontWeight: '700' }}>
                            {debt.fromUser?.fullName}
                          </Text>{' '}
                          pays{' '}
                          <Text style={{ fontWeight: '700' }}>
                            {debt.toUser?.fullName}
                          </Text>
                        </Text>
                        <Text
                          style={[
                            styles.debtPlanAmount,
                            {
                              color: isDebtor
                                ? theme.negative
                                : isCreditor
                                ? theme.positive
                                : theme.text,
                              fontSize: typography.fontSize.lg,
                            },
                          ]}
                        >
                          {formatCurrency(debt.amountMinor, debt.currency)}
                        </Text>
                      </View>

                      {(isDebtor || isCreditor) && (
                        <Button
                          label="Settle"
                          size="sm"
                          variant={isDebtor ? 'danger' : 'primary'}
                          onPress={() =>
                            router.push({
                              pathname: '/settle',
                              params: {
                                groupId: id,
                                targetUserId: isDebtor
                                  ? debt.toUserId
                                  : debt.fromUserId,
                                targetName: isDebtor
                                  ? debt.toUser?.fullName
                                  : debt.fromUser?.fullName,
                                amountMinor: debt.amountMinor,
                              },
                            })
                          }
                        />
                      )}
                    </View>
                  </Card>
                );
              })
            ) : (
              <Card padding="md" variant="outlined">
                <Text style={{ color: theme.positive, textAlign: 'center', fontWeight: '600' }}>
                  🎉 All debts in this group are fully settled!
                </Text>
              </Card>
            )}

            {/* Individual Member Balances */}
            <View style={[styles.subSectionHeader, { marginTop: spacing.lg }]}>
              <Text
                style={[
                  styles.subSectionTitle,
                  { color: theme.text, fontSize: typography.fontSize.base },
                ]}
              >
                Member Balances
              </Text>
            </View>

            {balanceData?.memberBalances &&
              balanceData.memberBalances.map((m: any) => (
                <Card
                  key={m.userId}
                  variant="outlined"
                  padding="sm"
                  style={{ marginBottom: 6 }}
                >
                  <View style={styles.memberBalanceRow}>
                    <Avatar name={m.fullName} size="sm" />
                    <Text
                      style={[
                        styles.memberName,
                        { color: theme.text, flex: 1, marginLeft: 10 },
                      ]}
                    >
                      {m.fullName}
                    </Text>
                    <BalancePill
                      amountMinor={m.netBalanceMinor}
                      currency={group?.defaultCurrency || 'INR'}
                    />
                  </View>
                </Card>
              ))}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
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
  headerTitleBox: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 16,
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  addExpBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addExpBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontWeight: '800',
  },
  userGroupBalanceBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
    alignItems: 'center',
  },
  expenseItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expItemTitle: {
    fontWeight: '700',
    fontSize: 14,
  },
  expItemSub: {
    fontSize: 11,
    marginTop: 2,
  },
  expTotalAmount: {
    fontWeight: '700',
    fontSize: 14,
  },
  subSectionHeader: {
    marginBottom: 8,
  },
  subSectionTitle: {
    fontWeight: '700',
  },
  subSectionDesc: {
    marginTop: 2,
    lineHeight: 16,
  },
  debtPlanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  debtPlanTitle: {
    fontSize: 13,
  },
  debtPlanAmount: {
    fontWeight: '800',
    marginTop: 2,
  },
  memberBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    fontWeight: '600',
  },
});
