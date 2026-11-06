import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  BalanceCard,
  Card,
  Avatar,
  Badge,
  SkeletonCard,
  useWatermelonTheme,
} from '@matrixsplit/watermelon-ui';
import {
  useBalanceOverview,
  useRecentExpenses,
  useRecentSettlements,
  useMyGroups,
} from '../../src/hooks/useQueries';
import { useAuthStore } from '../../src/stores/authStore';
import { formatCurrency, ExpenseCategory, GroupCategory } from '@matrixsplit/shared';

const groupIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  trip: 'airplane-outline',
  home: 'home-outline',
  couple: 'heart-outline',
  family: 'people-outline',
  friends: 'beer-outline',
  other: 'folder-outline',
};

const expenseIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  food_and_drink: 'restaurant-outline',
  groceries: 'cart-outline',
  transport: 'car-outline',
  housing: 'home-outline',
  entertainment: 'film-outline',
  travel: 'airplane-outline',
  utilities: 'flash-outline',
  shopping: 'bag-handle-outline',
  health: 'medkit-outline',
  general: 'receipt-outline',
};

export default function DashboardScreen() {
  const router = useRouter();
  const { theme, typography, spacing, borderRadius } = useWatermelonTheme();
  const user = useAuthStore((s) => s.user);

  const {
    data: overview,
    isLoading: loadingOverview,
    refetch: refetchOverview,
    isRefetching,
  } = useBalanceOverview();

  const { data: recentExpenses, isLoading: loadingExpenses, refetch: refetchExpenses } =
    useRecentExpenses(5);
  const { data: recentSettlements, refetch: refetchSettlements } =
    useRecentSettlements(3);
  const { data: groups, refetch: refetchGroups } = useMyGroups();

  const onRefresh = () => {
    refetchOverview();
    refetchExpenses();
    refetchSettlements();
    refetchGroups();
  };

  const handleInviteFriend = async () => {
    try {
      await Share.share({
        message: `Join me on MatrixSplit to easily split bills, track shared expenses, and settle balances instantly! Connect with my email: ${user?.email || ''}`,
        title: 'MatrixSplit Invite',
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.push('/settings')}
          style={styles.profileBtn}
        >
          <Avatar name={user?.fullName || 'User'} size="sm" />
          <View style={styles.nameContainer}>
            <Text
              style={[
                styles.welcomeText,
                { color: theme.textMuted, fontSize: typography.fontSize.xs },
              ]}
            >
              Good day,
            </Text>
            <Text
              style={[
                styles.userName,
                { color: theme.text, fontSize: typography.fontSize.base },
              ]}
            >
              {user?.fullName || 'MatrixSplit User'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/settings')}
          style={[styles.settingsIconBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <Ionicons name="settings-outline" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Balance Overview Card */}
        {loadingOverview || !overview ? (
          <SkeletonCard />
        ) : (
          <BalanceCard
            totalBalanceMinor={overview.totalBalanceMinor}
            totalYouOweMinor={overview.totalYouOweMinor}
            totalOwedToYouMinor={overview.totalOwedToYouMinor}
            activeGroupsCount={overview.activeGroupsCount}
            currency={overview.currency}
          />
        )}

        {/* Quick Action Buttons Grid */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/expense/add')}
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.primary,
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            <Ionicons name="add-circle" size={24} color="#FFFFFF" />
            <Text style={styles.actionLabel}>Add Expense</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/settle')}
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.secondary,
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            <Ionicons name="swap-horizontal" size={22} color="#FFFFFF" />
            <Text style={styles.actionLabel}>Settle Up</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/groups')}
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                borderWidth: 1,
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            <Ionicons name="people-outline" size={22} color={theme.text} />
            <Text style={[styles.actionLabel, { color: theme.text }]}>
              Create Group
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleInviteFriend}
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                borderWidth: 1,
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            <Ionicons name="share-social-outline" size={20} color={theme.text} />
            <Text style={[styles.actionLabel, { color: theme.text }]}>
              Invite Friend
            </Text>
          </TouchableOpacity>
        </View>

        {/* Active Groups Horizontal List */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.text, fontSize: typography.fontSize.lg },
            ]}
          >
            Active Groups
          </Text>
          <TouchableOpacity onPress={() => router.push('/groups')}>
            <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13 }}>
              See all ›
            </Text>
          </TouchableOpacity>
        </View>

        {groups && groups.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.groupsScroll}
          >
            {groups.map((group: any) => {
              const iconName = groupIcons[group.category] || 'folder-outline';
              return (
                <TouchableOpacity
                  key={group.id}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/group/${group.id}`)}
                  style={[
                    styles.groupCard,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                      borderRadius: borderRadius.lg,
                    },
                  ]}
                >
                  <View style={styles.groupCardTop}>
                    <View
                      style={[
                        styles.groupIconWrapper,
                        { backgroundColor: theme.primaryLight },
                      ]}
                    >
                      <Ionicons name={iconName} size={18} color={theme.primary} />
                    </View>
                    <Badge label={group.category} size="sm" variant="info" />
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[styles.groupName, { color: theme.text }]}
                  >
                    {group.name}
                  </Text>
                  <Text
                    style={[styles.groupMembersText, { color: theme.textMuted }]}
                  >
                    {group.membersCount || 1} members
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <Card padding="md" variant="outlined" style={styles.emptyGroupCard}>
            <Text style={{ color: theme.textMuted, textAlign: 'center' }}>
              No groups yet. Tap 'Create Group' above to get started!
            </Text>
          </Card>
        )}

        {/* Recent Expenses Section */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.text, fontSize: typography.fontSize.lg },
            ]}
          >
            Recent Expenses
          </Text>
          <TouchableOpacity onPress={() => router.push('/expense/add')}>
            <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13 }}>
              + Add
            </Text>
          </TouchableOpacity>
        </View>

        {loadingExpenses ? (
          <SkeletonCard />
        ) : recentExpenses && recentExpenses.length > 0 ? (
          recentExpenses.map((exp: any) => {
            const expIconName = expenseIcons[exp.category] || 'receipt-outline';
            return (
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
                  <View style={styles.expenseRow}>
                    <View
                      style={[
                        styles.categoryIconCircle,
                        { backgroundColor: theme.primaryLight },
                      ]}
                    >
                      <Ionicons name={expIconName} size={18} color={theme.primary} />
                    </View>
                    <View style={styles.expenseInfo}>
                      <Text
                        numberOfLines={1}
                        style={[styles.expenseTitle, { color: theme.text }]}
                      >
                        {exp.title}
                      </Text>
                      <Text
                        style={[styles.expenseMeta, { color: theme.textMuted }]}
                      >
                        Paid by {exp.payer?.fullName || 'Someone'} •{' '}
                        {new Date(exp.date).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.expenseAmount,
                        { color: theme.text, fontSize: typography.fontSize.base },
                      ]}
                    >
                      {formatCurrency(exp.totalAmountMinor, exp.currency)}
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        ) : (
          <Card padding="md" variant="outlined">
            <Text style={{ color: theme.textMuted, textAlign: 'center' }}>
              No expenses recorded yet.
            </Text>
          </Card>
        )}

        {/* Recent Settlements Section */}
        {recentSettlements && recentSettlements.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.text, fontSize: typography.fontSize.lg },
                ]}
              >
                Recent Settlements
              </Text>
            </View>

            {recentSettlements.map((s: any) => (
              <Card
                key={s.id}
                variant="outlined"
                padding="sm"
                style={{ marginBottom: spacing.sm }}
              >
                <View style={styles.settlementRow}>
                  <View
                    style={[
                      styles.categoryIconCircle,
                      { backgroundColor: theme.positiveBg },
                    ]}
                  >
                    <Ionicons name="checkmark-done-outline" size={18} color={theme.positive} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text
                      style={[
                        styles.settlementTitle,
                        { color: theme.text, fontSize: typography.fontSize.sm },
                      ]}
                    >
                      {s.payer?.fullName} paid {s.receiver?.fullName}
                    </Text>
                    <Text
                      style={[
                        styles.settlementMethod,
                        { color: theme.textMuted, fontSize: typography.fontSize.xs },
                      ]}
                    >
                      Method: {s.paymentMethod.toUpperCase()}
                    </Text>
                  </View>
                  <Badge
                    label={s.status}
                    size="sm"
                    variant={s.status === 'confirmed' ? 'positive' : 'warning'}
                  />
                </View>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameContainer: {
    marginLeft: 10,
  },
  welcomeText: {
    fontWeight: '500',
  },
  userName: {
    fontWeight: '700',
  },
  settingsIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTitle: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  groupsScroll: {
    marginBottom: 20,
  },
  groupCard: {
    width: 140,
    padding: 12,
    borderWidth: 1,
    marginRight: 10,
  },
  groupCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  groupIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupName: {
    fontWeight: '700',
    fontSize: 13,
  },
  groupMembersText: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyGroupCard: {
    marginBottom: 16,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseInfo: {
    flex: 1,
    marginLeft: 12,
  },
  expenseTitle: {
    fontWeight: '700',
    fontSize: 14,
  },
  expenseMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  expenseAmount: {
    fontWeight: '800',
  },
  settlementRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settlementTitle: {
    fontWeight: '700',
  },
  settlementMethod: {
    marginTop: 2,
  },
});
