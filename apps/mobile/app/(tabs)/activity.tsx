import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, SkeletonCard } from '@/components';
import { useWatermelonTheme } from '@/theme';
import { useActivities } from '../../src/hooks/useQueries';
import { cn } from '@/lib/utils';

const activityMeta: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }
> = {
  expense_created: { icon: 'receipt-outline', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  expense_updated: { icon: 'create-outline', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  expense_deleted: { icon: 'trash-outline', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  settlement_created: { icon: 'swap-horizontal', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  settlement_confirmed: { icon: 'checkmark-circle', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  settlement_rejected: { icon: 'close-circle', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  group_created: { icon: 'people-circle-outline', color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
  member_joined: { icon: 'person-add-outline', color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
  member_removed: { icon: 'exit-outline', color: '#64748B', bg: 'rgba(100,116,139,0.15)' },
  friend_request_sent: { icon: 'mail-outline', color: '#06B6D4', bg: 'rgba(6,182,212,0.15)' },
  friend_request_accepted: { icon: 'people-outline', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
};

export default function ActivityScreen() {
  const { isDark } = useWatermelonTheme();
  const { data: activities, isLoading, refetch, isRefetching } = useActivities(50);
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'settlement' | 'group'>('all');

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredActivities = useMemo(() => {
    if (!activities) return [];
    if (filterType === 'all') return activities;
    return activities.filter((act: any) => {
      if (filterType === 'expense') return act.type.startsWith('expense');
      if (filterType === 'settlement') return act.type.startsWith('settlement');
      if (filterType === 'group') return act.type.startsWith('group') || act.type.startsWith('member');
      return true;
    });
  }, [activities, filterType]);

  const counts = useMemo(() => {
    if (!activities) return { all: 0, expense: 0, settlement: 0, group: 0 };
    let expense = 0;
    let settlement = 0;
    let group = 0;
    activities.forEach((act: any) => {
      if (act.type.startsWith('expense')) expense++;
      else if (act.type.startsWith('settlement')) settlement++;
      else if (act.type.startsWith('group') || act.type.startsWith('member')) group++;
    });
    return { all: activities.length, expense, settlement, group };
  }, [activities]);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className={cn('flex-1', isDark ? 'bg-[#090D16]' : 'bg-[#F8FAFC]')}
    >
      {/* Top Header */}
      <View
        className={cn(
          'px-5 pt-2 pb-3.5 border-b',
          isDark ? 'border-[#1E293B]' : 'border-slate-200'
        )}
      >
        <Text
          className={cn(
            'text-2xl font-extrabold tracking-tight',
            isDark ? 'text-white' : 'text-slate-900'
          )}
        >
          Activity
        </Text>
        <Text className="text-xs text-slate-400 mt-0.5">
          Real-time audit log of ledger events & updates
        </Text>
      </View>

      {/* Filter Tabs */}
      <View className="pt-3 pb-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 6 }}
        >
          {[
            { key: 'all' as const, label: 'All', badge: counts.all },
            { key: 'expense' as const, label: 'Expenses', badge: counts.expense },
            { key: 'settlement' as const, label: 'Settlements', badge: counts.settlement },
            { key: 'group' as const, label: 'Groups', badge: counts.group },
          ].map((item) => {
            const isSelected = filterType === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setFilterType(item.key)}
                className={cn(
                  'h-9 px-4 rounded-full flex-row items-center justify-center mr-2.5 active:scale-95',
                  isSelected
                    ? 'bg-emerald-500 shadow-sm'
                    : isDark
                    ? 'bg-[#141D2E] border border-[#23324D]'
                    : 'bg-white border border-slate-200'
                )}
              >
                <Text
                  className={cn(
                    'text-xs font-bold',
                    isSelected
                      ? 'text-white'
                      : isDark
                      ? 'text-slate-300'
                      : 'text-slate-700'
                  )}
                >
                  {item.label}
                </Text>
                {item.badge !== undefined && (
                  <View
                    className={cn(
                      'px-1.5 py-0.5 rounded-full ml-1.5',
                      isSelected
                        ? 'bg-white/20'
                        : isDark
                        ? 'bg-[#1E2A42]'
                        : 'bg-slate-100'
                    )}
                  >
                    <Text
                      className={cn(
                        'text-[10px] font-bold',
                        isSelected
                          ? 'text-white'
                          : isDark
                          ? 'text-slate-400'
                          : 'text-slate-600'
                      )}
                    >
                      {item.badge}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#10B981"
          />
        }
      >
        {isLoading ? (
          <View className="px-5 pt-2">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : filteredActivities && filteredActivities.length > 0 ? (
          filteredActivities.map((act: any) => {
            const meta = activityMeta[act.type] || {
              icon: 'flash-outline',
              color: '#10B981',
              bg: 'rgba(16,185,129,0.15)',
            };

            return (
              <View
                key={act.id}
                className={cn(
                  'mx-5 mb-2.5 p-3.5 rounded-2xl border flex-row items-center',
                  isDark
                    ? 'bg-[#141D2E] border-[#23324D]'
                    : 'bg-white border-slate-200 shadow-sm shadow-black/5'
                )}
              >
                {/* Actor Avatar with event badge */}
                <View className="relative mr-3">
                  <Avatar name={act.actor?.fullName || 'User'} size="md" />
                  <View
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full items-center justify-center border-2"
                    style={{
                      backgroundColor: meta.color,
                      borderColor: isDark ? '#141D2E' : '#FFFFFF',
                    }}
                  >
                    <Ionicons name={meta.icon} size={11} color="#FFFFFF" />
                  </View>
                </View>

                {/* Event Description */}
                <View className="flex-1">
                  <Text
                    className={cn(
                      'text-xs leading-5',
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    )}
                  >
                    <Text
                      className={cn(
                        'font-bold',
                        isDark ? 'text-white' : 'text-slate-900'
                      )}
                    >
                      {act.actor?.fullName || 'Someone'}{' '}
                    </Text>
                    {act.description}
                  </Text>

                  <View className="flex-row items-center mt-1">
                    <Ionicons
                      name="time-outline"
                      size={12}
                      color="#64748B"
                      style={{ marginRight: 4 }}
                    />
                    <Text className="text-[11px] text-slate-400">
                      {formatTimeAgo(act.createdAt)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View
            className={cn(
              'mx-5 my-10 p-8 rounded-3xl border items-center',
              isDark ? 'bg-[#141D2E] border-[#23324D]' : 'bg-white border-slate-200 shadow-sm'
            )}
          >
            <View className="w-16 h-16 rounded-full bg-emerald-500/15 items-center justify-center mb-3">
              <Ionicons name="pulse-outline" size={36} color="#10B981" />
            </View>
            <Text
              className={cn(
                'text-base font-bold mt-1',
                isDark ? 'text-white' : 'text-slate-900'
              )}
            >
              No activities found
            </Text>
            <Text className="text-xs text-slate-400 text-center mt-1 leading-5 max-w-[270px]">
              Shared bills, settlement records, and group updates will appear here in real time.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
