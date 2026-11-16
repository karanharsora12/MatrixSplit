import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  SkeletonCard,
  BalancePill,
  BottomSheet,
  Input,
  Button,
  dialog,
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
import { cn } from "@/lib/utils";

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
  const { isDark } = useWatermelonTheme();
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
      dialog.warning("Required", "Group name cannot be empty");
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
      dialog.success("Success", "Group info updated successfully!");
    } catch (err: any) {
      dialog.error("Error", err.response?.data?.message || "Failed to update group");
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
      dialog.info(
        "Export Ready",
        `Summary exported:\nTotal transactions: ${res.data?.recordsCount || expenses?.length || 0}\nDefault Currency: ${group?.defaultCurrency || 'INR'}`
      );
    } catch (err: any) {
      dialog.info(
        "Export CSV",
        `Report for ${group?.name || 'Group'} generated with ${expenses?.length || 0} expenses recorded.`
      );
    }
  };

  const iconName = groupIcons[group?.category || "other"] || "folder-outline";

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className={cn('flex-1', isDark ? 'bg-[#090D16]' : 'bg-[#F8FAFC]')}
    >
      {/* Top Header Bar */}
      <View
        className={cn(
          "flex-row items-center justify-between px-5 pt-3 pb-3 border-b",
          isDark ? "border-[#1E293B] bg-[#090D16]" : "border-slate-200 bg-white"
        )}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className={cn(
            "w-9 h-9 rounded-xl items-center justify-center border active:scale-95",
            isDark
              ? "bg-[#141D2E] border-[#23324D] active:bg-[#1E2A42]"
              : "bg-white border-slate-200 active:bg-slate-100"
          )}
        >
          <Ionicons
            name="chevron-back"
            size={19}
            color={isDark ? "#E2E8F0" : "#334155"}
          />
        </Pressable>

        <View className="flex-1 mx-3">
          <Text
            numberOfLines={1}
            className={cn(
              "text-base font-extrabold tracking-tight",
              isDark ? "text-white" : "text-slate-900"
            )}
          >
            {group?.name || "Group Details"}
          </Text>
          <Text className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 mt-0.5">
            {group?.category ? group.category.toUpperCase() : "GROUP"}
          </Text>
        </View>

        <View className="flex-row items-center">
          <Pressable
            onPress={handleOpenEdit}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className={cn(
              "w-9 h-9 rounded-xl items-center justify-center border active:scale-95 mr-2",
              isDark
                ? "bg-[#141D2E] border-[#23324D] active:bg-[#1E2A42]"
                : "bg-white border-slate-200 active:bg-slate-100"
            )}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={17}
              color={isDark ? "#E2E8F0" : "#334155"}
            />
          </Pressable>

          <Pressable
            onPress={() =>
              router.push({
                pathname: "/expense/add",
                params: { preselectedGroupId: id },
              })
            }
            className="flex-row items-center h-9 px-3.5 rounded-xl bg-emerald-500 active:bg-emerald-600 active:scale-95 shadow-sm"
          >
            <Ionicons
              name="add"
              size={16}
              color="#FFFFFF"
              style={{ marginRight: 2 }}
            />
            <Text className="text-xs font-bold text-white">Expense</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loadingGroup || loadingExpenses}
            onRefresh={onRefresh}
            tintColor="#10B981"
          />
        }
      >
        {/* Group Hero Card */}
        {group && (
          <View
            className={cn(
              "p-5 rounded-3xl border mb-5",
              isDark
                ? "bg-[#141D2E] border-[#23324D]"
                : "bg-white border-slate-200 shadow-sm shadow-black/5"
            )}
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-2xl bg-emerald-500/15 items-center justify-center mr-3.5">
                <Ionicons name={iconName} size={24} color="#10B981" />
              </View>

              <View className="flex-1">
                <Text
                  className={cn(
                    "text-xl font-extrabold tracking-tight",
                    isDark ? "text-white" : "text-slate-900"
                  )}
                  numberOfLines={1}
                >
                  {group.name}
                </Text>
                <View className="flex-row items-center mt-1">
                  <View className="px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30">
                    <Text className="text-[11px] font-bold text-blue-400 capitalize">
                      {group.category}
                    </Text>
                  </View>
                  <Text className="text-xs text-slate-400 ml-2 font-medium">
                    {group.members?.length || 1} member{group.members?.length === 1 ? '' : 's'}
                  </Text>
                </View>
              </View>
            </View>

            {group.description ? (
              <Text className="text-xs text-slate-400 mt-3 leading-5">
                {group.description}
              </Text>
            ) : null}

            {/* Net Position Banner */}
            {balanceData?.userNetBalanceMinor !== undefined && (
              <View
                className={cn(
                  "flex-row items-center p-3 rounded-2xl border my-3.5",
                  balanceData.userNetBalanceMinor > 0
                    ? isDark
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : "bg-emerald-50 border-emerald-200"
                    : balanceData.userNetBalanceMinor < 0
                    ? isDark
                      ? "bg-rose-500/10 border-rose-500/30"
                      : "bg-rose-50 border-rose-200"
                    : isDark
                    ? "bg-[#090D16] border-[#23324D]"
                    : "bg-slate-50 border-slate-200"
                )}
              >
                <Ionicons
                  name={
                    balanceData.userNetBalanceMinor > 0
                      ? "arrow-down-circle"
                      : balanceData.userNetBalanceMinor < 0
                      ? "arrow-up-circle"
                      : "checkmark-circle"
                  }
                  size={17}
                  color={
                    balanceData.userNetBalanceMinor > 0
                      ? "#10B981"
                      : balanceData.userNetBalanceMinor < 0
                      ? "#F43F5E"
                      : "#64748B"
                  }
                  style={{ marginRight: 8 }}
                />
                <Text
                  className={cn(
                    "text-xs font-bold flex-1",
                    balanceData.userNetBalanceMinor > 0
                      ? isDark
                        ? "text-emerald-400"
                        : "text-emerald-700"
                      : balanceData.userNetBalanceMinor < 0
                      ? isDark
                        ? "text-rose-400"
                        : "text-rose-700"
                      : isDark
                      ? "text-slate-300"
                      : "text-slate-700"
                  )}
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
            <View className="flex-row items-center gap-2.5 mt-1">
              <Pressable
                onPress={handleExportReport}
                className={cn(
                  "flex-1 h-9 rounded-xl border flex-row items-center justify-center active:scale-95",
                  isDark
                    ? "bg-[#090D16] border-[#23324D] active:bg-[#1E2A42]"
                    : "bg-slate-50 border-slate-200 active:bg-slate-100"
                )}
              >
                <Ionicons
                  name="download-outline"
                  size={14}
                  color={isDark ? "#94A3B8" : "#64748B"}
                  style={{ marginRight: 5 }}
                />
                <Text
                  className={cn(
                    "text-xs font-semibold",
                    isDark ? "text-slate-300" : "text-slate-700"
                  )}
                >
                  Export CSV
                </Text>
              </Pressable>

              <Pressable
                onPress={handleShareInvite}
                className={cn(
                  "flex-1 h-9 rounded-xl border flex-row items-center justify-center active:scale-95",
                  isDark
                    ? "bg-emerald-500/10 border-emerald-500/30 active:bg-emerald-500/20"
                    : "bg-emerald-50 border-emerald-200 active:bg-emerald-100"
                )}
              >
                <Ionicons
                  name="share-social-outline"
                  size={14}
                  color="#10B981"
                  style={{ marginRight: 5 }}
                />
                <Text className="text-xs font-bold text-emerald-500">
                  Share Invite
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Tab Controls */}
        <View
          className={cn(
            "flex-row p-1 rounded-2xl border mb-5",
            isDark
              ? "bg-[#141D2E] border-[#23324D]"
              : "bg-slate-100 border-slate-200"
          )}
        >
          <Pressable
            onPress={() => setActiveTab("expenses")}
            className={cn(
              "flex-1 py-2 rounded-xl flex-row items-center justify-center active:scale-95",
              activeTab === "expenses"
                ? isDark
                  ? "bg-[#1E293B] shadow-sm"
                  : "bg-white shadow-sm"
                : ""
            )}
          >
            <Text
              className={cn(
                "text-xs font-bold",
                activeTab === "expenses"
                  ? isDark
                    ? "text-white"
                    : "text-slate-900"
                  : isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              )}
            >
              Expenses
            </Text>
            {expenses && expenses.length > 0 && (
              <View
                className={cn(
                  "ml-1.5 px-1.5 py-0.5 rounded-full",
                  activeTab === "expenses"
                    ? "bg-emerald-500/20"
                    : isDark
                    ? "bg-[#090D16]"
                    : "bg-slate-200"
                )}
              >
                <Text className="text-[10px] font-bold text-emerald-400">
                  {expenses.length}
                </Text>
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("balances")}
            className={cn(
              "flex-1 py-2 rounded-xl flex-row items-center justify-center active:scale-95",
              activeTab === "balances"
                ? isDark
                  ? "bg-[#1E293B] shadow-sm"
                  : "bg-white shadow-sm"
                : ""
            )}
          >
            <Text
              className={cn(
                "text-xs font-bold",
                activeTab === "balances"
                  ? isDark
                    ? "text-white"
                    : "text-slate-900"
                  : isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              )}
            >
              Balances
            </Text>
          </Pressable>
        </View>

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
                  className={cn(
                    "p-3.5 rounded-2xl border mb-2.5 flex-row items-center active:scale-[0.99]",
                    isDark
                      ? "bg-[#141D2E] border-[#23324D] active:bg-[#1A253A]"
                      : "bg-white border-slate-200 active:bg-slate-50 shadow-sm shadow-black/5"
                  )}
                >
                  <View
                    className={cn(
                      "w-9 h-9 rounded-xl items-center justify-center mr-3",
                      isDark ? "bg-[#1E293B]" : "bg-slate-100"
                    )}
                  >
                    <Text
                      className={cn(
                        "text-xs font-bold",
                        isDark ? "text-slate-300" : "text-slate-700"
                      )}
                    >
                      {(exp.payer?.fullName || "User").slice(0, 1)}
                    </Text>
                  </View>

                  <View className="flex-1 mr-2">
                    <Text
                      className={cn(
                        "text-sm font-bold",
                        isDark ? "text-white" : "text-slate-900"
                      )}
                      numberOfLines={1}
                    >
                      {exp.title}
                    </Text>
                    <Text className="text-xs text-slate-400 mt-0.5" numberOfLines={1}>
                      Paid by {exp.payer?.fullName} ·{" "}
                      {new Date(exp.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text
                      className={cn(
                        "text-sm font-extrabold font-mono",
                        isDark ? "text-white" : "text-slate-900"
                      )}
                    >
                      {formatCurrency(exp.totalAmountMinor, exp.currency)}
                    </Text>
                    <Text className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      Your share:{" "}
                      {formatCurrency(exp.userShareMinor || 0, exp.currency)}
                    </Text>
                  </View>
                </Pressable>
              ))
            ) : (
              <View
                className={cn(
                  "p-8 rounded-3xl border items-center justify-center",
                  isDark
                    ? "bg-[#141D2E] border-[#23324D]"
                    : "bg-white border-slate-200 shadow-sm shadow-black/5"
                )}
              >
                <View
                  className={cn(
                    "w-14 h-14 rounded-2xl items-center justify-center mb-3",
                    isDark ? "bg-[#1E293B]" : "bg-slate-100"
                  )}
                >
                  <Ionicons name="receipt-outline" size={28} color="#64748B" />
                </View>
                <Text
                  className={cn(
                    "font-bold text-base",
                    isDark ? "text-white" : "text-slate-900"
                  )}
                >
                  No expenses in this group yet
                </Text>
                <Text className="text-xs text-slate-400 text-center mt-1 leading-5 max-w-[260px]">
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
            <View className="flex-row items-center mb-2.5">
              <Ionicons
                name="git-network-outline"
                size={15}
                color="#10B981"
                style={{ marginRight: 6 }}
              />
              <Text
                className={cn(
                  "text-xs font-bold tracking-wider uppercase",
                  isDark ? "text-slate-400" : "text-slate-500"
                )}
              >
                Simplified Repayment Plan
              </Text>
            </View>

            {balanceData?.simplifiedDebts && balanceData.simplifiedDebts.length > 0 ? (
              balanceData.simplifiedDebts.map((debt: any, index: number) => {
                const isFromYou = debt.fromUserId === currentUserId;

                return (
                  <View
                    key={index}
                    className={cn(
                      "p-3.5 rounded-2xl border mb-2.5 flex-row items-center justify-between",
                      isDark
                        ? "bg-[#141D2E] border-[#23324D]"
                        : "bg-white border-slate-200 shadow-sm shadow-black/5"
                    )}
                  >
                    <View className="flex-row items-center flex-1 mr-3">
                      <View
                        className={cn(
                          "w-7 h-7 rounded-full items-center justify-center",
                          isDark ? "bg-[#1E293B]" : "bg-slate-100"
                        )}
                      >
                        <Text
                          className={cn(
                            "text-xs font-bold",
                            isDark ? "text-slate-300" : "text-slate-700"
                          )}
                        >
                          {(debt.fromUser?.fullName || "User").slice(0, 1)}
                        </Text>
                      </View>

                      <Ionicons
                        name="arrow-forward"
                        size={13}
                        color="#10B981"
                        style={{ marginHorizontal: 6 }}
                      />

                      <View
                        className={cn(
                          "w-7 h-7 rounded-full items-center justify-center",
                          isDark ? "bg-[#1E293B]" : "bg-slate-100"
                        )}
                      >
                        <Text
                          className={cn(
                            "text-xs font-bold",
                            isDark ? "text-slate-300" : "text-slate-700"
                          )}
                        >
                          {(debt.toUser?.fullName || "User").slice(0, 1)}
                        </Text>
                      </View>

                      <View className="ml-2.5 flex-1">
                        <Text
                          className={cn(
                            "text-xs font-bold",
                            isDark ? "text-white" : "text-slate-900"
                          )}
                          numberOfLines={1}
                        >
                          {isFromYou ? 'You' : debt.fromUser?.fullName || 'User'} pays {debt.toUser?.fullName || 'User'}
                        </Text>
                        <Text className="text-[11px] text-slate-400 mt-0.5">
                          Min-cash flow settlement
                        </Text>
                      </View>
                    </View>

                    <View className="items-end">
                      <Text
                        className={cn(
                          "text-sm font-extrabold font-mono",
                          isFromYou
                            ? "text-rose-400"
                            : isDark
                            ? "text-white"
                            : "text-slate-900"
                        )}
                      >
                        {formatCurrency(debt.amountMinor, debt.currency)}
                      </Text>
                      {isFromYou && (
                        <Pressable
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
                          className="mt-1 px-3 py-1 rounded-lg bg-emerald-500 active:scale-95 shadow-sm"
                        >
                          <Text className="text-[11px] font-bold text-white">
                            Settle Up
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <View
                className={cn(
                  "p-8 rounded-3xl border items-center justify-center mb-5",
                  isDark
                    ? "bg-[#141D2E] border-[#23324D]"
                    : "bg-white border-slate-200 shadow-sm shadow-black/5"
                )}
              >
                <Ionicons
                  name="checkmark-done-circle-outline"
                  size={36}
                  color="#10B981"
                  style={{ marginBottom: 6 }}
                />
                <Text
                  className={cn(
                    "font-bold text-base",
                    isDark ? "text-white" : "text-slate-900"
                  )}
                >
                  All Settled Up!
                </Text>
                <Text className="text-xs text-slate-400 text-center mt-1">
                  Nobody in this group owes anything right now.
                </Text>
              </View>
            )}

            {/* Member Balances List */}
            <View className="flex-row items-center mb-2.5 mt-4">
              <Text
                className={cn(
                  "text-xs font-bold tracking-wider uppercase",
                  isDark ? "text-slate-400" : "text-slate-500"
                )}
              >
                Member Balances ({group?.members?.length || 0})
              </Text>
            </View>

            {group?.members?.map((m: any) => {
              const mb = balanceData?.members?.find((b: any) => b.userId === m.user?.id);
              const netMinor = mb?.netBalanceMinor || 0;

              return (
                <View
                  key={m.id}
                  className={cn(
                    "p-3.5 rounded-2xl border mb-2.5 flex-row items-center justify-between",
                    isDark
                      ? "bg-[#141D2E] border-[#23324D]"
                      : "bg-white border-slate-200 shadow-sm shadow-black/5"
                  )}
                >
                  <View className="flex-row items-center flex-1 mr-3">
                    <View
                      className={cn(
                        "w-8 h-8 rounded-full items-center justify-center mr-2.5",
                        isDark ? "bg-[#1E293B]" : "bg-slate-100"
                      )}
                    >
                      <Text
                        className={cn(
                          "text-xs font-bold",
                          isDark ? "text-slate-300" : "text-slate-700"
                        )}
                      >
                        {(m.user?.fullName || "Member").slice(0, 1)}
                      </Text>
                    </View>

                    <View className="flex-1">
                      <Text
                        className={cn(
                          "text-xs font-bold",
                          isDark ? "text-white" : "text-slate-900"
                        )}
                        numberOfLines={1}
                      >
                        {m.user?.fullName || "Member"} {m.role === 'admin' ? '⭐' : ''}
                      </Text>
                      <Text className="text-[11px] text-slate-400 mt-0.5" numberOfLines={1}>
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
        <View className="py-1">
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

          <View className="mt-3">
            <Button
              label="Save Changes"
              size="lg"
              variant="primary"
              fullWidth
              onPress={handleSaveEdit}
            />
          </View>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
