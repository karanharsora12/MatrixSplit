import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  Card,
  Avatar,
  SkeletonCard,
  SegmentedControl,
} from '@/components';
import { useWatermelonTheme } from '@/theme';
import { useActivities } from '../../src/hooks/useQueries';

const activityMeta: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }
> = {
  expense_created: { icon: 'receipt-outline', color: '#10B981', bg: 'rgba(16,185,129,0.14)' },
  expense_updated: { icon: 'create-outline', color: '#F59E0B', bg: 'rgba(245,158,11,0.14)' },
  expense_deleted: { icon: 'trash-outline', color: '#EF4444', bg: 'rgba(239,68,68,0.14)' },
  settlement_created: { icon: 'swap-horizontal', color: '#3B82F6', bg: 'rgba(59,130,246,0.14)' },
  settlement_confirmed: { icon: 'checkmark-circle', color: '#10B981', bg: 'rgba(16,185,129,0.14)' },
  settlement_rejected: { icon: 'close-circle', color: '#EF4444', bg: 'rgba(239,68,68,0.14)' },
  group_created: { icon: 'people-circle-outline', color: '#8B5CF6', bg: 'rgba(139,92,246,0.14)' },
  member_joined: { icon: 'person-add-outline', color: '#8B5CF6', bg: 'rgba(139,92,246,0.14)' },
  member_removed: { icon: 'exit-outline', color: '#64748B', bg: 'rgba(100,116,139,0.14)' },
  friend_request_sent: { icon: 'mail-outline', color: '#06B6D4', bg: 'rgba(6,182,212,0.14)' },
  friend_request_accepted: { icon: 'people-outline', color: '#10B981', bg: 'rgba(16,185,129,0.14)' },
};

export default function ActivityScreen() {
  const { theme, typography, spacing, borderRadius, isDark } = useWatermelonTheme();
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.headerBar}>
        <View>
          <Text
            style={[
              styles.headerTitle,
              { color: theme.text, fontSize: typography.fontSize['2xl'] },
            ]}
          >
            Activity
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
            Real-time audit log of ledger events & updates
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterSection}>
        <SegmentedControl
          value={filterType}
          onChange={(val) => setFilterType(val as any)}
          options={[
            { value: 'all', label: 'All', badge: counts.all },
            { value: 'expense', label: 'Expenses', badge: counts.expense },
            { value: 'settlement', label: 'Settlements', badge: counts.settlement },
            { value: 'group', label: 'Groups', badge: counts.group },
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
      >
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filteredActivities && filteredActivities.length > 0 ? (
          filteredActivities.map((act: any) => {
            const meta = activityMeta[act.type] || {
              icon: 'flash-outline',
              color: theme.primary,
              bg: 'rgba(16,185,129,0.14)',
            };

            return (
              <Card
                key={act.id}
                variant="outlined"
                padding="md"
                style={{ marginBottom: 10 }}
              >
                <View style={styles.activityRow}>
                  <View style={styles.actorAvatarContainer}>
                    <Avatar name={act.actor?.fullName || 'User'} size="md" />
                    <View
                      style={[
                        styles.iconBadge,
                        {
                          backgroundColor: meta.bg,
                          borderColor: isDark ? '#111827' : '#FFFFFF',
                          borderWidth: 2,
                        },
                      ]}
                    >
                      <Ionicons name={meta.icon} size={11} color={meta.color} />
                    </View>
                  </View>

                  <View style={styles.activityContent}>
                    <Text
                      style={[
                        styles.activityText,
                        { color: theme.text, fontSize: typography.fontSize.sm },
                      ]}
                    >
                      <Text style={{ fontWeight: '700', color: theme.text }}>
                        {act.actor?.fullName || 'Someone'}{' '}
                      </Text>
                      {act.description}
                    </Text>

                    <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={12} color={theme.textMuted} style={{ marginRight: 4 }} />
                      <Text
                        style={[
                          styles.timestamp,
                          { color: theme.textMuted, fontSize: typography.fontSize.xs },
                        ]}
                      >
                        {formatTimeAgo(act.createdAt)}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                {
                  backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : '#D1FAE5',
                  borderRadius: borderRadius.full,
                },
              ]}
            >
              <Ionicons name="pulse-outline" size={42} color={theme.primary} />
            </View>
            <Text
              style={[
                styles.emptyTitle,
                { color: theme.text, fontSize: typography.fontSize.lg },
              ]}
            >
              No activities found
            </Text>
            <Text
              style={[
                styles.emptyDesc,
                { color: theme.textMuted, fontSize: typography.fontSize.sm },
              ]}
            >
              Shared bills, settlement records, and group invitations will appear here as they occur.
            </Text>
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actorAvatarContainer: {
    position: 'relative',
  },
  iconBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
  },
  activityText: {
    lineHeight: 19,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {},
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyDesc: {
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 290,
  },
});
