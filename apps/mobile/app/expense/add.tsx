import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWatermelonTheme } from "@/theme";
import { dialog } from "@/components";
import {
  useCreateExpense,
  useMyGroups,
  useFriends,
} from "../../src/hooks/useQueries";
import { useAuthStore } from "../../src/stores/authStore";
import {
  ExpenseCategory,
  SplitType,
  CurrencyCode,
  toMinorUnits,
  formatCurrency,
  resolveSplit,
} from "@matrixsplit/shared";
import { cn } from "@/lib/utils";

const categoryOptions: {
  label: string;
  value: ExpenseCategory;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  {
    label: "Food & Drink",
    value: "food_and_drink",
    icon: "restaurant-outline",
    color: "#F59E0B",
  },
  {
    label: "Groceries",
    value: "groceries",
    icon: "cart-outline",
    color: "#10B981",
  },
  {
    label: "Transport",
    value: "transport",
    icon: "car-outline",
    color: "#3B82F6",
  },
  {
    label: "Housing",
    value: "housing",
    icon: "home-outline",
    color: "#8B5CF6",
  },
  {
    label: "Entertainment",
    value: "entertainment",
    icon: "film-outline",
    color: "#EC4899",
  },
  {
    label: "Travel",
    value: "travel",
    icon: "airplane-outline",
    color: "#06B6D4",
  },
  {
    label: "Utilities",
    value: "utilities",
    icon: "flash-outline",
    color: "#F97316",
  },
  {
    label: "Shopping",
    value: "shopping",
    icon: "bag-handle-outline",
    color: "#EAB308",
  },
  {
    label: "Health",
    value: "health",
    icon: "medkit-outline",
    color: "#EF4444",
  },
  {
    label: "General",
    value: "general",
    icon: "receipt-outline",
    color: "#64748B",
  },
];

