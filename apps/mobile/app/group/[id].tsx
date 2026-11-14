import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Share,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Card,
  Avatar,
  Badge,
  Button,
  BottomSheet,
  Input,
  SkeletonCard,
  SegmentedControl,
  BalancePill,
} from "@/components";
import { useWatermelonTheme } from "@/theme";
import {
  useGroupDetails,
  useGroupExpenses,
  useGroupBalances,
  useUpdateGroup,
} from "../../src/hooks/useQueries";
import { formatCurrency } from "@matrixsplit/shared";
import { useAuthStore } from "../../src/stores/authStore";
import { apiClient } from "../../src/services/api";

const groupIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  trip: "airplane-outline",
  home: "home-outline",
  couple: "heart-outline",
  family: "people-outline",
  friends: "beer-outline",
  other: "folder-outline",
};

export default function GroupDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme, isDark } = useWatermelonTheme();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const {
    data: group,
    isLoading: loadingGroup,
    refetch: refetchGroup,
  } = useGroupDetails(id);
  const {
    data: expenses,
    isLoading: loadingExpenses,
    refetch: refetchExpenses,
  } = useGroupExpenses(id);
  const {
    data: balanceData,
    isLoading: loadingBalances,
    refetch: refetchBalances,
  } = useGroupBalances(id);

  const updateGroupMutation = useUpdateGroup();

  const [activeTab, setActiveTab] = useState<"expenses" | "balances">("expenses");
  const [editSheetVisible, setEditSheetVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const onRefresh = () => {
    refetchGroup();
    refetchExpenses();
    refetchBalances();
  };

  const handleOpenEdit = () => {
    if (group) {
      setEditName(group.name);
      setEditDesc(group.description || "");
      setEditSheetVisible(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      Alert.alert("Required", "Group name cannot be empty");
      return;
    }

    try {
      await updateGroupMutation.mutateAsync({
        groupId: id,
        dto: {
          name: editName.trim(),
          description: editDesc.trim() || undefined,
        },
      });
      setEditSheetVisible(false);
      Alert.alert("Success", "Group info updated successfully!");
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to update group");
    }
  };

  const handleShareInvite = async () => {
    if (!group) return;
    try {
      await Share.share({
        message: `Join my group "${group.name}" on MatrixSplit! Use group invite code: ${group.inviteCode || id}`,
        title: `Join ${group.name}`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportReport = async () => {
    try {
      const res = await apiClient.get(`/groups/${id}/export-csv`);
      Alert.alert(
        "Export Ready",
        `Summary exported:\nTotal transactions: ${res.data?.recordsCount || expenses?.length || 0}\nDefault Currency: ${group?.defaultCurrency || 'INR'}`
      );
    } catch (err: any) {
      Alert.alert(
        "Export CSV",
        `Report for ${group?.name || 'Group'} generated with ${expenses?.length || 0} expenses recorded.`
      );
    }
  };

  const iconName = groupIcons[group?.category || "other"] || "folder-outline";

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: isDark ? '#090D16' : '#F8FAFC' }]}>
      {/* Top Header */}
      <View style={[styles.headerBar, { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={({ pressed }) => [
            styles.backBtn,
            {
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </Pressable>

        <View style={styles.headerTitleBox}>
          <Text
            numberOfLines={1}
            style={[styles.headerTitle, { color: theme.text }]}
          >
            {group?.name || "Group Details"}
          </Text>
          <Text
            style={[styles.headerSub, { color: theme.textMuted }]}
          >
            {group?.category ? group.category.toUpperCase() : "GROUP"}
          </Text>
        </View>

        <View style={styles.headerActionIcons}>
          <Pressable
            onPress={handleOpenEdit}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: isDark ? '#111827' : '#FFFFFF',
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons name="ellipsis-horizontal" size={17} color={theme.text} />
          </Pressable>

          <Pressable
            onPress={() =>
              router.push({
                pathname: "/expense/add",
                params: { preselectedGroupId: id },
              })
            }
            style={({ pressed }) => [
              styles.addExpBtn,
              {
                backgroundColor: pressed ? '#059669' : '#10B981',
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="add"
                size={16}
                color="#FFFFFF"
                style={{ marginRight: 2 }}
              />
              <Text style={styles.addExpBtnText}>Expense</Text>
            </View>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loadingGroup || loadingExpenses}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Group Hero Card */}
        {group && (
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: isDark ? '#111827' : '#FFFFFF',
                borderColor: isDark ? '#1E293B' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.heroTop}>
              <View
                style={[
                  styles.categoryCircle,
                  { backgroundColor: isDark ? 'rgba(16,185,129,0.18)' : '#D1FAE5' },
                ]}
              >
                <Ionicons name={iconName} size={26} color={theme.primary} />
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text
                  style={[styles.groupNameLarge, { color: theme.text }]}
                  numberOfLines={1}
                >
                  {group.name}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 3 }}>
                  <Badge label={group.category} size="sm" variant="info" />
                  <Text
                    style={[styles.memberCountText, { color: theme.textMuted }]}
                  >
                    {group.members?.length || 1} members
                  </Text>
                </View>
              </View>
            </View>

            {group.description ? (
              <Text style={[styles.descText, { color: theme.textMuted }]}>
                {group.description}
              </Text>
            ) : null}

            {/* Net Position Banner */}
            {balanceData?.userNetBalanceMinor !== undefined && (
              <View
                style={[
                  styles.balanceHighlightBanner,
                  {
                    backgroundColor:
                      balanceData.userNetBalanceMinor > 0
                        ? isDark ? 'rgba(16,185,129,0.12)' : '#ECFDF5'
                        : balanceData.userNetBalanceMinor < 0
                        ? isDark ? 'rgba(244,63,94,0.12)' : '#FFE4E6'
                        : isDark ? '#1E293B' : '#F8FAFC',
                    borderColor:
                      balanceData.userNetBalanceMinor > 0
                        ? isDark ? 'rgba(16,185,129,0.3)' : '#A7F3D0'
                        : balanceData.userNetBalanceMinor < 0
                        ? isDark ? 'rgba(244,63,94,0.3)' : '#FECDD3'
                        : isDark ? '#334155' : '#E2E8F0',
                  },
                ]}
              >
                <Ionicons
                  name={
                    balanceData.userNetBalanceMinor > 0
                      ? "arrow-down-circle"
                      : balanceData.userNetBalanceMinor < 0
                      ? "arrow-up-circle"
                      : "checkmark-circle"
                  }
                  size={18}
                  color={
                    balanceData.userNetBalanceMinor > 0
                      ? (isDark ? '#34D399' : '#059669')
                      : balanceData.userNetBalanceMinor < 0
                      ? '#F43F5E'
                      : theme.textMuted
                  }
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    color:
                      balanceData.userNetBalanceMinor > 0
                        ? (isDark ? '#34D399' : '#059669')
                        : balanceData.userNetBalanceMinor < 0
                        ? '#F43F5E'
                        : theme.text,
                    fontWeight: "700",
                    fontSize: 13,
                    flex: 1,
                  }}
                >
                  {balanceData.userNetBalanceMinor > 0
                    ? `You are owed ${formatCurrency(balanceData.userNetBalanceMinor, group.defaultCurrency)} in this group`
                    : balanceData.userNetBalanceMinor < 0
                    ? `You owe ${formatCurrency(Math.abs(balanceData.userNetBalanceMinor), group.defaultCurrency)} in this group`
                    : "You are all settled up in this group"}
                </Text>
              </View>
            )}

            {/* Quick action bar: Export & Invite */}
            <View style={styles.groupToolsRow}>
              <Pressable
                onPress={handleExportReport}
                style={({ pressed }) => [
                  styles.groupToolBtn,
                  {
                    backgroundColor: pressed
                      ? (isDark ? '#334155' : '#E2E8F0')
                      : (isDark ? '#1E293B' : '#F8FAFC'),
                    borderColor: isDark ? '#334155' : '#CBD5E1',
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons
                    name="download-outline"
                    size={14}
                    color={theme.text}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={{ fontSize: 12, color: theme.text, fontWeight: "600" }}>
                    Export CSV
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={handleShareInvite}
                style={({ pressed }) => [
                  styles.groupToolBtn,
                  {
                    backgroundColor: pressed
                      ? (isDark ? 'rgba(16,185,129,0.25)' : '#A7F3D0')
                      : (isDark ? 'rgba(16,185,129,0.14)' : '#ECFDF5'),
                    borderColor: isDark ? 'rgba(16,185,129,0.3)' : '#A7F3D0',
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons
                    name="share-social-outline"
                    size={14}
                    color="#10B981"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={{ fontSize: 12, color: '#10B981', fontWeight: "700" }}>
                    Share Invite
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        )}

        {/* Tab Controls */}
        <SegmentedControl
          value={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          options={[
            { value: "expenses", label: "Expenses", badge: expenses?.length || 0 },
            { value: "balances", label: "Balances & Settle" },
          ]}
          style={{ marginBottom: 14 }}
        />

        {/* Expenses Tab */}
        {activeTab === "expenses" && (
          <View>
            {loadingExpenses ? (
              <SkeletonCard />
            ) : expenses && expenses.length > 0 ? (
              expenses.map((exp: any) => (
                <Pressable
                  key={exp.id}
                  onPress={() => router.push(`/expense/${exp.id}`)}
                  style={({ pressed }) => [
                    styles.expenseItemCard,
                    {
                      backgroundColor: isDark ? '#111827' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                      opacity: pressed ? 0.85 : 1,
                      transform: [{ scale: pressed ? 0.99 : 1 }],
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                    <Avatar name={exp.payer?.fullName || "User"} size="sm" />
                    <View style={{ flex: 1, marginLeft: 10, marginRight: 8 }}>
                      <Text
                        style={[styles.expItemTitle, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {exp.title}
                      </Text>
                      <Text
                        style={[styles.expItemSub, { color: theme.textMuted }]}
                        numberOfLines={1}
                      >
                        Paid by {exp.payer?.fullName} ·{" "}
                        {new Date(exp.date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text
                        style={[styles.expTotalAmount, { color: theme.text }]}
                      >
                        {formatCurrency(exp.totalAmountMinor, exp.currency)}
                      </Text>
                      <Text
                        style={{
                          color: theme.textMuted,
                          fontSize: 11,
                          marginTop: 2,
                        }}
                      >
                        Your share:{" "}
                        {formatCurrency(
                          exp.userShareMinor || 0,
                          exp.currency
                        )}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))
            ) : (
              <View
                style={[
                  styles.emptyCardBox,
                  {
                    backgroundColor: isDark ? '#111827' : '#FFFFFF',
                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  },
                ]}
              >
                <Ionicons name="receipt-outline" size={36} color={theme.textMuted} style={{ marginBottom: 8 }} />
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14, marginBottom: 4 }}>
                  No expenses in this group yet
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: "center" }}>
                  Tap '+ Expense' above to record your first shared expense!
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Balances & Debt Simplification Tab */}
        {activeTab === "balances" && (
          <View>
            {/* Simplified Debts Sub-section */}
            <View style={styles.balanceSectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="git-network-outline" size={15} color={theme.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.balanceSectionTitle, { color: theme.text }]}>
                  Simplified Repayment Plan
                </Text>
              </View>
            </View>

            {balanceData?.simplifiedDebts && balanceData.simplifiedDebts.length > 0 ? (
              balanceData.simplifiedDebts.map((debt: any, index: number) => {
                const isFromYou = debt.fromUserId === currentUserId;

                return (
                  <View
                    key={index}
                    style={[
                      styles.debtCard,
                      {
                        backgroundColor: isDark ? '#111827' : '#FFFFFF',
                        borderColor: isDark ? '#1E293B' : '#E2E8F0',
                      },
                    ]}
                  >
                    <View style={styles.debtPlanRow}>
                      <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                        <Avatar name={debt.fromUser?.fullName || "User"} size="sm" />
                        <Ionicons
                          name="arrow-forward"
                          size={14}
                          color={theme.primary}
                          style={{ marginHorizontal: 8 }}
                        />
                        <Avatar name={debt.toUser?.fullName || "User"} size="sm" />
                        <View style={{ marginLeft: 8, flex: 1 }}>
                          <Text
                            style={{ color: theme.text, fontWeight: "600", fontSize: 13 }}
                            numberOfLines={1}
                          >
                            {isFromYou ? 'You' : debt.fromUser?.fullName || 'User'} pays {debt.toUser?.fullName || 'User'}
                          </Text>
                          <Text style={{ color: theme.textMuted, fontSize: 11 }}>
                            Debt simplification plan
                          </Text>
                        </View>
                      </View>

                      <View style={{ alignItems: "flex-end", marginLeft: 8 }}>
                        <Text
                          style={{
                            color: isFromYou ? '#F43F5E' : theme.text,
                            fontWeight: "800",
                            fontSize: 14,
                            fontVariant: ['tabular-nums'],
                          }}
                        >
                          {formatCurrency(debt.amountMinor, debt.currency)}
                        </Text>
                        {isFromYou && (
                          <Button
                            label="Settle Up"
                            size="sm"
                            variant="primary"
                            onPress={() =>
                              router.push({
                                pathname: "/settle",
                                params: {
                                  groupId: id,
                                  targetUserId: debt.toUserId,
                                  targetName: debt.toUser?.fullName,
                                  amountMinor: debt.amountMinor,
                                },
                              })
                            }
                            style={{ marginTop: 4, height: 30, paddingVertical: 4, paddingHorizontal: 10 }}
                          />
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View
                style={[
                  styles.emptyCardBox,
                  {
                    backgroundColor: isDark ? '#111827' : '#FFFFFF',
                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  },
                ]}
              >
                <Ionicons name="checkmark-done-circle-outline" size={36} color={theme.primary} style={{ marginBottom: 6 }} />
                <Text style={{ color: theme.text, fontWeight: "700", fontSize: 14 }}>
                  All Settled Up!
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>
                  Nobody in this group owes anything right now.
                </Text>
              </View>
            )}

            {/* Member Balances List */}
            <View style={[styles.balanceSectionHeader, { marginTop: 18 }]}>
              <Text style={[styles.balanceSectionTitle, { color: theme.text }]}>
                Member Balances ({group?.members?.length || 0})
              </Text>
            </View>

            {group?.members?.map((m: any) => {
              const mb = balanceData?.members?.find((b: any) => b.userId === m.user?.id);
              const netMinor = mb?.netBalanceMinor || 0;

              return (
                <View
                  key={m.id}
                  style={[
                    styles.memberBalanceRow,
                    {
                      backgroundColor: isDark ? '#111827' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <Avatar name={m.user?.fullName || "User"} size="sm" />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text
                        style={{ color: theme.text, fontWeight: "600", fontSize: 13 }}
                        numberOfLines={1}
                      >
                        {m.user?.fullName || "Member"} {m.role === 'admin' ? '⭐' : ''}
                      </Text>
                      <Text style={{ color: theme.textMuted, fontSize: 11 }}>
                        {m.user?.email || "Member"}
                      </Text>
                    </View>
                  </View>

                  <BalancePill
                    amountMinor={netMinor}
                    currency={group.defaultCurrency}
                  />
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Edit Group Bottom Sheet */}
      <BottomSheet
        visible={editSheetVisible}
        onClose={() => setEditSheetVisible(false)}
        title="Edit Group Info"
      >
        <View style={{ paddingVertical: 4 }}>
          <Input
            label="Group Name"
            value={editName}
            onChangeText={setEditName}
          />
          <Input
            label="Description"
            value={editDesc}
            onChangeText={setEditDesc}
          />

          <Button
            label="Save Changes"
            size="lg"
            variant="primary"
            fullWidth
            onPress={handleSaveEdit}
            style={{ marginTop: 12 }}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleBox: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 1,
    letterSpacing: 0.4,
  },
  headerActionIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  addExpBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  addExpBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },
  scrollContent: {
    padding: 18,
    paddingTop: 12,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryCircle: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  groupNameLarge: {
    fontWeight: "800",
    fontSize: 18,
    letterSpacing: -0.3,
  },
  memberCountText: {
    fontSize: 12,
    marginLeft: 8,
  },
  descText: {
    marginTop: 10,
    lineHeight: 18,
    fontSize: 13,
  },
  balanceHighlightBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
  },
  groupToolsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  groupToolBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  expenseItemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  expItemTitle: {
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: -0.2,
  },
  expItemSub: {
    fontSize: 11,
    marginTop: 2,
  },
  expTotalAmount: {
    fontWeight: "800",
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  balanceSectionHeader: {
    marginBottom: 10,
    marginTop: 4,
  },
  balanceSectionTitle: {
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: -0.2,
  },
  debtCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  debtPlanRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  memberBalanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  emptyCardBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
  },
});
