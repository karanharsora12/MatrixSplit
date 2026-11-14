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
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Card,
  Avatar,
  Badge,
  Button,
  Input,
  BottomSheet,
  SegmentedControl,
  BalancePill,
  SkeletonCard,
} from '@/components';
import { useWatermelonTheme } from '@/theme';
import {
  useGroupDetails,
  useGroupExpenses,
  useGroupBalances,
} from "../../src/hooks/useQueries";
import { useAuthStore } from "../../src/stores/authStore";
import { formatCurrency, GroupCategory } from "@matrixsplit/shared";
import { apiClient } from "../../src/services/api";

const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  trip: "airplane-outline",
  home: "home-outline",
  couple: "heart-outline",
  family: "people-outline",
  friends: "beer-outline",
  other: "folder-outline",
};

export default function GroupDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, typography, spacing, borderRadius, isDark } = useWatermelonTheme();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [activeTab, setActiveTab] = useState<"expenses" | "balances">("expenses");
  const [editSheetVisible, setEditSheetVisible] = useState(false);

  const {
    data: group,
    isLoading: loadingGroup,
    refetch: refetchGroup,
  } = useGroupDetails(id!);
  const {
    data: expenses,
    isLoading: loadingExpenses,
    refetch: refetchExpenses,
  } = useGroupExpenses(id!);
  const {
    data: balanceData,
    isLoading: loadingBalances,
    refetch: refetchBalances,
  } = useGroupBalances(id!);

  // Edit group state
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCategory, setEditCategory] = useState<GroupCategory>("trip");

  const onRefresh = () => {
    refetchGroup();
    refetchExpenses();
    refetchBalances();
  };

  const handleShareInvite = async () => {
    if (!group) return;
    try {
      await Share.share({
        message: `Join my MatrixSplit group "${group.name}"! Use invite code: ${group.inviteCode} in the MatrixSplit app to split bills effortlessly.`,
        title: `Invite to ${group.name}`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportReport = async () => {
    if (!group || !expenses) return;

    let csvContent = `Group Name,${group.name}\n`;
    csvContent += `Category,${group.category}\n`;
    csvContent += `Currency,${group.defaultCurrency}\n`;
    csvContent += `Export Date,${new Date().toISOString()}\n\n`;

    csvContent += `EXPENSES\nDate,Title,Paid By,Amount,Currency,Split Method\n`;
    expenses.forEach((e: any) => {
      csvContent += `${new Date(e.date).toLocaleDateString()},"${e.title}","${e.payer?.fullName}",${(e.totalAmountMinor / 100).toFixed(2)},${e.currency},${e.splitType}\n`;
    });

    try {
      await Share.share({
        message: csvContent,
        title: `${group.name}_Expense_Report.csv`,
      });
    } catch {
      Alert.alert("Report Exported", "CSV report generated successfully!");
    }
  };

  const handleOpenEdit = () => {
    if (!group) return;
    setEditName(group.name);
    setEditDesc(group.description || "");
    setEditCategory(group.category || "trip");
    setEditSheetVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      Alert.alert("Required", "Group name cannot be empty");
      return;
    }
    try {
      await apiClient.patch(`/groups/${id}`, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
        category: editCategory,
      });
      setEditSheetVisible(false);
      refetchGroup();
      Alert.alert("Saved", "Group details updated successfully!");
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to update group"
      );
    }
  };

  const iconName = group
    ? categoryIcons[group.category] || "folder-outline"
    : "folder-outline";

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Top Header */}
      <View style={styles.headerBar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={({ pressed }) => [
            styles.backBtn,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
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
          <Pressable onPress={handleShareInvite} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <Text style={[styles.headerSub, { color: theme.primary }]}>
              Invite Code: <Text style={{ fontWeight: "700" }}>{group?.inviteCode}</Text>
            </Text>
          </Pressable>
        </View>

        <View style={styles.headerActionIcons}>
          <Pressable
            onPress={handleOpenEdit}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons name="create-outline" size={16} color={theme.text} />
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
              { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons
              name="add"
              size={16}
              color="#FFFFFF"
              style={{ marginRight: 2 }}
            />
            <Text style={styles.addExpBtnText}>Expense</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
          <Card
            variant="elevated"
            padding="md"
            style={{ marginBottom: spacing.md }}
          >
            <View style={styles.heroTop}>
              <View
                style={[
                  styles.categoryCircle,
                  { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#D1FAE5' },
                ]}
              >
                <Ionicons name={iconName} size={28} color={theme.primary} />
              </View>

              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text
                  style={[
                    styles.groupNameLarge,
                    { color: theme.text, fontSize: typography.fontSize.xl },
                  ]}
                >
                  {group.name}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                  <Badge label={group.category} size="sm" variant="info" />
                  <Text
                    style={[
                      styles.memberCountText,
                      { color: theme.textMuted, marginLeft: 8 },
                    ]}
                  >
                    {group.members?.length || 1} members
                  </Text>
                </View>
              </View>
            </View>

            {group.description ? (
              <Text
                style={[
                  styles.descText,
                  { color: theme.textMuted, fontSize: typography.fontSize.xs },
                ]}
              >
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
                        ? isDark ? 'rgba(239,68,68,0.12)' : '#FEF2F2'
                        : theme.surface,
                    borderColor:
                      balanceData.userNetBalanceMinor > 0
                        ? theme.primary
                        : balanceData.userNetBalanceMinor < 0
                        ? theme.negative
                        : theme.border,
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
                      ? theme.positive
                      : balanceData.userNetBalanceMinor < 0
                      ? theme.negative
                      : theme.textMuted
                  }
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    color:
                      balanceData.userNetBalanceMinor > 0
                        ? theme.positive
                        : balanceData.userNetBalanceMinor < 0
                        ? theme.negative
                        : theme.text,
                    fontWeight: "700",
                    fontSize: 13,
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
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Ionicons
                  name="download-outline"
                  size={14}
                  color={theme.text}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{ fontSize: 12, color: theme.text, fontWeight: "600" }}
                >
                  Export CSV
                </Text>
              </Pressable>

              <Pressable
                onPress={handleShareInvite}
                style={({ pressed }) => [
                  styles.groupToolBtn,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Ionicons
                  name="share-social-outline"
                  size={14}
                  color={theme.primary}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: theme.primary,
                    fontWeight: "600",
                  }}
                >
                  Share Invite
                </Text>
              </Pressable>
            </View>
          </Card>
        )}

        {/* Tab Controls */}
        <SegmentedControl
          value={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          options={[
            { value: "expenses", label: "Expenses", badge: expenses?.length || 0 },
            { value: "balances", label: "Balances & Settle" },
          ]}
        />

        {/* Expenses Tab */}
        {activeTab === "expenses" && (
          <View style={{ marginTop: 10 }}>
            {loadingExpenses ? (
              <SkeletonCard />
            ) : expenses && expenses.length > 0 ? (
              expenses.map((exp: any) => (
                <Pressable
                  key={exp.id}
                  onPress={() => router.push(`/expense/${exp.id}`)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
                >
                  <Card
                    variant="outlined"
                    padding="sm"
                    style={{ marginBottom: spacing.sm }}
                  >
                    <View style={styles.expenseItemRow}>
                      <Avatar name={exp.payer?.fullName || "User"} size="sm" />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text
                          style={[styles.expItemTitle, { color: theme.text }]}
                        >
                          {exp.title}
                        </Text>
                        <Text
                          style={[
                            styles.expItemSub,
                            { color: theme.textMuted },
                          ]}
                        >
                          Paid by {exp.payer?.fullName} •{" "}
                          {new Date(exp.date).toLocaleDateString()}
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
                  </Card>
                </Pressable>
              ))
            ) : (
              <Card padding="md" variant="outlined" style={{ alignItems: 'center', paddingVertical: 24 }}>
                <Ionicons name="receipt-outline" size={36} color={theme.textMuted} style={{ marginBottom: 8 }} />
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14, marginBottom: 4 }}>
                  No expenses in this group yet
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: "center" }}>
                  Tap '+ Expense' at top right to record your first shared expense!
                </Text>
              </Card>
            )}
          </View>
        )}

        {/* Balances & Debt Simplification Tab */}
        {activeTab === "balances" && (
          <View style={{ marginTop: 10 }}>
            {/* Simplified Debts Sub-section */}
            <View style={styles.balanceSectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="git-network-outline" size={16} color={theme.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.balanceSectionTitle, { color: theme.text }]}>
                  Simplified Repayment Plan
                </Text>
              </View>
            </View>

            {balanceData?.simplifiedDebts && balanceData.simplifiedDebts.length > 0 ? (
              balanceData.simplifiedDebts.map((debt: any, index: number) => {
                const isFromYou = debt.fromUserId === currentUserId;
                const isToYou = debt.toUserId === currentUserId;

                return (
                  <Card
                    key={index}
                    variant="outlined"
                    padding="sm"
                    style={{ marginBottom: spacing.sm }}
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
                            numberOfLines={1}
                            style={{ color: theme.text, fontWeight: "700", fontSize: 13 }}
                          >
                            {isFromYou ? "You" : debt.fromUser?.fullName} pays{" "}
                            {isToYou ? "You" : debt.toUser?.fullName}
                          </Text>
                        </View>
                      </View>

                      <View style={{ alignItems: "flex-end", marginLeft: 8 }}>
                        <Text
                          style={{ color: theme.text, fontWeight: "800", fontSize: 14 }}
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
                            style={{ marginTop: 4, paddingVertical: 4, paddingHorizontal: 8 }}
                          />
                        )}
                      </View>
                    </View>
                  </Card>
                );
              })
            ) : (
              <Card padding="md" variant="outlined" style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Ionicons name="checkmark-done-circle-outline" size={36} color={theme.primary} style={{ marginBottom: 6 }} />
                <Text style={{ color: theme.text, fontWeight: "700", fontSize: 14 }}>
                  All Settled Up!
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>
                  Nobody in this group owes anything right now.
                </Text>
              </Card>
            )}

            {/* Member Balances List */}
            <View style={[styles.balanceSectionHeader, { marginTop: 16 }]}>
              <Text style={[styles.balanceSectionTitle, { color: theme.text }]}>
                Member Balances ({group?.members?.length || 0})
              </Text>
            </View>

            {group?.members?.map((m: any) => {
              const netMinor = m.netBalanceMinor || 0;
              return (
                <Card
                  key={m.userId}
                  variant="outlined"
                  padding="sm"
                  style={{ marginBottom: spacing.sm }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Avatar name={m.user?.fullName} size="sm" />
                      <View style={{ marginLeft: 10 }}>
                        <Text style={{ color: theme.text, fontWeight: "700", fontSize: 13 }}>
                          {m.user?.fullName} {m.userId === currentUserId ? "(You)" : ""}
                        </Text>
                        <Text style={{ color: theme.textMuted, fontSize: 11 }}>
                          {m.role || "Member"}
                        </Text>
                      </View>
                    </View>

                    <BalancePill
                      amountMinor={netMinor}
                      currency={group.defaultCurrency}
                    />
                  </View>
                </Card>
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
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
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  headerActionIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  addExpBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  addExpBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryCircle: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  groupNameLarge: {
    fontWeight: "800",
  },
  memberCountText: {
    fontSize: 12,
  },
  descText: {
    marginTop: 10,
    lineHeight: 18,
  },
  balanceHighlightBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
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
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  expenseItemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  expItemTitle: {
    fontWeight: "700",
    fontSize: 14,
  },
  expItemSub: {
    fontSize: 11,
    marginTop: 2,
  },
  expTotalAmount: {
    fontWeight: "800",
    fontSize: 14,
  },
  balanceSectionHeader: {
    marginBottom: 8,
  },
  balanceSectionTitle: {
    fontWeight: "700",
    fontSize: 14,
  },
  debtPlanRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