export default function AddExpenseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    preselectedGroupId?: string;
  }>();
  const preselectedGroupId = params?.preselectedGroupId;
  const { isDark } = useWatermelonTheme();
  const user = useAuthStore((s) => s.user);

  const { data: groups } = useMyGroups();
  const { data: friends } = useFriends();
  const createExpenseMutation = useCreateExpense();

  // Form State
  const [title, setTitle] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>(
    user?.defaultCurrency || "INR",
  );
  const [category, setCategory] = useState<ExpenseCategory>("food_and_drink");
  const [groupId, setGroupId] = useState<string | null>(
    preselectedGroupId || null,
  );
  const [payerId, setPayerId] = useState<string>(user?.id || "");
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [notes, setNotes] = useState("");

  // Available participants list
  const [participants, setParticipants] = useState<
    {
      userId: string;
      fullName: string;
      selected: boolean;
      exactAmountStr: string;
      percentageStr: string;
      sharesStr: string;
    }[]
  >([]);

  // Setup participants list on group/friend selection change
  useEffect(() => {
    if (!user) return;

    if (groupId) {
      const selectedGroup = groups?.find((g: any) => g.id === groupId);
      if (selectedGroup && selectedGroup.members) {
        setParticipants(
          selectedGroup.members.map((m: any) => ({
            userId: m.userId,
            fullName:
              m.userId === user.id
                ? `${m.user.fullName} (You)`
                : m.user.fullName,
            selected: true,
            exactAmountStr: "",
            percentageStr: "",
            sharesStr: "1",
          })),
        );
        return;
      }
    }

    // Default non-group participants (current user + friends)
    const list = [
      {
        userId: user.id,
        fullName: `${user.fullName} (You)`,
        selected: true,
        exactAmountStr: "",
        percentageStr: "",
        sharesStr: "1",
      },
    ];

    if (friends && friends.length > 0) {
      for (const f of friends) {
        list.push({
          userId: f.id,
          fullName: f.fullName,
          selected: true,
          exactAmountStr: "",
          percentageStr: "",
          sharesStr: "1",
        });
      }
    }

    setParticipants(list);
  }, [groupId, groups, friends, user]);

  const toggleParticipant = (userId: string) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.userId === userId ? { ...p, selected: !p.selected } : p,
      ),
    );
  };

  const updateExactAmount = (userId: string, val: string) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.userId === userId ? { ...p, exactAmountStr: val } : p,
      ),
    );
  };

  const updatePercentage = (userId: string, val: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.userId === userId ? { ...p, percentageStr: val } : p)),
    );
  };

  const updateShares = (userId: string, val: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.userId === userId ? { ...p, sharesStr: val } : p)),
    );
  };

  // Calculations for live split breakdown
  const totalMinor = useMemo(() => {
    return toMinorUnits(amountStr || "0", currency);
  }, [amountStr, currency]);

  const selectedParticipants = useMemo(() => {
    return participants.filter((p) => p.selected);
  }, [participants]);

  const splitBreakdown = useMemo(() => {
    if (totalMinor <= 0 || selectedParticipants.length === 0) return null;

    if (splitType === "equal") {
      const perPerson = Math.floor(totalMinor / selectedParticipants.length);
      return {
        type: "equal",
        perPerson,
        valid: true,
        message: `Each person owes ${formatCurrency(perPerson, currency)}`,
      };
    }

    if (splitType === "exact") {
      const assignedSum = selectedParticipants.reduce(
        (sum, p) => sum + toMinorUnits(p.exactAmountStr || "0", currency),
        0,
      );
      const remaining = totalMinor - assignedSum;
      return {
        type: "exact",
        assignedSum,
        remaining,
        valid: remaining === 0,
        message:
          remaining === 0
            ? "Amounts matched perfectly!"
            : remaining > 0
              ? `${formatCurrency(remaining, currency)} remaining to allocate`
              : `${formatCurrency(Math.abs(remaining), currency)} over allocated`,
      };
    }

    if (splitType === "percentage") {
      const totalPercent = selectedParticipants.reduce(
        (sum, p) => sum + (parseFloat(p.percentageStr || "0") || 0),
        0,
      );
      const valid = Math.abs(totalPercent - 100) < 0.01;
      return {
        type: "percentage",
        totalPercent,
        valid,
        message: valid
          ? "Percentages equal 100%!"
          : `Total is ${totalPercent.toFixed(1)}% (must be 100%)`,
      };
    }

    if (splitType === "shares") {
      const totalShares = selectedParticipants.reduce(
        (sum, p) => sum + (parseInt(p.sharesStr || "1", 10) || 1),
        0,
      );
      return {
        type: "shares",
        totalShares,
        valid: totalShares > 0,
        message: `${totalShares} total shares calculated`,
      };
    }

    return null;
  }, [totalMinor, selectedParticipants, splitType, currency]);

  const handleSave = async () => {
    if (!title.trim()) {
      dialog.warning("Required", "Please enter what this expense was for");
      return;
    }

    if (totalMinor <= 0) {
      dialog.warning("Invalid Amount", "Please enter a valid expense amount");
      return;
    }

    if (selectedParticipants.length === 0) {
      dialog.warning("Participants Required", "Select at least one participant");
      return;
    }

    if (splitBreakdown && !splitBreakdown.valid) {
      dialog.warning("Split Mismatch", splitBreakdown.message);
      return;
    }

    try {
      const participantInputs = selectedParticipants.map((p) => {
        if (splitType === "exact") {
          return {
            userId: p.userId,
            allocatedAmountMinor: toMinorUnits(
              p.exactAmountStr || "0",
              currency,
            ),
          };
        } else if (splitType === "percentage") {
          return {
            userId: p.userId,
            percentage: parseFloat(p.percentageStr || "0"),
          };
        } else if (splitType === "shares") {
          return {
            userId: p.userId,
            shares: parseInt(p.sharesStr || "1", 10),
          };
        } else {
          return { userId: p.userId };
        }
      });

      resolveSplit(splitType, totalMinor, participantInputs);

      await createExpenseMutation.mutateAsync({
        title: title.trim(),
        totalAmountMinor: totalMinor,
        currency,
        category,
        date: new Date().toISOString(),
        payerId: payerId || user!.id,
        groupId: groupId || null,
        splitType,
        notes: notes.trim() || undefined,
        participants: participantInputs,
      });

      dialog.success("Success", "Expense recorded successfully!", () => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/(tabs)");
        }
      });
    } catch (err: any) {
      const msg =
        err.response?.data?.message || err.message || "Failed to save expense";
      dialog.error("Error", msg);
    }
  };

  const getCurrencySymbol = (curr: CurrencyCode) => {
    switch (curr) {
      case "INR":
        return "₹";
      case "USD":
        return "$";
      case "EUR":
        return "€";
      case "GBP":
        return "£";
      default:
        return curr;
    }
  };

  const selectedCategoryObj = categoryOptions.find((c) => c.value === category);

  const currentGroupName = useMemo(() => {
    if (!groupId || !groups) return null;
    return groups.find((g: any) => g.id === groupId)?.name || null;
  }, [groupId, groups]);

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className={cn("flex-1", isDark ? "bg-[#090D16]" : "bg-[#F8FAFC]")}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {/* Top Header Bar */}
        <View
          className={cn(
            "flex-row items-center justify-between px-5 pt-3 pb-3 border-b",
            isDark
              ? "border-[#1E293B] bg-[#090D16]"
              : "border-slate-200 bg-white",
          )}
        >
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(tabs)");
              }
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className={cn(
              "w-9 h-9 rounded-xl items-center justify-center border active:scale-95",
              isDark
                ? "bg-[#141D2E] border-[#23324D] active:bg-[#1E2A42]"
                : "bg-white border-slate-200 active:bg-slate-100",
            )}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={isDark ? "#E2E8F0" : "#334155"}
            />
          </Pressable>

          <View className="items-center">
            <Text
              className={cn(
                "text-base font-extrabold tracking-tight",
                isDark ? "text-white" : "text-slate-900",
              )}
            >
              Add Expense
            </Text>
            <Text className="text-xs text-slate-400 mt-0.5 font-medium">
              {currentGroupName || "Personal Expense"}
            </Text>
          </View>

          {/* Spacer to keep center title balanced */}
          <View className="w-9 h-9" />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Amount & Description Card */}
          <View
            className={cn(
              "p-5 rounded-3xl border mb-5",
              isDark
                ? "bg-[#141D2E] border-[#23324D]"
                : "bg-white border-slate-200 shadow-sm shadow-black/5",
            )}
          >
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-xs font-bold text-slate-400 tracking-wider">
                AMOUNT
              </Text>
              <View
                className={cn(
                  "px-2.5 py-1 rounded-full border",
                  isDark
                    ? "bg-[#1E293B] border-[#23324D]"
                    : "bg-slate-100 border-slate-200",
                )}
              >
                <Text
                  className={cn(
                    "text-[11px] font-extrabold font-mono",
                    isDark ? "text-slate-300" : "text-slate-700",
                  )}
                >
                  {currency}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center my-1">
              <Text className="text-3xl font-extrabold text-emerald-500 font-mono mr-1.5">
                {getCurrencySymbol(currency)}
              </Text>
              <TextInput
                placeholder="0.00"
                placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                value={amountStr}
                onChangeText={setAmountStr}
                keyboardType="decimal-pad"
                className={cn(
                  "text-3xl font-extrabold font-mono flex-1 py-0",
                  isDark ? "text-white" : "text-slate-900",
                )}
              />
            </View>

            <View
              className={cn(
                "h-[1px] my-3.5",
                isDark ? "bg-[#23324D]" : "bg-slate-100",
              )}
            />

            <View className="flex-row items-center">
              <View
                className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                style={{
                  backgroundColor: `${selectedCategoryObj?.color || "#10B981"}20`,
                }}
              >
                <Ionicons
                  name={selectedCategoryObj?.icon || "receipt-outline"}
                  size={17}
                  color={selectedCategoryObj?.color || "#10B981"}
                />
              </View>
              <TextInput
                placeholder="What was this expense for? (e.g. Dinner, Taxi)"
                placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                value={title}
                onChangeText={setTitle}
                className={cn(
                  "flex-1 text-sm font-medium py-0",
                  isDark ? "text-white" : "text-slate-900",
                )}
              />
            </View>
          </View>

          {/* Group Selector */}
          {groups && groups.length > 0 && (
            <View className="mb-5">
              <Text
                className={cn(
                  "text-xs font-bold tracking-wider mb-2.5 uppercase",
                  isDark ? "text-slate-400" : "text-slate-500",
                )}
              >
                Choose Group
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 10 }}
              >
                <Pressable
                  onPress={() => setGroupId(null)}
                  className={cn(
                    "h-9 px-4 rounded-full flex-row items-center mr-2.5 active:scale-95",
                    groupId === null
                      ? "bg-emerald-500 shadow-sm"
                      : isDark
                        ? "bg-[#141D2E] border border-[#23324D]"
                        : "bg-white border border-slate-200",
                  )}
                >
                  <Ionicons
                    name="people-outline"
                    size={15}
                    color={
                      groupId === null
                        ? "#FFFFFF"
                        : isDark
                          ? "#94A3B8"
                          : "#64748B"
                    }
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    className={cn(
                      "text-xs font-bold",
                      groupId === null
                        ? "text-white"
                        : isDark
                          ? "text-slate-300"
                          : "text-slate-700",
                    )}
                  >
                    Non-group / Direct
                  </Text>
                </Pressable>

                {groups.map((g: any) => {
                  const isSelected = groupId === g.id;
                  return (
                    <Pressable
                      key={g.id}
                      onPress={() => setGroupId(g.id)}
                      className={cn(
                        "h-9 px-4 rounded-full flex-row items-center mr-2.5 active:scale-95",
                        isSelected
                          ? "bg-emerald-500 shadow-sm"
                          : isDark
                            ? "bg-[#141D2E] border border-[#23324D]"
                            : "bg-white border border-slate-200",
                      )}
                    >
                      <Ionicons
                        name="folder-outline"
                        size={15}
                        color={
                          isSelected
                            ? "#FFFFFF"
                            : isDark
                              ? "#94A3B8"
                              : "#64748B"
                        }
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        className={cn(
                          "text-xs font-bold",
                          isSelected
                            ? "text-white"
                            : isDark
                              ? "text-slate-300"
                              : "text-slate-700",
                        )}
                      >
                        {g.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Category Selector Chips */}
          <View className="mb-5">
            <Text
              className={cn(
                "text-xs font-bold tracking-wider mb-2.5 uppercase",
                isDark ? "text-slate-400" : "text-slate-500",
              )}
            >
              Category
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 10 }}
            >
              {categoryOptions.map((opt) => {
                const isSelected = category === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setCategory(opt.value)}
                    className={cn(
                      "h-9 px-3.5 rounded-full flex-row items-center mr-2.5 active:scale-95",
                      isSelected
                        ? "bg-emerald-500 shadow-sm"
                        : isDark
                          ? "bg-[#141D2E] border border-[#23324D]"
                          : "bg-white border border-slate-200",
                    )}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={15}
                      color={isSelected ? "#FFFFFF" : opt.color}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      className={cn(
                        "text-xs font-bold",
                        isSelected
                          ? "text-white"
                          : isDark
                            ? "text-slate-300"
                            : "text-slate-700",
                      )}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Paid By Selector */}
          <View className="mb-5">
            <Text
              className={cn(
                "text-xs font-bold tracking-wider mb-2.5 uppercase",
                isDark ? "text-slate-400" : "text-slate-500",
              )}
            >
              Paid By
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 10 }}
            >
              {participants.map((p) => {
                const isSelected = payerId === p.userId;
                return (
                  <Pressable
                    key={p.userId}
                    onPress={() => setPayerId(p.userId)}
                    className={cn(
                      "h-9 px-3.5 rounded-full flex-row items-center mr-2.5 active:scale-95",
                      isSelected
                        ? "bg-emerald-500 shadow-sm"
                        : isDark
                          ? "bg-[#141D2E] border border-[#23324D]"
                          : "bg-white border border-slate-200",
                    )}
                  >
                    <View
                      className={cn(
                        "w-5 h-5 rounded-full items-center justify-center mr-2",
                        isSelected
                          ? "bg-white/20"
                          : isDark
                            ? "bg-[#1E293B]"
                            : "bg-slate-200",
                      )}
                    >
                      <Text
                        className={cn(
                          "text-[10px] font-bold",
                          isSelected
                            ? "text-white"
                            : isDark
                              ? "text-slate-300"
                              : "text-slate-700",
                        )}
                      >
                        {p.fullName.slice(0, 1)}
                      </Text>
                    </View>
                    <Text
                      className={cn(
                        "text-xs font-bold",
                        isSelected
                          ? "text-white"
                          : isDark
                            ? "text-slate-300"
                            : "text-slate-700",
                      )}
                    >
                      {p.fullName}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color="#FFFFFF"
                        style={{ marginLeft: 5 }}
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Split Type Selector */}
          <View className="mb-5">
            <Text
              className={cn(
                "text-xs font-bold tracking-wider mb-2.5 uppercase",
                isDark ? "text-slate-400" : "text-slate-500",
              )}
            >
              Split Method
            </Text>
            <View
              className={cn(
                "flex-row p-1 rounded-2xl border",
                isDark
                  ? "bg-[#141D2E] border-[#23324D]"
                  : "bg-slate-100 border-slate-200",
              )}
            >
              {(
                [
                  { value: "equal" as const, label: "Equal" },
                  { value: "exact" as const, label: "Exact" },
                  { value: "percentage" as const, label: "Percent" },
                  { value: "shares" as const, label: "Shares" },
                ] as const
              ).map((tab) => {
                const isActive = splitType === tab.value;
                return (
                  <Pressable
                    key={tab.value}
                    onPress={() => setSplitType(tab.value)}
                    className={cn(
                      "flex-1 py-2 rounded-xl items-center justify-center active:scale-95",
                      isActive
                        ? isDark
                          ? "bg-[#1E293B] shadow-sm"
                          : "bg-white shadow-sm"
                        : "",
                    )}
                  >
                    <Text
                      className={cn(
                        "text-xs font-bold",
                        isActive
                          ? isDark
                            ? "text-white"
                            : "text-slate-900"
                          : isDark
                            ? "text-slate-400"
                            : "text-slate-500",
                      )}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Split Status Banner */}
            {splitBreakdown && (
              <View
                className={cn(
                  "flex-row items-center p-3 rounded-2xl border mt-3",
                  splitBreakdown.valid
                    ? isDark
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : "bg-emerald-50 border-emerald-200"
                    : isDark
                      ? "bg-red-500/10 border-red-500/30"
                      : "bg-red-50 border-red-200",
                )}
              >
                <Ionicons
                  name={
                    splitBreakdown.valid ? "checkmark-circle" : "alert-circle"
                  }
                  size={16}
                  color={splitBreakdown.valid ? "#10B981" : "#EF4444"}
                  style={{ marginRight: 8 }}
                />
                <Text
                  className={cn(
                    "text-xs font-bold flex-1",
                    splitBreakdown.valid
                      ? isDark
                        ? "text-emerald-400"
                        : "text-emerald-600"
                      : isDark
                        ? "text-red-400"
                        : "text-red-600",
                  )}
                >
                  {splitBreakdown.message}
                </Text>
              </View>
            )}
          </View>

          {/* Participants Allocation List */}
          <View className="mb-5">
            <View className="flex-row items-center justify-between mb-2.5">
              <Text
                className={cn(
                  "text-xs font-bold tracking-wider uppercase",
                  isDark ? "text-slate-400" : "text-slate-500",
                )}
              >
                Split Between ({selectedParticipants.length} selected)
              </Text>
              <Pressable
                onPress={() => {
                  const allSelected = participants.every((p) => p.selected);
                  setParticipants((prev) =>
                    prev.map((p) => ({ ...p, selected: !allSelected })),
                  );
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text className="text-xs font-bold text-emerald-500">
                  {participants.every((p) => p.selected)
                    ? "Deselect all"
                    : "Select all"}
                </Text>
              </Pressable>
            </View>

            {participants.map((p) => {
              const perPersonMinor =
                splitType === "equal" && selectedParticipants.length > 0
                  ? Math.floor(totalMinor / selectedParticipants.length)
                  : 0;

              return (
                <View
                  key={p.userId}
                  className={cn(
                    "flex-row items-center justify-between p-3.5 rounded-2xl border mb-2.5",
                    p.selected
                      ? isDark
                        ? "bg-[#141D2E] border-emerald-500/40"
                        : "bg-white border-emerald-500/50 shadow-sm shadow-emerald-500/5"
                      : isDark
                        ? "bg-[#141D2E]/60 border-[#23324D] opacity-60"
                        : "bg-white/60 border-slate-200 opacity-60",
                  )}
                >
                  <Pressable
                    onPress={() => toggleParticipant(p.userId)}
                    className="flex-row items-center flex-1 mr-2"
                  >
                    {/* Custom Checkbox */}
                    <View
                      className={cn(
                        "w-5 h-5 rounded-md items-center justify-center mr-3 border",
                        p.selected
                          ? "bg-emerald-500 border-emerald-500"
                          : isDark
                            ? "border-[#23324D]"
                            : "border-slate-300",
                      )}
                    >
                      {p.selected && (
                        <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                      )}
                    </View>

                    <View
                      className={cn(
                        "w-7 h-7 rounded-full items-center justify-center mr-2.5",
                        isDark ? "bg-[#1E293B]" : "bg-slate-100",
                      )}
                    >
                      <Text
                        className={cn(
                          "text-xs font-bold",
                          isDark ? "text-slate-300" : "text-slate-700",
                        )}
                      >
                        {p.fullName.slice(0, 1)}
                      </Text>
                    </View>

                    <Text
                      numberOfLines={1}
                      className={cn(
                        "text-sm flex-1",
                        p.selected ? "font-bold" : "font-normal",
                        isDark ? "text-white" : "text-slate-900",
                      )}
                    >
                      {p.fullName}
                    </Text>
                  </Pressable>

                  {/* Right side controls based on split type */}
                  {p.selected && (
                    <View>
                      {splitType === "equal" && totalMinor > 0 && (
                        <View className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <Text className="text-xs font-bold font-mono text-emerald-500">
                            {formatCurrency(perPersonMinor, currency)}
                          </Text>
                        </View>
                      )}

                      {splitType === "exact" && (
                        <View
                          className={cn(
                            "flex-row items-center h-8 px-2.5 rounded-xl border",
                            isDark
                              ? "bg-[#1E293B] border-[#23324D]"
                              : "bg-slate-100 border-slate-200",
                          )}
                        >
                          <Text className="text-xs font-bold text-slate-400 mr-1">
                            {getCurrencySymbol(currency)}
                          </Text>
                          <TextInput
                            placeholder="0.00"
                            placeholderTextColor="#64748B"
                            value={p.exactAmountStr}
                            onChangeText={(val) =>
                              updateExactAmount(p.userId, val)
                            }
                            keyboardType="decimal-pad"
                            className={cn(
                              "text-xs font-bold font-mono py-0 min-w-[45px]",
                              isDark ? "text-white" : "text-slate-900",
                            )}
                          />
                        </View>
                      )}

                      {splitType === "percentage" && (
                        <View
                          className={cn(
                            "flex-row items-center h-8 px-2.5 rounded-xl border",
                            isDark
                              ? "bg-[#1E293B] border-[#23324D]"
                              : "bg-slate-100 border-slate-200",
                          )}
                        >
                          <TextInput
                            placeholder="0"
                            placeholderTextColor="#64748B"
                            value={p.percentageStr}
                            onChangeText={(val) =>
                              updatePercentage(p.userId, val)
                            }
                            keyboardType="decimal-pad"
                            className={cn(
                              "text-xs font-bold font-mono py-0 min-w-[30px] text-right",
                              isDark ? "text-white" : "text-slate-900",
                            )}
                          />
                          <Text className="text-xs font-bold text-slate-400 ml-1">
                            %
                          </Text>
                        </View>
                      )}

                      {splitType === "shares" && (
                        <View
                          className={cn(
                            "flex-row items-center h-8 px-2.5 rounded-xl border",
                            isDark
                              ? "bg-[#1E293B] border-[#23324D]"
                              : "bg-slate-100 border-slate-200",
                          )}
                        >
                          <TextInput
                            placeholder="1"
                            placeholderTextColor="#64748B"
                            value={p.sharesStr}
                            onChangeText={(val) => updateShares(p.userId, val)}
                            keyboardType="number-pad"
                            className={cn(
                              "text-xs font-bold font-mono py-0 min-w-[24px] text-center",
                              isDark ? "text-white" : "text-slate-900",
                            )}
                          />
                          <Text className="text-xs font-bold text-slate-400 ml-1">
                            share{p.sharesStr !== "1" ? "s" : ""}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Notes Input */}
          <View className="mb-6">
            <Text
              className={cn(
                "text-xs font-bold tracking-wider mb-2.5 uppercase",
                isDark ? "text-slate-400" : "text-slate-500",
              )}
            >
              Notes (Optional)
            </Text>
            <View
              className={cn(
                "p-3.5 rounded-2xl border",
                isDark
                  ? "bg-[#141D2E] border-[#23324D]"
                  : "bg-white border-slate-200 shadow-sm shadow-black/5",
              )}
            >
              <TextInput
                placeholder="Add payment method, notes, or items purchased..."
                placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
                className={cn(
                  "text-sm font-medium py-0 min-h-[48px]",
                  isDark ? "text-white" : "text-slate-900",
                )}
              />
            </View>
          </View>

          {/* Primary Save Button */}
          <View className="mb-8">
            <Pressable
              onPress={handleSave}
              disabled={
                createExpenseMutation.isPending ||
                !title.trim() ||
                totalMinor <= 0
              }
              className={cn(
                "h-13 py-3.5 rounded-2xl items-center justify-center active:scale-[0.98] shadow-md",
                createExpenseMutation.isPending ||
                  !title.trim() ||
                  totalMinor <= 0
                  ? isDark
                    ? "bg-[#1A2333] opacity-60"
                    : "bg-slate-200 opacity-60"
                  : "bg-emerald-500 active:bg-emerald-600",
              )}
            >
              {createExpenseMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  className={cn(
                    "text-sm font-extrabold",
                    createExpenseMutation.isPending ||
                      !title.trim() ||
                      totalMinor <= 0
                      ? isDark
                        ? "text-slate-500"
                        : "text-slate-400"
                      : "text-white",
                  )}
                >
                  {totalMinor > 0
                    ? `Save Expense (${formatCurrency(totalMinor, currency)})`
                    : "Save Expense"}
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
