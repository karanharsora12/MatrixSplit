import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Button,
  Input,
  BottomSheet,
  SkeletonCard,
} from "@/components";
import { useWatermelonTheme } from "@/theme";
import {
  useMyGroups,
  useCreateGroup,
  useJoinGroup,
} from "../../src/hooks/useQueries";
import { GroupCategory } from "@matrixsplit/shared";
import { cn } from "@/lib/utils";

const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  trip: "airplane-outline",
  home: "home-outline",
  couple: "heart-outline",
  family: "people-outline",
  friends: "beer-outline",
  other: "folder-outline",
};

export default function GroupsScreen() {
  const router = useRouter();
  const { isDark } = useWatermelonTheme();

  const { data: groups, isLoading, refetch, isRefetching } = useMyGroups();
  const createGroupMutation = useCreateGroup();
  const joinGroupMutation = useJoinGroup();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [createSheetVisible, setCreateSheetVisible] = useState(false);
  const [joinSheetVisible, setJoinSheetVisible] = useState(false);

  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [category, setCategory] = useState<GroupCategory>("friends");
  const [inviteCodeInput, setInviteCodeInput] = useState("");

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert("Required", "Please enter a group name");
      return;
    }

    try {
      await createGroupMutation.mutateAsync({
        name: groupName.trim(),
        description: groupDesc.trim() || undefined,
        category,
        defaultCurrency: "INR",
      });
      setCreateSheetVisible(false);
      setGroupName("");
      setGroupDesc("");
      Alert.alert("Success", "Group created successfully!");
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to create group",
      );
    }
  };

  const handleJoin = async () => {
    if (!inviteCodeInput.trim()) {
      Alert.alert("Required", "Invite code is required");
      return;
    }

    try {
      await joinGroupMutation.mutateAsync(inviteCodeInput.trim().toUpperCase());
      setJoinSheetVisible(false);
      setInviteCodeInput("");
      Alert.alert("Success", "Successfully joined group!");
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Invalid invite code",
      );
    }
  };

  const categories: GroupCategory[] = [
    "trip",
    "home",
    "couple",
    "family",
    "friends",
    "other",
  ];

  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    return groups.filter((g: any) => {
      const matchesSearch =
        !searchQuery ||
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.description &&
          g.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory =
        selectedCategory === "all" || g.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [groups, searchQuery, selectedCategory]);

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-[#090D16]"
    >
      {/* Top Header Bar */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-3.5 border-b border-[#1E293B]">
        <View>
          <Text className="text-2xl font-extrabold text-white tracking-tight">
            Groups
          </Text>
          <Text className="text-xs text-slate-400 mt-0.5">
            {groups
              ? `${groups.length} active ${groups.length === 1 ? "group" : "groups"}`
              : "Manage your shared groups"}
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="flex-row items-center">
          <Pressable
            onPress={() => setJoinSheetVisible(true)}
            className="flex-row items-center h-9 px-3.5 rounded-xl bg-[#141D2E] border border-[#23324D] active:scale-95 active:bg-[#1E2A42] mr-2"
          >
            <Ionicons
              name="enter-outline"
              size={16}
              color="#94A3B8"
              style={{ marginRight: 4 }}
            />
            <Text className="text-xs font-bold text-slate-200">
              Join
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setCreateSheetVisible(true)}
            className="flex-row items-center h-9 px-3.5 rounded-xl bg-emerald-500 active:scale-95 active:bg-emerald-600 shadow-sm"
          >
            <Ionicons
              name="add"
              size={18}
              color="#FFFFFF"
              style={{ marginRight: 2 }}
            />
            <Text className="text-xs font-bold text-white">Create</Text>
          </Pressable>
        </View>
      </View>

      {/* Search & Category Filter Section */}
      <View className="pt-3.5">
        {/* Search Bar */}
        <View className="flex-row items-center h-11 px-3.5 rounded-2xl bg-[#141D2E] border border-[#23324D] mx-5 mb-3">
          <Ionicons
            name="search-outline"
            size={18}
            color="#64748B"
            style={{ marginRight: 8 }}
          />
          <TextInput
            placeholder="Search groups by name..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-sm font-medium text-white py-0"
          />
          {searchQuery ? (
            <Pressable
              onPress={() => setSearchQuery("")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={18} color="#64748B" />
            </Pressable>
          ) : null}
        </View>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}
        >
          {/* All Chip */}
          <Pressable
            onPress={() => setSelectedCategory("all")}
            className={cn(
              "h-9 px-4 rounded-full items-center justify-center mr-2 active:scale-95",
              selectedCategory === "all"
                ? "bg-emerald-500 shadow-sm"
                : "bg-[#141D2E] border border-[#23324D]"
            )}
          >
            <Text
              className={cn(
                "text-xs font-bold",
                selectedCategory === "all" ? "text-white" : "text-slate-300"
              )}
            >
              All
            </Text>
          </Pressable>

          {/* Category Chips */}
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const iconName = categoryIcons[cat] || "folder-outline";
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                className={cn(
                  "h-9 px-3.5 rounded-full flex-row items-center justify-center mr-2 active:scale-95",
                  isSelected
                    ? "bg-emerald-500 shadow-sm"
                    : "bg-[#141D2E] border border-[#23324D]"
                )}
              >
                <Ionicons
                  name={iconName}
                  size={14}
                  color={isSelected ? "#FFFFFF" : "#64748B"}
                  style={{ marginRight: 6 }}
                />
                <Text
                  className={cn(
                    "text-xs font-bold capitalize",
                    isSelected ? "text-white" : "text-slate-300"
                  )}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Groups List */}
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
          <View className="px-5">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : filteredGroups && filteredGroups.length > 0 ? (
          filteredGroups.map((group: any) => {
            const iconName = categoryIcons[group.category] || "folder-outline";
            return (
              <Pressable
                key={group.id}
                onPress={() => router.push(`/group/${group.id}`)}
                className="mx-5 mb-3 p-4 rounded-2xl bg-[#141D2E] border border-[#23324D] flex-row items-center justify-between active:scale-98 active:bg-[#1A263B]"
              >
                <View className="flex-row items-center flex-1 mr-3">
                  {/* Category Squircle Icon */}
                  <View className="w-12 h-12 rounded-xl bg-emerald-500/15 items-center justify-center mr-3.5">
                    <Ionicons name={iconName} size={22} color="#10B981" />
                  </View>

                  {/* Group Info */}
                  <View className="flex-1">
                    <Text
                      numberOfLines={1}
                      className="text-base font-bold text-white tracking-tight"
                    >
                      {group.name}
                    </Text>

                    {group.description ? (
                      <Text
                        numberOfLines={1}
                        className="text-xs text-slate-400 mt-0.5"
                      >
                        {group.description}
                      </Text>
                    ) : null}

                    {/* Metadata Footer */}
                    <View className="flex-row items-center mt-1">
                      <Ionicons
                        name="people-outline"
                        size={13}
                        color="#64748B"
                        style={{ marginRight: 4 }}
                      />
                      <Text className="text-xs text-slate-400">
                        {group.membersCount || 1} {group.membersCount === 1 ? "member" : "members"}
                      </Text>
                      <Text className="text-xs text-slate-600 mx-1.5">
                        ·
                      </Text>
                      <Text className="text-xs text-slate-400">
                        {new Date(group.createdAt).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </Text>
                    </View>
                  </View>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#64748B"
                />
              </Pressable>
            );
          })
        ) : (
          <View className="mx-5 my-10 p-8 rounded-3xl bg-[#141D2E] border border-[#23324D] items-center">
            <View className="w-16 h-16 rounded-full bg-emerald-500/15 items-center justify-center mb-3">
              <Ionicons
                name="people-outline"
                size={32}
                color="#10B981"
              />
            </View>
            <Text className="text-base font-bold text-white mt-1">
              {searchQuery ? "No groups found" : "No groups yet"}
            </Text>
            <Text className="text-xs text-slate-400 text-center mt-1 leading-5 max-w-[260px]">
              {searchQuery
                ? "Try a different search query or clear your category filter"
                : "Create a group for your trip, house, or friends to split expenses effortlessly"}
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
        <View className="py-1">
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

          <Text className="text-xs font-bold text-slate-400 tracking-wider mb-2 mt-1">
            CATEGORY
          </Text>

          <View className="flex-row flex-wrap gap-2 mb-2">
            {categories.map((cat) => {
              const isSelected = category === cat;
              const iconName = categoryIcons[cat] || "folder-outline";
              return (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  className={cn(
                    "flex-row items-center h-10 px-3.5 rounded-xl border active:scale-95",
                    isSelected
                      ? "bg-emerald-500/20 border-emerald-500"
                      : "bg-[#141D2E] border-[#23324D]"
                  )}
                >
                  <Ionicons
                    name={iconName}
                    size={16}
                    color={isSelected ? "#10B981" : "#64748B"}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    className={cn(
                      "text-xs font-bold capitalize",
                      isSelected ? "text-emerald-400" : "text-slate-300"
                    )}
                  >
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Button
            label={
              createGroupMutation.isPending
                ? "Creating Group..."
                : "Create Group"
            }
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
        <View className="py-1">
          <Text className="text-xs text-slate-400 mb-3 leading-5">
            Ask the group creator for their 6-character invite code (e.g.
            TRIP24).
          </Text>

          <Input
            label="Invite Code"
            placeholder="e.g. GOA2024"
            value={inviteCodeInput}
            onChangeText={(text) => setInviteCodeInput(text.toUpperCase())}
            autoCapitalize="characters"
          />

          <Button
            label={
              joinGroupMutation.isPending ? "Joining Group..." : "Join Group"
            }
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
