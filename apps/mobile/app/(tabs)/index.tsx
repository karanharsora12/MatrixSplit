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
import { Ionicons } from '@expo/vector-icons';
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
import { formatCurrency } from '@matrixsplit/shared';

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
  const { theme, isDark } = useWatermelonTheme();
  const user = useAuthStore((s) => s.user);

  const {
    data: overview,
    isLoading: loadingOverview,
    refetch: refetchOverview,
    isRefetching,
  } = useBalanceOverview();

  const { data: recentExpenses, isLoading: loadingExpenses, refetch: refetchExpenses } =
    useRecentExpenses(6);
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: isDark ? '#090D16' : '#F8FAFC' }]}>
      {/* Top Header */}
      <View style={[styles.topBar, { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
        <Pressable
          onPress={() => router.push('/settings')}
          style={({ pressed }) => [styles.profileBtn, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Avatar name={user?.fullName || 'User'} size="md" />
          <View style={styles.nameContainer}>
            <Text style={[styles.welcomeText, { color: theme.textMuted }]}>
              {getGreeting()},
            </Text>
            <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
              {user?.fullName || 'MatrixSplit User'}
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => router.push('/settings')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={({ pressed }) => [
            styles.settingsIconBtn,
            {
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Ionicons name="settings-outline" size={19} color={theme.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
            className="flex-1"
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: pressed ? '#059669' : '#10B981',
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="add" size={22} color="#FFFFFF" />
              <Text style={[styles.actionLabel, { color: '#FFFFFF' }]}>Add</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push('/settle')}
            className="flex-1"
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: pressed
                  ? (isDark ? '#1E293B' : '#F1F5F9')
                  : (isDark ? '#111827' : '#FFFFFF'),
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
                borderWidth: 1,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="swap-horizontal" size={20} color="#10B981" />
              <Text style={[styles.actionLabel, { color: theme.text }]}>Settle</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/groups')}
            className="flex-1"
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: pressed
                  ? (isDark ? '#1E293B' : '#F1F5F9')
                  : (isDark ? '#111827' : '#FFFFFF'),
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
                borderWidth: 1,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="people-outline" size={20} color={theme.text} />
              <Text style={[styles.actionLabel, { color: theme.text }]}>Groups</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={handleInviteFriend}
            className="flex-1"
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: pressed
                  ? (isDark ? '#1E293B' : '#F1F5F9')
                  : (isDark ? '#111827' : '#FFFFFF'),
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
                borderWidth: 1,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="share-social-outline" size={19} color={theme.text} />
              <Text style={[styles.actionLabel, { color: theme.text }]}>Invite</Text>
            </View>
          </Pressable>
        </View>

        {/* Active Groups Horizontal List */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Active Groups
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/groups')}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13 }}>
              See all
            </Text>
          </Pressable>
        </View>

        {groups && groups.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.groupsScrollContent}
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
                      backgroundColor: isDark ? '#111827' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                      opacity: pressed ? 0.85 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}
                >
                  <View style={{ width: '100%' }}>
                    <View style={styles.groupCardTop}>
                      <View
                        style={[
                          styles.groupIconWrapper,
                          {
                            backgroundColor: isDark ? 'rgba(16,185,129,0.18)' : '#D1FAE5',
                          },
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
                    <Text style={[styles.groupMembersText, { color: theme.textMuted }]}>
                      {group.membersCount || 1} members
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <Card padding="md" variant="outlined" style={styles.emptyGroupCard}>
            <Text style={{ color: theme.textMuted, textAlign: 'center', fontSize: 13 }}>
              No groups yet. Tap 'Groups' above to create one!
            </Text>
          </Card>
        )}

        {/* Recent Expenses Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
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
                className="w-full"
                style={({ pressed }) => [
                  styles.expenseListItem,
                  {
                    backgroundColor: isDark ? '#111827' : '#FFFFFF',
                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    opacity: pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.99 : 1 }],
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                  <View
                    style={[
                      styles.categoryIconCircle,
                      {
                        backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#D1FAE5',
                      },
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
                    <Text style={[styles.expenseMeta, { color: theme.textMuted }]}>
                      Paid by {exp.payer?.fullName || 'Someone'} ·{' '}
                      {new Date(exp.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.expenseAmount,
                      { color: theme.text },
                    ]}
                  >
                    {formatCurrency(exp.totalAmountMinor, exp.currency)}
                  </Text>
                </View>
              </Pressable>
            );
          })
        ) : (
          <Card padding="md" variant="outlined">
            <Text style={{ color: theme.textMuted, textAlign: 'center', fontSize: 13 }}>
              No expenses recorded yet. Tap '+ Add' above to record your first expense!
            </Text>
          </Card>
        )}

        {/* Recent Settlements Section */}
        {recentSettlements && recentSettlements.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Recent Settlements
              </Text>
            </View>

            {recentSettlements.map((s: any) => (
              <View
                key={s.id}
                style={[
                  styles.settlementListItem,
                  {
                    backgroundColor: isDark ? '#111827' : '#FFFFFF',
                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                  <View
                    style={[
                      styles.categoryIconCircle,
                      {
                        backgroundColor: isDark ? 'rgba(16,185,129,0.18)' : '#D1FAE5',
                      },
                    ]}
                  >
                    <Ionicons name="checkmark-done" size={18} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text
                      style={[
                        styles.settlementTitle,
                        { color: theme.text },
                      ]}
                    >
                      {s.payer?.fullName || 'User'} paid {s.payee?.fullName || 'User'}
                    </Text>
                    <Text style={[styles.settlementMeta, { color: theme.textMuted }]}>
                      via {s.paymentMethod?.toUpperCase() || 'DIRECT'} ·{' '}
                      {new Date(s.settledAt || s.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  <Text style={styles.settlementAmount}>
                    {formatCurrency(s.amountMinor, s.currency)}
                  </Text>
                </View>
              </View>
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
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nameContainer: {
    marginLeft: 10,
    flex: 1,
  },
  welcomeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  settingsIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 36,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 22,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontWeight: '700',
    fontSize: 12,
    marginTop: 4,
    letterSpacing: -0.2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  groupsScrollContent: {
    gap: 12,
    paddingRight: 8,
    marginBottom: 20,
  },
  groupCard: {
    width: 148,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  groupCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  groupIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupName: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  groupMembersText: {
    fontSize: 12,
  },
  emptyGroupCard: {
    marginBottom: 20,
  },
  expenseListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  categoryIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  expenseTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  expenseMeta: {
    fontSize: 12,
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  settlementListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  settlementTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  settlementMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  settlementAmount: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    color: '#10B981',
    letterSpacing: -0.2,
  },
});
