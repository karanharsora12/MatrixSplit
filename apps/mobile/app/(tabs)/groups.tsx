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
import { useRouter } from 'expo-router';
import {
  Card,
  Button,
  Badge,
  Input,
  BottomSheet,
  SkeletonCard,
  useWatermelonTheme,
} from '@matrixsplit/watermelon-ui';
import { useMyGroups, useCreateGroup, useJoinGroup } from '../../src/hooks/useQueries';
import { GroupCategory } from '@matrixsplit/shared';

const categoryIcons: Record<string, string> = {
  trip: '✈️',
  home: '🏠',
  couple: '❤️',
  family: '👨‍👩‍👧',
  friends: '🍻',
  other: '📁',
};

export default function GroupsScreen() {
  const router = useRouter();
  const { theme, typography, spacing, borderRadius } = useWatermelonTheme();

  const { data: groups, isLoading, refetch, isRefetching } = useMyGroups();
  const createGroupMutation = useCreateGroup();
  const joinGroupMutation = useJoinGroup();

  const [createSheetVisible, setCreateSheetVisible] = useState(false);
  const [joinSheetVisible, setJoinSheetVisible] = useState(false);

  // Form states
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [category, setCategory] = useState<GroupCategory>('trip');
  const [inviteCodeInput, setInviteCodeInput] = useState('');

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('Required', 'Group name is required');
      return;
    }

    try {
      await createGroupMutation.mutateAsync({
        name: groupName.trim(),
        description: groupDesc.trim() || undefined,
        category,
        defaultCurrency: 'INR',
      });
      setCreateSheetVisible(false);
      setGroupName('');
      setGroupDesc('');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create group');
    }
  };

  const handleJoin = async () => {
    if (!inviteCodeInput.trim()) {
      Alert.alert('Required', 'Invite code is required');
      return;
    }

    try {
      await joinGroupMutation.mutateAsync(inviteCodeInput.trim().toUpperCase());
      setJoinSheetVisible(false);
      setInviteCodeInput('');
      Alert.alert('Success', 'Successfully joined group!');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Invalid invite code');
    }
  };

  const categories: GroupCategory[] = [
    'trip',
    'home',
    'couple',
    'family',
    'friends',
    'other',
  ];

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
          Groups
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setJoinSheetVisible(true)}
            style={[
              styles.joinBtn,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Text
              style={[
                styles.joinBtnText,
                { color: theme.text, fontSize: typography.fontSize.sm },
              ]}
            >
              Join
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setCreateSheetVisible(true)}
            style={[styles.addBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.addBtnText}>+ Create</Text>
          </TouchableOpacity>
        </View>
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
          </>
        ) : groups && groups.length > 0 ? (
          groups.map((group: any) => {
            const icon = categoryIcons[group.category] || '📁';
            return (
              <TouchableOpacity
                key={group.id}
                activeOpacity={0.85}
                onPress={() => router.push(`/group/${group.id}`)}
              >
                <Card
                  variant="outlined"
                  padding="md"
                  style={{ marginBottom: spacing.md }}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.groupInfoLeft}>
                      <View
                        style={[
                          styles.categoryIconCircle,
                          { backgroundColor: theme.primaryLight },
                        ]}
                      >
                        <Text style={{ fontSize: 24 }}>{icon}</Text>
                      </View>
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text
                          style={[
                            styles.groupTitle,
                            { color: theme.text, fontSize: typography.fontSize.lg },
                          ]}
                        >
                          {group.name}
                        </Text>
                        <Text
                          style={[
                            styles.groupSub,
                            { color: theme.textMuted, fontSize: typography.fontSize.xs },
                          ]}
                        >
                          {group.membersCount || 1} members • Invite:{' '}
                          <Text style={{ fontWeight: '700' }}>
                            {group.inviteCode}
                          </Text>
                        </Text>
                      </View>
                    </View>
                    <Badge label={group.category} size="sm" variant="info" />
                  </View>

                  {group.description ? (
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.descriptionText,
                        { color: theme.textMuted, fontSize: typography.fontSize.sm },
                      ]}
                    >
                      {group.description}
                    </Text>
                  ) : null}
                </Card>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🌴</Text>
            <Text
              style={[
                styles.emptyTitle,
                { color: theme.text, fontSize: typography.fontSize.xl },
              ]}
            >
              No groups yet
            </Text>
            <Text
              style={[
                styles.emptyDesc,
                { color: theme.textMuted, fontSize: typography.fontSize.sm },
              ]}
            >
              Create a group for your apartment, road trip, dinner party, or
              vacation to split expenses easily.
            </Text>
            <Button
              label="+ Create Your First Group"
              onPress={() => setCreateSheetVisible(true)}
              style={{ marginTop: spacing.lg }}
            />
          </View>
        )}
      </ScrollView>

      {/* Create Group Bottom Sheet */}
      <BottomSheet
        visible={createSheetVisible}
        onClose={() => setCreateSheetVisible(false)}
        title="Create New Group"
      >
        <Input
          label="Group Name"
          placeholder="e.g. Summer Vacation, Flat 402"
          value={groupName}
          onChangeText={setGroupName}
        />

        <Input
          label="Description (Optional)"
          placeholder="What is this group for?"
          value={groupDesc}
          onChangeText={setGroupDesc}
        />

        <Text
          style={[
            styles.categoryLabel,
            { color: theme.text, fontSize: typography.fontSize.sm },
          ]}
        >
          Category
        </Text>
        <View style={styles.categoryChipsRow}>
          {categories.map((cat) => {
            const isSelected = category === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat)}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isSelected
                      ? theme.primary
                      : theme.surface,
                    borderColor: isSelected ? theme.primary : theme.border,
                    borderRadius: borderRadius.md,
                  },
                ]}
              >
                <Text
                  style={{
                    color: isSelected ? '#FFFFFF' : theme.text,
                    fontWeight: isSelected ? '700' : '500',
                    fontSize: 12,
                    textTransform: 'capitalize',
                  }}
                >
                  {categoryIcons[cat]} {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Button
          label="Create Group"
          size="lg"
          onPress={handleCreate}
          loading={createGroupMutation.isPending}
          style={{ marginTop: spacing.xl }}
        />
      </BottomSheet>

      {/* Join Group Bottom Sheet */}
      <BottomSheet
        visible={joinSheetVisible}
        onClose={() => setJoinSheetVisible(false)}
        title="Join Group via Invite Code"
      >
        <Input
          label="6-Character Invite Code"
          placeholder="e.g. A9B8C7"
          value={inviteCodeInput}
          onChangeText={setInviteCodeInput}
          autoCapitalize="characters"
        />

        <Button
          label="Join Group"
          size="lg"
          onPress={handleJoin}
          loading={joinGroupMutation.isPending}
          style={{ marginTop: spacing.lg }}
        />
      </BottomSheet>
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  joinBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderRadius: 8,
  },
  joinBtnText: {
    fontWeight: '600',
  },
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupTitle: {
    fontWeight: '700',
  },
  groupSub: {
    marginTop: 2,
  },
  descriptionText: {
    marginTop: 10,
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 40,
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
  categoryLabel: {
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  categoryChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
});
