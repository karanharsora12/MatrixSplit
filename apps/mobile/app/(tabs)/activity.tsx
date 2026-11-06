import React from 'react';
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
  useWatermelonTheme,
} from '@matrixsplit/watermelon-ui';
import { useActivities } from '../../src/hooks/useQueries';

const activityIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  expense_created: 'receipt-outline',
  expense_updated: 'create-outline',
  expense_deleted: 'trash-outline',
  settlement_created: 'paper-plane-outline',
  settlement_confirmed: 'checkmark-circle-outline',
  settlement_rejected: 'close-circle-outline',
  group_created: 'people-circle-outline',
  member_joined: 'person-add-outline',
  member_removed: 'exit-outline',
  friend_request_sent: 'mail-outline',
  friend_request_accepted: 'people-outline',
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.headerBar}>
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
            const iconName = activityIcons[act.type] || 'flash-outline';
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
                        { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 },
                      ]}
                    >
                      <Ionicons name={iconName} size={11} color={theme.primary} />
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
            <Ionicons name="flash-outline" size={48} color={theme.textMuted} style={{ marginBottom: 12 }} />
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
    paddingTop: 10,
    paddingBottom: 8,
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
