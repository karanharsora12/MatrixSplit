import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
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
} from '@/components';
import { useWatermelonTheme } from '@/theme';
import {
  useBalanceOverview,
  useRecentExpenses,
  useRecentSettlements,
  useMyGroups,
} from '../../src/hooks/useQueries';
import { useAuthStore } from '../../src/stores/authStore';
import { useThemeStore } from '../../src/stores/themeStore';
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
  const { theme, typography, spacing, borderRadius, isDark } = useWatermelonTheme();
  const { toggleTheme } = useThemeStore();
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
        <Pressable
          onPress={() => router.push('/settings')}
          style={({ pressed }) => [styles.profileBtn, { opacity: pressed ? 0.8 : 1 }]}
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
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            onPress={toggleTheme}
            style={({ pressed }) => [
              styles.settingsIconBtn,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                marginRight: 8,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons
              name={isDark ? 'sunny' : 'moon'}
              size={18}
              color={isDark ? '#F59E0B' : theme.text}
            />
          </Pressable>

          <Pressable
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [
              styles.settingsIconBtn,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons name="settings-outline" size={20} color={theme.text} />
          </Pressable>
        </View>
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
          <Pressable
            onPress={() => router.push('/expense/add')}
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: theme.primary,
                borderRadius: borderRadius.lg,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Ionicons name="add-circle" size={24} color="#FFFFFF" />
            <Text style={styles.actionLabel}>Add Expense</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/settle')}
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: theme.secondary,
                borderRadius: borderRadius.lg,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Ionicons name="swap-horizontal" size={22} color="#FFFFFF" />
            <Text style={styles.actionLabel}>Settle Up</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/groups')}
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                borderWidth: 1,
                borderRadius: borderRadius.lg,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Ionicons name="people-outline" size={22} color={theme.text} />
            <Text style={[styles.actionLabel, { color: theme.text }]}>
              Create Group
            </Text>
          </Pressable>

          <Pressable
            onPress={handleInviteFriend}
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                borderWidth: 1,
                borderRadius: borderRadius.lg,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Ionicons name="share-social-outline" size={20} color={theme.text} />
            <Text style={[styles.actionLabel, { color: theme.text }]}>
              Invite Friend
            </Text>
          </Pressable>
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
          <Pressable
            onPress={() => router.push('/(tabs)/groups')}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13 }}>
              See all ›
            </Text>
          </Pressable>
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
                <Pressable
                  key={group.id}
                  onPress={() => router.push(`/group/${group.id}`)}
                  style={({ pressed }) => [
                    styles.groupCard,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                      borderRadius: borderRadius.lg,
                      opacity: pressed ? 0.85 : 1,
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
                </Pressable>
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
          <Pressable
            onPress={() => router.push('/expense/add')}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13 }}>
              + Add
            </Text>
          </Pressable>
        </View>

        {loadingExpenses ? (
          <SkeletonCard />
        ) : recentExpenses && recentExpenses.length > 0 ? (
          recentExpenses.map((exp: any) => {
            const expIconName = expenseIcons[exp.category] || 'receipt-outline';
            return (
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
              </Pressable>
            );
          })
        ) : (
          <Card padding="md" variant="outlined">
            <Text style={{ color: theme.textMuted, textAlign: 'center' }}>
              No expenses recorded yet. Tap '+ Add' above to record your first expense!
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
    fontWeight: '600',
    fontSize: 11,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  groupsScroll: {
    marginBottom: 20,
  },
  groupCard: {
    width: 140,
    padding: 12,
    marginRight: 10,
    borderWidth: 1,
  },
  groupCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  groupIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupName: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 2,
  },
  groupMembersText: {
    fontSize: 12,
  },
  emptyGroupCard: {
    marginBottom: 20,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontWeight: '600',
    fontSize: 14,
  },
  expenseMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  expenseAmount: {
    fontWeight: '700',
  },
  settlementRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settlementTitle: {
    fontWeight: '600',
  },
  settlementMethod: {
    marginTop: 2,
  },
});
