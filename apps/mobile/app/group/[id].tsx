import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Share,
  Switch,
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
  const { theme, typography, spacing, borderRadius } = useWatermelonTheme();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [activeTab, setActiveTab] = useState<"expenses" | "balances">(
    "expenses",
  );
  const [simplifyDebts, setSimplifyDebts] = useState(true);
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

    csvContent += `\nSIMPLIFIED SETTLEMENTS PLAN\nFrom,To,Amount,Currency\n`;
    balanceData?.simplifiedDebts?.forEach((d: any) => {
      csvContent += `"${d.fromUser?.fullName}","${d.toUser?.fullName}",${(d.amountMinor / 100).toFixed(2)},${d.currency}\n`;
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
        err.response?.data?.message || "Failed to update group",
      );
    }
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      "Delete Group",
      "Are you sure you want to delete this group? All expenses and balances in this group will be archived.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiClient.delete(`/groups/${id}`);
              Alert.alert("Deleted", "Group deleted successfully", [
                { text: "OK", onPress: () => router.replace("/(tabs)/groups") },
              ]);
            } catch (err: any) {
              Alert.alert(
                "Error",
                err.response?.data?.message || "Failed to delete",
              );
            }
          },
        },
      ],
    );
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text
            numberOfLines={1}
            style={[styles.headerTitle, { color: theme.text }]}
          >
            {group?.name || "Group Details"}
          </Text>
          <TouchableOpacity onPress={handleShareInvite}>
            <Text style={[styles.headerSub, { color: theme.primary }]}>
              Invite Code:{" "}
              <Text style={{ fontWeight: "700" }}>{group?.inviteCode}</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerActionIcons}>
          <TouchableOpacity
            onPress={handleOpenEdit}
            style={[
              styles.iconBtn,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Ionicons name="create-outline" size={16} color={theme.text} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/expense/add",
                params: { preselectedGroupId: id },
              })
            }
            style={[styles.addExpBtn, { backgroundColor: theme.primary }]}
          >
            <Ionicons
              name="add"
              size={16}
              color="#FFFFFF"
              style={{ marginRight: 2 }}
            />
            <Text style={styles.addExpBtnText}>Expense</Text>
          </TouchableOpacity>
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
                  { backgroundColor: theme.primaryLight },
                ]}
              >
                <Ionicons name={iconName} size={24} color={theme.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text
                  style={[
                    styles.heroTitle,
                    { color: theme.text, fontSize: typography.fontSize.xl },
                  ]}
                >
                  {group.name}
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                  {group.membersCount || 1} members • Currency:{" "}
                  {group.defaultCurrency}
                </Text>
              </View>
              <Badge label={group.category} size="sm" variant="info" />
            </View>

            {/* User net balance in this group */}
            {balanceData && (
              <View
                style={[
                  styles.userGroupBalanceBox,
                  {
                    backgroundColor:
                      balanceData.userNetBalanceMinor > 0
                        ? theme.positiveBg
                        : balanceData.userNetBalanceMinor < 0
                          ? theme.negativeBg
                          : theme.neutralBg,
                    borderColor:
                      balanceData.userNetBalanceMinor > 0
                        ? theme.positiveBorder
                        : balanceData.userNetBalanceMinor < 0
                          ? theme.negativeBorder
                          : theme.neutralBorder,
                  },
                ]}
              >
                <Text
                  style={{
                    color:
                      balanceData.userNetBalanceMinor > 0
                        ? theme.positive
                        : balanceData.userNetBalanceMinor < 0
                          ? theme.negative
                          : theme.neutral,
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
              <TouchableOpacity
                onPress={handleExportReport}
                style={[styles.groupToolBtn, { borderColor: theme.border }]}
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
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShareInvite}
                style={[styles.groupToolBtn, { borderColor: theme.border }]}
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
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Tab Controls */}
        <SegmentedControl
          value={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          options={[
            { value: "expenses", label: `Expenses (${expenses?.length || 0})` },
            { value: "balances", label: "Balances & Settle" },
          ]}
        />

        {/* Expenses Tab */}
        {activeTab === "expenses" && (
          <View style={{ marginTop: 8 }}>
            {loadingExpenses ? (
              <SkeletonCard />
            ) : expenses && expenses.length > 0 ? (
              expenses.map((exp: any) => (
                <TouchableOpacity
                  key={exp.id}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/expense/${exp.id}`)}
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
                            exp.currency,
                          )}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))
            ) : (
              <Card padding="md" variant="outlined">
                <Text style={{ color: theme.textMuted, textAlign: "center" }}>
                  No expenses in this group yet. Tap '+ Expense' to add one!
                </Text>
              </Card>
            )}
          </View>
        )}

        {/* Balances & Debt Simplification Tab */}
        {activeTab === "balances" && (
          <View style={{ marginTop: 8 }}>
            {/* Simplify Debts Toggle Switch */}
            <Card
              variant="outlined"
              padding="sm"
              style={{ marginBottom: spacing.sm }}
            >
              <View style={styles.simplifyToggleRow}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons
                      name="git-network-outline"
                      size={16}
                      color={theme.primary}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.simplifyTitle, { color: theme.text }]}>
                      Simplify Group Debts
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: theme.textMuted,
                      fontSize: 11,
                      marginTop: 2,
                    }}
                  >
                    Minimizes total payments via graph min-cash-flow algorithm
                  </Text>
                </View>
                <Switch
                  value={simplifyDebts}
                  onValueChange={setSimplifyDebts}
                  trackColor={{ false: theme.divider, true: theme.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </Card>

            {/* Simplified Debts Plan */}
            <View style={styles.subSectionHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={[
                    styles.subSectionTitle,
                    { color: theme.text, fontSize: typography.fontSize.base },
                  ]}
                >
                  {simplifyDebts ? "Optimal Repayment Plan" : "Direct Debts"}
                </Text>
              </View>
            </View>

            {balanceData?.simplifiedDebts &&
            balanceData.simplifiedDebts.length > 0 ? (
              balanceData.simplifiedDebts.map((debt: any, idx: number) => {
                const isDebtor = debt.fromUserId === currentUserId;
                const isCreditor = debt.toUserId === currentUserId;

                return (
                  <Card
                    key={idx}
                    variant="outlined"
                    padding="md"
                    style={{
                      marginBottom: spacing.sm,
                      borderColor: isDebtor
                        ? theme.negative
                        : isCreditor
                          ? theme.positive
                          : theme.border,
                    }}
                  >
                    <View style={styles.debtPlanRow}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.debtPlanTitle, { color: theme.text }]}
                        >
                          <Text style={{ fontWeight: "700" }}>
                            {debt.fromUser?.fullName}
                          </Text>{" "}
                          pays{" "}
                          <Text style={{ fontWeight: "700" }}>
                            {debt.toUser?.fullName}
                          </Text>
                        </Text>
                        <Text
                          style={[
                            styles.debtPlanAmount,
                            {
                              color: isDebtor
                                ? theme.negative
                                : isCreditor
                                  ? theme.positive
                                  : theme.text,
                              fontSize: typography.fontSize.lg,
                            },
                          ]}
                        >
                          {formatCurrency(debt.amountMinor, debt.currency)}
                        </Text>
                      </View>

                      {(isDebtor || isCreditor) && (
                        <Button
                          label="Settle"
                          size="sm"
                          variant={isDebtor ? "danger" : "primary"}
                          onPress={() =>
                            router.push({
                              pathname: "/settle",
                              params: {
                                groupId: id,
                                targetUserId: isDebtor
                                  ? debt.toUserId
                                  : debt.fromUserId,
                                targetName: isDebtor
                                  ? debt.toUser?.fullName
                                  : debt.fromUser?.fullName,
                                amountMinor: debt.amountMinor,
                              },
                            })
                          }
                        />
                      )}
                    </View>
                  </Card>
                );
              })
            ) : (
              <Card padding="md" variant="outlined">
                <Text
                  style={{
                    color: theme.positive,
                    textAlign: "center",
                    fontWeight: "600",
                  }}
                >
                  All debts in this group are fully settled!
                </Text>
              </Card>
            )}

            {/* Individual Member Balances */}
            <View style={[styles.subSectionHeader, { marginTop: spacing.lg }]}>
              <Text
                style={[
                  styles.subSectionTitle,
                  { color: theme.text, fontSize: typography.fontSize.base },
                ]}
              >
                Member Net Balances
              </Text>
            </View>

            {balanceData?.memberBalances &&
              balanceData.memberBalances.map((m: any) => (
                <Card
                  key={m.userId}
                  variant="outlined"
                  padding="sm"
                  style={{ marginBottom: 6 }}
                >
                  <View style={styles.memberBalanceRow}>
                    <Avatar name={m.fullName} size="sm" />
                    <Text
                      style={[
                        styles.memberName,
                        { color: theme.text, flex: 1, marginLeft: 10 },
                      ]}
                    >
                      {m.fullName}
                    </Text>
                    <BalancePill
                      amountMinor={m.netBalanceMinor}
                      currency={group?.defaultCurrency || "INR"}
                    />
                  </View>
                </Card>
              ))}

            {/* Danger Zone: Delete Group */}
            <View style={{ marginTop: spacing.xl }}>
              <Button
                label="Delete Group"
                variant="ghost"
                size="sm"
                onPress={handleDeleteGroup}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Edit Group Bottom Sheet */}
      <BottomSheet
        visible={editSheetVisible}
        onClose={() => setEditSheetVisible(false)}
        title="Edit Group"
      >
        <View style={{ paddingBottom: 20 }}>
          <Input
            label="Group Name"
            value={editName}
            onChangeText={setEditName}
          />
          <Input
            label="Description (Optional)"
            value={editDesc}
            onChangeText={setEditDesc}
          />

          <Button
            label="Save Changes"
            size="md"
            variant="primary"
            onPress={handleSaveEdit}
            style={{ marginTop: spacing.md }}
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
    paddingTop: 10,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleBox: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontWeight: "700",
    fontSize: 16,
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  headerActionIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  addExpBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addExpBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontWeight: "800",
  },
  userGroupBalanceBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
    alignItems: "center",
  },
  groupToolsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F020",
  },
  groupToolBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  simplifyToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  simplifyTitle: {
    fontWeight: "700",
    fontSize: 14,
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
    fontWeight: "700",
    fontSize: 14,
  },
  subSectionHeader: {
    marginBottom: 8,
  },
  subSectionTitle: {
    fontWeight: "700",
  },
  debtPlanRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  debtPlanTitle: {
    fontSize: 13,
  },
  debtPlanAmount: {
    fontWeight: "800",
    marginTop: 2,
  },
  memberBalanceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberName: {
    fontWeight: "600",
  },
});
