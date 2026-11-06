import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
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

const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  trip: 'airplane-outline',
  home: 'home-outline',
  couple: 'heart-outline',
  family: 'people-outline',
  friends: 'beer-outline',
  other: 'folder-outline',
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
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View style={styles.headerBar}>
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
            <Ionicons name="enter-outline" size={16} color={theme.text} style={{ marginRight: 4 }} />
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
            <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 2 }} />
            <Text style={styles.addBtnText}>Create</Text>
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
            const iconName = categoryIcons[group.category] || 'folder-outline';
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
                        <Ionicons name={iconName} size={22} color={theme.primary} />
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
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: theme.primaryLight, borderRadius: borderRadius.full },
              ]}
            >
              <Ionicons name="people-outline" size={48} color={theme.primary} />
            </View>
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
        <View style={styles.sheetContent}>
          <Input
            label="Group Name"
            placeholder="e.g. Goa Trip 2026, Flat 402"
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
              styles.categorySelectLabel,
              { color: theme.text, fontSize: typography.fontSize.sm },
            ]}
          >
            Category
          </Text>

          <View style={styles.categoryChipsContainer}>
            {categories.map((cat) => {
              const selected = category === cat;
              const iconName = categoryIcons[cat] || 'folder-outline';
              return (
                <TouchableOpacity
                  key={cat}
                  activeOpacity={0.8}
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: selected
                        ? theme.primary
                        : theme.card,
                      borderColor: selected
                        ? theme.primary
                        : theme.border,
                      borderRadius: borderRadius.md,
                    },
                  ]}
                >
                  <Ionicons
                    name={iconName}
                    size={16}
                    color={selected ? '#FFFFFF' : theme.text}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      {
                        color: selected ? '#FFFFFF' : theme.text,
                        fontWeight: selected ? '700' : '500',
                      },
                    ]}
                  >
                    {cat.toUpperCase()}
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
            style={{ marginTop: spacing.lg }}
          />
        </View>
      </BottomSheet>

      {/* Join Group Bottom Sheet */}
      <BottomSheet
        visible={joinSheetVisible}
        onClose={() => setJoinSheetVisible(false)}
        title="Join Existing Group"
      >
        <View style={styles.sheetContent}>
          <Input
            label="Group Invite Code"
            placeholder="e.g. TRIP-7X89A"
            value={inviteCodeInput}
            onChangeText={setInviteCodeInput}
            autoCapitalize="characters"
          />
          <Text
            style={{
              color: theme.textMuted,
              fontSize: typography.fontSize.xs,
              marginTop: 4,
              marginBottom: 16,
            }}
          >
            Ask the group creator for their 6-character group invite code.
          </Text>

          <Button
            label="Join Group"
            size="lg"
            onPress={handleJoin}
            loading={joinGroupMutation.isPending}
          />
        </View>
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
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  joinBtnText: {
    fontWeight: '600',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
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
  },
  sheetContent: {
    paddingBottom: 24,
  },
  categorySelectLabel: {
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  categoryChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    margin: 4,
  },
  categoryChipText: {
    fontSize: 12,
  },
});
