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
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Card,
  Button,
  Badge,
  Input,
  BottomSheet,
  SkeletonCard,
} from '@/components';
import { useWatermelonTheme } from '@/theme';
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
  const { theme, typography, spacing, borderRadius, isDark } = useWatermelonTheme();

  const { data: groups, isLoading, refetch, isRefetching } = useMyGroups();
  const createGroupMutation = useCreateGroup();
  const joinGroupMutation = useJoinGroup();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View style={styles.headerBar}>
        <View>
          <Text
            style={[
              styles.headerTitle,
              { color: theme.text, fontSize: typography.fontSize['2xl'] },
            ]}
          >
            Groups
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
            {groups ? `${groups.length} active groups` : 'Manage your group expenses'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setJoinSheetVisible(true)}
            style={({ pressed }) => [
              styles.joinBtn,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons name="enter-outline" size={16} color={theme.text} style={{ marginRight: 4 }} />
            <Text
              style={[
                styles.joinBtnText,
                { color: theme.text, fontSize: typography.fontSize.xs },
              ]}
            >
              Join
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setCreateSheetVisible(true)}
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
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
              backgroundColor: theme.card,
              borderColor: theme.border,
              borderRadius: borderRadius.lg,
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <Pressable
            onPress={() => setSelectedCategory('all')}
            style={({ pressed }) => [
              styles.filterChip,
              {
                backgroundColor: selectedCategory === 'all' ? theme.primary : theme.surface,
                borderColor: selectedCategory === 'all' ? theme.primary : theme.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color: selectedCategory === 'all' ? '#FFFFFF' : theme.text,
                  fontWeight: selectedCategory === 'all' ? '700' : '500',
                },
              ]}
            >
              All
            </Text>
          </Pressable>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={({ pressed }) => [
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.surface,
                    borderColor: isSelected ? theme.primary : theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={categoryIcons[cat] || 'folder-outline'}
                  size={14}
                  color={isSelected ? '#FFFFFF' : theme.textMuted}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isSelected ? '#FFFFFF' : theme.text,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
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
        ) : filteredGroups && filteredGroups.length > 0 ? (
          filteredGroups.map((group: any) => {
            const iconName = categoryIcons[group.category] || 'folder-outline';
            return (
              <Pressable
                key={group.id}
                onPress={() => router.push(`/group/${group.id}`)}
                style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
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
                          { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#D1FAE5' },
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
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                          <Text
                            style={[
                              styles.groupSub,
                              { color: theme.textMuted, fontSize: typography.fontSize.xs },
                            ]}
                          >
                            {group.membersCount || 1} members
                          </Text>
                          <Text style={{ color: theme.textMuted, marginHorizontal: 6 }}>•</Text>
                          <View style={[styles.codeBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Ionicons name="key-outline" size={10} color={theme.textMuted} style={{ marginRight: 3 }} />
                            <Text style={[styles.codeText, { color: theme.text }]}>
                              {group.inviteCode}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <Badge label={group.category} size="sm" variant="info" />
                  </View>

                  {group.description ? (
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.descriptionText,
                        { color: theme.textMuted, fontSize: typography.fontSize.xs },
                      ]}
                    >
                      {group.description}
                    </Text>
                  ) : null}

                  <View style={[styles.cardDivider, { backgroundColor: theme.divider }]} />

                  <View style={styles.cardFooter}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="receipt-outline" size={14} color={theme.primary} style={{ marginRight: 4 }} />
                      <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '600' }}>
                        View Ledgers & Debts
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                  </View>
                </Card>
              </Pressable>
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
              <Ionicons name="people-outline" size={48} color={theme.primary} />
            </View>
            <Text
              style={[
                styles.emptyTitle,
                { color: theme.text, fontSize: typography.fontSize.xl },
              ]}
            >
              {searchQuery ? 'No matching groups' : 'No groups yet'}
            </Text>
            <Text
              style={[
                styles.emptyDesc,
                { color: theme.textMuted, fontSize: typography.fontSize.sm },
              ]}
            >
              {searchQuery
                ? 'Try a different search query or clear the filter.'
                : 'Create a group for your apartment, road trip, dinner party, or vacation to split expenses easily.'}
            </Text>
            {!searchQuery && (
              <Button
                label="+ Create Your First Group"
                onPress={() => setCreateSheetVisible(true)}
                style={{ marginTop: spacing.lg }}
              />
            )}
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
            leftIcon={<Ionicons name="people-outline" size={18} color={theme.textMuted} />}
          />

          <Input
            label="Description (Optional)"
            placeholder="What is this group for?"
            value={groupDesc}
            onChangeText={setGroupDesc}
            leftIcon={<Ionicons name="document-text-outline" size={18} color={theme.textMuted} />}
          />

          <Text
            style={[
              styles.categorySelectLabel,
              { color: theme.text, fontSize: typography.fontSize.xs },
            ]}
          >
            CATEGORY
          </Text>

          <View style={styles.categoryChipsContainer}>
            {categories.map((cat) => {
              const selected = category === cat;
              const iconName = categoryIcons[cat] || 'folder-outline';
              return (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={({ pressed }) => [
                    styles.categoryChip,
                    {
                      backgroundColor: selected
                        ? theme.primary
                        : theme.surface,
                      borderColor: selected
                        ? theme.primary
                        : theme.border,
                      borderRadius: borderRadius.md,
                      opacity: pressed ? 0.8 : 1,
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
                </Pressable>
              );
            })}
          </View>

          <Button
            label={createGroupMutation.isPending ? 'Creating Group...' : 'Create Group'}
            size="lg"
            variant="primary"
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
            leftIcon={<Ionicons name="key-outline" size={18} color={theme.textMuted} />}
          />

          <Text
            style={[
              styles.joinHint,
              { color: theme.textMuted, fontSize: typography.fontSize.xs },
            ]}
          >
            Ask the group admin for their 6-8 digit invite code found in group details.
          </Text>

          <Button
            label={joinGroupMutation.isPending ? 'Joining Group...' : 'Join Group'}
            size="lg"
            variant="primary"
            onPress={handleJoin}
            loading={joinGroupMutation.isPending}
            style={{ marginTop: spacing.base }}
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
    borderRadius: 18,
    borderWidth: 1,
  },
  joinBtnText: {
    fontWeight: '700',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 12,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  groupInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupTitle: {
    fontWeight: '700',
  },
  groupSub: {
    marginTop: 2,
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
  },
  codeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  descriptionText: {
    marginTop: 10,
    lineHeight: 18,
  },
  cardDivider: {
    height: 1,
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  sheetContent: {
    paddingVertical: 4,
  },
  categorySelectLabel: {
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
  },
  categoryChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
  },
  joinHint: {
    lineHeight: 18,
    marginTop: -4,
    marginBottom: 8,
  },
});
