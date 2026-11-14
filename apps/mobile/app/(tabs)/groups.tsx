import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Card,
  Button,
  Input,
  BottomSheet,
  SkeletonCard,
  Badge,
} from '@/components';
import { useWatermelonTheme } from '@/theme';
import {
  useMyGroups,
  useCreateGroup,
  useJoinGroup,
} from '../../src/hooks/useQueries';
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
  const { theme, isDark } = useWatermelonTheme();

  const { data: groups, isLoading, refetch, isRefetching } = useMyGroups();
  const createGroupMutation = useCreateGroup();
  const joinGroupMutation = useJoinGroup();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [createSheetVisible, setCreateSheetVisible] = useState(false);
  const [joinSheetVisible, setJoinSheetVisible] = useState(false);

  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [category, setCategory] = useState<GroupCategory>('friends');
  const [inviteCodeInput, setInviteCodeInput] = useState('');

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('Required', 'Please enter a group name');
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
      Alert.alert('Success', 'Group created successfully!');
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

  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    return groups.filter((g: any) => {
      const matchesSearch =
        !searchQuery ||
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory =
        selectedCategory === 'all' || g.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [groups, searchQuery, selectedCategory]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: isDark ? '#090D16' : '#F8FAFC' }]}>
      {/* Top Header */}
      <View style={[styles.headerBar, { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Groups
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
            {groups ? `${groups.length} active group${groups.length === 1 ? '' : 's'}` : 'Manage your groups'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setJoinSheetVisible(true)}
            style={({ pressed }) => [
              styles.joinBtn,
              {
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                borderColor: isDark ? '#334155' : '#E2E8F0',
                opacity: pressed ? 0.75 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <Ionicons name="enter-outline" size={16} color={theme.text} style={{ marginRight: 4 }} />
            <Text style={[styles.joinBtnText, { color: theme.text }]}>
              Join
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setCreateSheetVisible(true)}
            style={({ pressed }) => [
              styles.addBtn,
              {
                backgroundColor: theme.primary,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 2 }} />
            <Text style={styles.addBtnText}>Create</Text>
          </Pressable>
        </View>
      </View>

      {/* Search & Category Filter Section */}
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
            },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={theme.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search groups by name..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={18} color={theme.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 4, gap: 8 }}
        >
          <Pressable
            onPress={() => setSelectedCategory('all')}
            className="flex-row items-center"
            style={({ pressed }) => [
              styles.filterChip,
              {
                backgroundColor:
                  selectedCategory === 'all'
                    ? isDark
                      ? 'rgba(16,185,129,0.22)'
                      : '#D1FAE5'
                    : isDark
                    ? '#1E293B'
                    : '#FFFFFF',
                borderColor:
                  selectedCategory === 'all'
                    ? '#10B981'
                    : isDark
                    ? '#334155'
                    : '#E2E8F0',
                borderWidth: selectedCategory === 'all' ? 1.5 : 1,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color:
                    selectedCategory === 'all'
                      ? isDark
                        ? '#34D399'
                        : '#059669'
                      : theme.text,
                  fontWeight: selectedCategory === 'all' ? '700' : '600',
                },
              ]}
            >
              All
            </Text>
          </Pressable>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const iconName = categoryIcons[cat] || 'folder-outline';
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                className="flex-row items-center"
                style={({ pressed }) => [
                  styles.filterChip,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? 'rgba(16,185,129,0.22)'
                        : '#D1FAE5'
                      : isDark
                      ? '#1E293B'
                      : '#FFFFFF',
                    borderColor: isSelected
                      ? '#10B981'
                      : isDark
                      ? '#334155'
                      : '#E2E8F0',
                    borderWidth: isSelected ? 1.5 : 1,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <View className="flex-row items-center" style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons
                    name={iconName}
                    size={14}
                    color={
                      isSelected
                        ? isDark
                          ? '#34D399'
                          : '#059669'
                        : theme.textMuted
                    }
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      {
                        color: isSelected
                          ? isDark
                            ? '#34D399'
                            : '#059669'
                          : theme.text,
                        fontWeight: isSelected ? '700' : '600',
                        textTransform: 'capitalize',
                      },
                    ]}
                  >
                    {cat}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Groups List */}
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
          </>
        ) : filteredGroups && filteredGroups.length > 0 ? (
          filteredGroups.map((group: any) => {
            const iconName = categoryIcons[group.category] || 'folder-outline';
            return (
              <Pressable
                key={group.id}
                onPress={() => router.push(`/group/${group.id}`)}
                className="w-full flex-row items-center justify-between"
                style={({ pressed }) => [
                  styles.groupCard,
                  {
                    backgroundColor: isDark ? '#111827' : '#FFFFFF',
                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    opacity: pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.99 : 1 }],
                  },
                ]}
              >
                <View className="flex-row items-center flex-1" style={styles.groupCardLeft}>
                  <View
                    style={[
                      styles.categoryCircle,
                      {
                        backgroundColor: isDark
                          ? 'rgba(16,185,129,0.18)'
                          : '#D1FAE5',
                      },
                    ]}
                  >
                    <Ionicons name={iconName} size={22} color={theme.primary} />
                  </View>
                  <View style={styles.groupMeta}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text
                        style={[styles.groupName, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {group.name}
                      </Text>
                    </View>
                    {group.description ? (
                      <Text
                        numberOfLines={1}
                        style={[styles.groupDesc, { color: theme.textMuted }]}
                      >
                        {group.description}
                      </Text>
                    ) : null}
                    <View style={styles.groupFootRow}>
                      <Ionicons
                        name="people-outline"
                        size={13}
                        color={theme.textMuted}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.memberCount, { color: theme.textMuted }]}>
                        {group.membersCount || 1} members
                      </Text>
                      <Text style={[styles.dotSep, { color: theme.textMuted }]}>·</Text>
                      <Text style={[styles.memberCount, { color: theme.textMuted }]}>
                        {new Date(group.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
              </Pressable>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
              ]}
            >
              <Ionicons name="people-outline" size={32} color={theme.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {searchQuery ? 'No groups found' : 'No groups yet'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
              {searchQuery
                ? 'Try a different search query or clear your filter'
                : 'Create a group for your trip, house, or friends to split expenses effortlessly'}
            </Text>
            <Button
              label="Create a Group"
              variant="primary"
              size="md"
              onPress={() => setCreateSheetVisible(true)}
              style={{ marginTop: 16 }}
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
        <View style={{ paddingVertical: 4 }}>
          <Input
            label="Group Name"
            placeholder="e.g. Goa Trip, Flat 402, Friday Dinners"
            value={groupName}
            onChangeText={setGroupName}
          />

          <Input
            label="Description (Optional)"
            placeholder="Add context or notes for this group..."
            value={groupDesc}
            onChangeText={setGroupDesc}
          />

          <Text style={[styles.sheetSectionLabel, { color: theme.textMuted }]}>
            CATEGORY
          </Text>

          <View style={styles.categoryGrid}>
            {categories.map((cat) => {
              const isSelected = category === cat;
              const iconName = categoryIcons[cat] || 'folder-outline';
              return (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={({ pressed }) => [
                    styles.categoryPickBtn,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? 'rgba(16,185,129,0.22)'
                          : '#D1FAE5'
                        : isDark
                        ? '#161F30'
                        : '#F8FAFC',
                      borderColor: isSelected
                        ? theme.primary
                        : isDark
                        ? '#1E293B'
                        : '#E2E8F0',
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name={iconName}
                    size={16}
                    color={
                      isSelected
                        ? isDark
                          ? '#34D399'
                          : '#059669'
                        : theme.textMuted
                    }
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      color: isSelected
                        ? isDark
                          ? '#34D399'
                          : '#059669'
                        : theme.text,
                      fontSize: 12,
                      fontWeight: isSelected ? '700' : '500',
                      textTransform: 'capitalize',
                    }}
                  >
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Button
            label={createGroupMutation.isPending ? 'Creating Group...' : 'Create Group'}
            size="lg"
            variant="primary"
            fullWidth
            onPress={handleCreate}
            loading={createGroupMutation.isPending}
            style={{ marginTop: 18 }}
          />
        </View>
      </BottomSheet>

      {/* Join Group Bottom Sheet */}
      <BottomSheet
        visible={joinSheetVisible}
        onClose={() => setJoinSheetVisible(false)}
        title="Join Existing Group"
      >
        <View style={{ paddingVertical: 4 }}>
          <Text style={[styles.joinSheetInfo, { color: theme.textMuted }]}>
            Ask the group creator for their 6-character invite code (e.g. TRIP24).
          </Text>

          <Input
            label="Invite Code"
            placeholder="e.g. GOA2024"
            value={inviteCodeInput}
            onChangeText={(text) => setInviteCodeInput(text.toUpperCase())}
            autoCapitalize="characters"
          />

          <Button
            label={joinGroupMutation.isPending ? 'Joining Group...' : 'Join Group'}
            size="lg"
            variant="primary"
            fullWidth
            onPress={handleJoin}
            loading={joinGroupMutation.isPending}
            style={{ marginTop: 14 }}
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
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  joinBtnText: {
    fontWeight: '600',
    fontSize: 12,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 0,
  },
  filterScroll: {
    gap: 8,
    paddingRight: 10,
  },
  filterChip: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  filterChipText: {
    fontSize: 12,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 36,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  groupCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  categoryCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupMeta: {
    flex: 1,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  groupDesc: {
    fontSize: 12,
    marginBottom: 4,
  },
  groupFootRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberCount: {
    fontSize: 11,
  },
  dotSep: {
    marginHorizontal: 5,
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  sheetSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  joinSheetInfo: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
});
