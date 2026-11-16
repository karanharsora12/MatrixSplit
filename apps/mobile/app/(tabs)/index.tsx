import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
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
  Avatar,
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
import { cn } from '@/lib/utils';

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

type ActivityFilter = 'all' | 'expenses' | 'settlements';

export default function DashboardScreen() {
  const router = useRouter();
  const { isDark } = useWatermelonTheme();
  const user = useAuthStore((s) => s.user);

  const [activeFilter, setActiveFilter] = useState<ActivityFilter>('all');

  const {
    data: overview,
    isLoading: loadingOverview,
    refetch: refetchOverview,
    isRefetching,
  } = useBalanceOverview();

  const {
    data: recentExpenses,
    isLoading: loadingExpenses,
    refetch: refetchExpenses,
  } = useRecentExpenses(10);

  const {
    data: recentSettlements,
    refetch: refetchSettlements,
  } = useRecentSettlements(5);

  const {
    data: groups,
    refetch: refetchGroups,
  } = useMyGroups();

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

  const showExpenses = activeFilter === 'all' || activeFilter === 'expenses';
  const showSettlements = activeFilter === 'all' || activeFilter === 'settlements';

  const filterCounts = useMemo(() => {
    const expCount = recentExpenses?.length || 0;
    const setCount = recentSettlements?.length || 0;
    return {
      all: expCount + setCount,
      expenses: expCount,
      settlements: setCount,
    };
  }, [recentExpenses, recentSettlements]);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className="flex-1 bg-[#090D16]"
    >
      {/* Top Header Bar */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-3.5 border-b border-[#1E293B]">
        {/* Left: Avatar & Greeting */}
        <View className="flex-row items-center flex-1 pr-3">
          <View className="relative">
            <Avatar name={user?.fullName || 'User'} size="md" />
            <View className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#090D16]" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-xs font-medium text-slate-400">
              {getGreeting()},
            </Text>
            <Text
              numberOfLines={1}
              className="text-base font-bold text-white tracking-tight"
            >
              {user?.fullName || 'MatrixSplit User'}
            </Text>
          </View>
        </View>

        {/* Right: Quick action buttons */}
        <View className="flex-row items-center">
          <Pressable
            onPress={handleInviteFriend}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-10 h-10 rounded-full bg-[#141D2E] border border-[#23324D] items-center justify-center active:scale-95 active:bg-[#1E2A42] mr-2.5"
          >
            <Ionicons name="share-social-outline" size={18} color="#94A3B8" />
          </Pressable>
          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-10 h-10 rounded-full bg-[#141D2E] border border-[#23324D] items-center justify-center active:scale-95 active:bg-[#1E2A42]"
          >
            <Ionicons name="settings-outline" size={18} color="#94A3B8" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor="#10B981"
          />
        }
      >
        {/* Balance Card Container */}
        <View className="px-5 pt-4">
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
        </View>

        {/* Quick Action Tiles */}
        <View className="flex-row items-center justify-between px-5 mt-4">
          {/* Add */}
          <Pressable
            onPress={() => router.push('/expense/add')}
            className="flex-1 h-[68px] rounded-2xl bg-emerald-500 items-center justify-center active:scale-95 active:bg-emerald-600 mr-2.5 shadow-sm"
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
            <Text className="text-xs font-bold text-white mt-1">Add</Text>
          </Pressable>

          {/* Settle */}
          <Pressable
            onPress={() => router.push('/settle')}
            className="flex-1 h-[68px] rounded-2xl bg-[#141D2E] border border-[#23324D] items-center justify-center active:scale-95 active:bg-[#1E2A42] mr-2.5"
          >
            <Ionicons name="swap-horizontal" size={22} color="#10B981" />
            <Text className="text-xs font-bold text-slate-200 mt-1">Settle</Text>
          </Pressable>

          {/* Groups */}
          <Pressable
            onPress={() => router.push('/(tabs)/groups')}
            className="flex-1 h-[68px] rounded-2xl bg-[#141D2E] border border-[#23324D] items-center justify-center active:scale-95 active:bg-[#1E2A42] mr-2.5"
          >
            <Ionicons name="people-outline" size={22} color="#94A3B8" />
            <Text className="text-xs font-bold text-slate-200 mt-1">Groups</Text>
          </Pressable>

          {/* Activity */}
          <Pressable
            onPress={() => router.push('/activity' as any)}
            className="flex-1 h-[68px] rounded-2xl bg-[#141D2E] border border-[#23324D] items-center justify-center active:scale-95 active:bg-[#1E2A42]"
          >
            <Ionicons name="pulse-outline" size={22} color="#94A3B8" />
            <Text className="text-xs font-bold text-slate-200 mt-1">Activity</Text>
          </Pressable>
        </View>

        {/* Active Groups Section */}
        <View className="mt-6">
          <View className="flex-row items-center justify-between px-5 mb-3">
            <View className="flex-row items-center">
              <Text className="text-base font-bold text-white tracking-tight">
                Active Groups
              </Text>
              {groups && groups.length > 0 && (
                <View className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 ml-2">
                  <Text className="text-[11px] font-bold text-emerald-400">
                    {groups.length}
                  </Text>
                </View>
              )}
            </View>
            <Pressable
              onPress={() => router.push('/(tabs)/groups')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="active:opacity-70"
            >
              <Text className="text-xs font-bold text-emerald-400">See all</Text>
            </Pressable>
          </View>

          {groups && groups.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 4 }}
            >
              {groups.map((group: any) => {
                const iconName = groupIcons[group.category] || 'folder-outline';
                return (
                  <Pressable
                    key={group.id}
                    onPress={() => router.push(`/group/${group.id}`)}
                    className="w-56 p-4 rounded-2xl bg-[#141D2E] border border-[#23324D] mr-3.5 active:scale-98 active:bg-[#1A263B]"
                  >
                    {/* Top Row: Category Icon & Pill */}
                    <View className="flex-row items-center justify-between">
                      <View className="w-11 h-11 rounded-xl bg-emerald-500/15 items-center justify-center">
                        <Ionicons name={iconName} size={20} color="#10B981" />
                      </View>
                      <View className="px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30">
                        <Text className="text-[10px] font-bold text-blue-400 capitalize">
                          {group.category}
                        </Text>
                      </View>
                    </View>

                    {/* Group Name */}
                    <Text
                      numberOfLines={1}
                      className="text-base font-bold text-white mt-3 mb-1 tracking-tight"
                    >
                      {group.name}
                    </Text>

                    {/* Members Count */}
                    <View className="flex-row items-center mt-0.5">
                      <Ionicons name="people-outline" size={13} color="#94A3B8" />
                      <Text className="text-xs font-medium text-slate-400 ml-1.5">
                        {group.membersCount || 1} {group.membersCount === 1 ? 'member' : 'members'}
                      </Text>
                    </View>

                    {/* Divider */}
                    <View className="h-[1px] bg-[#23324D] my-3" />

                    {/* Footer Row */}
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                        <Text className="text-xs font-semibold text-slate-300">
                          Active Ledger
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={14} color="#64748B" />
                    </View>
                  </Pressable>
                );
              })}

              {/* Create New Group Card */}
              <Pressable
                onPress={() => router.push('/(tabs)/groups')}
                className="w-44 p-4 rounded-2xl border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 items-center justify-center active:scale-98 active:bg-emerald-500/10 mr-5"
              >
                <View className="w-12 h-12 rounded-full bg-emerald-500/20 items-center justify-center mb-2">
                  <Ionicons name="add" size={26} color="#10B981" />
                </View>
                <Text className="text-sm font-bold text-emerald-400">
                  New Group
                </Text>
                <Text className="text-[11px] text-slate-400 mt-0.5 text-center">
                  Create shared ledger
                </Text>
              </Pressable>
            </ScrollView>
          ) : (
            <View className="mx-5 p-4 rounded-2xl bg-[#141D2E] border border-[#23324D] items-center">
              <Text className="text-slate-400 text-xs">
                No groups yet. Tap 'Groups' above to create one!
              </Text>
            </View>
          )}
        </View>

        {/* Recent Activity Section */}
        <View className="mt-7">
          <View className="flex-row items-center justify-between px-5 mb-3">
            <Text className="text-base font-bold text-white tracking-tight">
              Recent Activity
            </Text>
            <Pressable
              onPress={() => router.push('/expense/add')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="active:opacity-70"
            >
              <Text className="text-xs font-bold text-emerald-400">+ Add Expense</Text>
            </Pressable>
          </View>

          {/* Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}
          >
            {[
              { key: 'all' as const, label: 'All', count: filterCounts.all },
              { key: 'expenses' as const, label: 'Expenses', count: filterCounts.expenses },
              { key: 'settlements' as const, label: 'Settlements', count: filterCounts.settlements },
            ].map((f) => {
              const isActive = activeFilter === f.key;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => setActiveFilter(f.key)}
                  className={cn(
                    'h-9 px-4 rounded-full flex-row items-center justify-center mr-2.5 active:scale-95',
                    isActive
                      ? 'bg-emerald-500 shadow-sm'
                      : 'bg-[#141D2E] border border-[#23324D]'
                  )}
                >
                  <Text
                    className={cn(
                      'text-xs font-bold',
                      isActive ? 'text-white' : 'text-slate-300'
                    )}
                  >
                    {f.label}
                  </Text>
                  {f.count > 0 && (
                    <View
                      className={cn(
                        'px-1.5 py-0.5 rounded-full ml-1.5',
                        isActive ? 'bg-white/20' : 'bg-[#1E2A42]'
                      )}
                    >
                      <Text
                        className={cn(
                          'text-[10px] font-bold',
                          isActive ? 'text-white' : 'text-slate-400'
                        )}
                      >
                        {f.count}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Expenses List */}
          {showExpenses && (
            <>
              {loadingExpenses ? (
                <View className="px-5">
                  <SkeletonCard />
                </View>
              ) : recentExpenses && recentExpenses.length > 0 ? (
                recentExpenses.map((exp: any) => {
                  const expIconName = expenseIcons[exp.category] || 'receipt-outline';
                  return (
                    <Pressable
                      key={exp.id}
                      onPress={() => router.push(`/expense/${exp.id}`)}
                      className="mx-5 mb-2.5 p-3.5 rounded-2xl bg-[#141D2E] border border-[#23324D] flex-row items-center justify-between active:scale-98 active:bg-[#1A263B]"
                    >
                      <View className="flex-row items-center flex-1 mr-3">
                        <View className="w-11 h-11 rounded-xl bg-emerald-500/15 items-center justify-center mr-3">
                          <Ionicons name={expIconName} size={20} color="#10B981" />
                        </View>
                        <View className="flex-1">
                          <Text
                            numberOfLines={1}
                            className="text-sm font-bold text-white tracking-tight mb-0.5"
                          >
                            {exp.title}
                          </Text>
                          <Text
                            numberOfLines={1}
                            className="text-xs text-slate-400"
                          >
                            Paid by {exp.payer?.fullName || 'Someone'} ·{' '}
                            {new Date(exp.date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Text>
                        </View>
                      </View>

                      <View className="items-end">
                        <Text className="text-base font-extrabold text-white tracking-tight font-mono">
                          {formatCurrency(exp.totalAmountMinor, exp.currency)}
                        </Text>
                        <View className="px-2 py-0.5 rounded-md bg-emerald-500/15 mt-1 self-end">
                          <Text className="text-[10px] font-bold text-emerald-400">
                            You paid
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })
              ) : activeFilter === 'expenses' ? (
                <View className="mx-5 p-6 rounded-2xl bg-[#141D2E] border border-[#23324D] items-center">
                  <Ionicons name="receipt-outline" size={32} color="#64748B" />
                  <Text className="text-slate-300 font-bold text-sm mt-2">
                    No expenses yet
                  </Text>
                  <Text className="text-slate-400 text-xs mt-1 text-center">
                    Tap '+ Add Expense' above to record shared expenses!
                  </Text>
                </View>
              ) : null}
            </>
          )}

          {/* Settlements List */}
          {showSettlements && recentSettlements && recentSettlements.length > 0 && (
            <>
              {recentSettlements.map((s: any) => (
                <View
                  key={s.id}
                  className="mx-5 mb-2.5 p-3.5 rounded-2xl bg-[#141D2E] border border-[#23324D] flex-row items-center justify-between"
                >
                  <View className="flex-row items-center flex-1 mr-3">
                    <View className="w-11 h-11 rounded-xl bg-blue-500/15 items-center justify-center mr-3">
                      <Ionicons name="checkmark-done" size={20} color="#3B82F6" />
                    </View>
                    <View className="flex-1">
                      <Text
                        numberOfLines={1}
                        className="text-sm font-bold text-white tracking-tight mb-0.5"
                      >
                        {s.payer?.fullName || 'User'} paid {s.payee?.fullName || 'User'}
                      </Text>
                      <Text className="text-xs text-slate-400">
                        via {s.paymentMethod?.toUpperCase() || 'DIRECT'} ·{' '}
                        {new Date(s.settledAt || s.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>

                  <View className="items-end">
                    <Text className="text-base font-extrabold text-emerald-400 tracking-tight font-mono">
                      {formatCurrency(s.amountMinor, s.currency)}
                    </Text>
                    <View className="px-2 py-0.5 rounded-md bg-blue-500/15 mt-1 self-end">
                      <Text className="text-[10px] font-bold text-blue-400">
                        Settled
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Empty state when "all" has no data */}
          {activeFilter === 'all' &&
            (!recentExpenses || recentExpenses.length === 0) &&
            (!recentSettlements || recentSettlements.length === 0) &&
            !loadingExpenses && (
              <View className="mx-5 p-6 rounded-2xl bg-[#141D2E] border border-[#23324D] items-center">
                <Ionicons name="pulse-outline" size={32} color="#64748B" />
                <Text className="text-slate-300 font-bold text-sm mt-2">
                  No recent activity
                </Text>
                <Text className="text-slate-400 text-xs mt-1 text-center">
                  Shared bills and settlements will show up here as they happen.
                </Text>
              </View>
            )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
