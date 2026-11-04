import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Avatar,
  SkeletonCard,
  useWatermelonTheme,
} from '@matrixsplit/watermelon-ui';
import { useActivities } from '../../src/hooks/useQueries';

const activityIcons: Record<string, string> = {
  expense_created: '💳',
  expense_updated: '✏️',
  expense_deleted: '🗑️',
  settlement_created: '💸',
  settlement_confirmed: '✅',
  settlement_rejected: '❌',
  group_created: '🎉',
  member_joined: '👋',
  member_removed: '🚪',
  friend_request_sent: '✉️',
  friend_request_accepted: '🤝',
};

export default function ActivityScreen() {
  const { theme, typography, spacing } = useWatermelonTheme();
  const { data: activities, isLoading, refetch, isRefetching } = useActivities(30);

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.headerBar,
          { backgroundColor: theme.surface, borderBottomColor: theme.divider },
        ]}
      >
        <Text
          style={[
            styles.headerTitle,
            { color: theme.text, fontSize: typography.fontSize['2xl'] },
          ]}
        >
          Activity
        </Text>
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
        ) : activities && activities.length > 0 ? (
          activities.map((act: any) => {
            const icon = activityIcons[act.type] || '⚡';
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
                        { backgroundColor: theme.surface },
                      ]}
                    >
                      <Text style={{ fontSize: 10 }}>{icon}</Text>
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
            <Text style={{ fontSize: 44, marginBottom: 12 }}>⚡</Text>
            <Text
              style={[
                styles.emptyTitle,
                { color: theme.text, fontSize: typography.fontSize.lg },
              ]}
            >
              No activity yet
            </Text>
            <Text
              style={[
                styles.emptyDesc,
                { color: theme.textMuted, fontSize: typography.fontSize.sm },
              ]}
            >
              Your shared expenses, payments, and group actions will appear here
              in real time.
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
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
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
    bottom: -2,
    right: -2,
    borderRadius: 8,
    padding: 1,
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
  },
  activityText: {
    lineHeight: 18,
  },
  timestamp: {
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 50,
  },
  emptyTitle: {
    fontWeight: '700',
  },
  emptyDesc: {
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 280,
  },
});
