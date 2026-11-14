import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  Card,
  Avatar,
  SkeletonCard,
} from '@/components';
import { useWatermelonTheme } from '@/theme';
import { useActivities } from '../../src/hooks/useQueries';

const activityMeta: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }
> = {
  expense_created: { icon: 'receipt-outline', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  expense_updated: { icon: 'create-outline', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  expense_deleted: { icon: 'trash-outline', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  settlement_created: { icon: 'swap-horizontal', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  settlement_confirmed: { icon: 'checkmark-circle', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  settlement_rejected: { icon: 'close-circle', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  group_created: { icon: 'people-circle-outline', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  member_joined: { icon: 'person-add-outline', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  member_removed: { icon: 'exit-outline', color: '#64748B', bg: 'rgba(100,116,139,0.12)' },
  friend_request_sent: { icon: 'mail-outline', color: '#06B6D4', bg: 'rgba(6,182,212,0.12)' },
  friend_request_accepted: { icon: 'people-outline', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
};

export default function ActivityScreen() {
  const { theme, typography, spacing, borderRadius, isDark } = useWatermelonTheme();
  const { data: activities, isLoading, refetch, isRefetching } = useActivities(40);
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
    return new Date(dateStr).toLocaleDateString();
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
            Activity Feed
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
            Real-time audit log of expenses and payments
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {[
            { id: 'all', label: 'All Activities', icon: 'flash-outline' },
            { id: 'expense', label: 'Expenses', icon: 'receipt-outline' },
            { id: 'settlement', label: 'Settlements', icon: 'swap-horizontal-outline' },
            { id: 'group', label: 'Groups', icon: 'people-outline' },
          ].map((item) => {
            const isSelected = filterType === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setFilterType(item.id as any)}
                style={({ pressed }) => [
                  styles.filterTab,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.surface,
                    borderColor: isSelected ? theme.primary : theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={14}
                  color={isSelected ? '#FFFFFF' : theme.textMuted}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.filterTabText,
                    {
                      color: isSelected ? '#FFFFFF' : theme.text,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
          </>
        ) : filteredActivities && filteredActivities.length > 0 ? (
          filteredActivities.map((act: any) => {
            const meta = activityMeta[act.type] || {
              icon: 'flash-outline',
              color: theme.primary,
              bg: 'rgba(16,185,129,0.12)',
            };

            return (
              <Card
                key={act.id}
                variant="outlined"
                padding="sm"
                style={{ marginBottom: spacing.sm }}
              >
                <View style={styles.activityRow}>
                  <View style={styles.actorAvatarContainer}>
                    <Avatar name={act.actor?.fullName || 'User'} size="sm" />
                    <View
                      style={[
                        styles.iconBadge,
                        {
                          backgroundColor: meta.bg,
                          borderColor: theme.surface,
                          borderWidth: 1.5,
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
                      <Text style={{ fontWeight: '700' }}>
                        {act.actor?.fullName || 'Someone'}{' '}
                      </Text>
                      {act.description}
                    </Text>

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
              </Card>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                {
                  backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#D1FAE5',
                  borderRadius: borderRadius.full,
                },
              ]}
            >
              <Ionicons name="flash-outline" size={44} color={theme.primary} />
            </View>
            <Text
              style={[
                styles.emptyTitle,
                { color: theme.text, fontSize: typography.fontSize.xl },
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
              Your shared expenses, payments, and group actions will automatically appear here.
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
    paddingBottom: 8,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    marginRight: 8,
  },
  filterTabText: {
    fontSize: 12,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 6,
    paddingBottom: 40,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 2,
  },
  actorAvatarContainer: {
    position: 'relative',
  },
  iconBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  activityText: {
    lineHeight: 19,
  },
  timestamp: {
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyDesc: {
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 290,
  },
});
