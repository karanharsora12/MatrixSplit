import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Avatar,
  Badge,
  Button,
  SkeletonCard,
} from '@/components';
import { useWatermelonTheme } from '@/theme';
import {
  useExpenseDetails,
  useDeleteExpense,
} from "../../src/hooks/useQueries";
import { useAuthStore } from "../../src/stores/authStore";
import { formatCurrency, ExpenseCategory } from "@matrixsplit/shared";

const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  food_and_drink: "restaurant-outline",
  groceries: "cart-outline",
  transport: "car-outline",
  housing: "home-outline",
  entertainment: "film-outline",
  travel: "airplane-outline",
  utilities: "flash-outline",
  shopping: "bag-handle-outline",
  health: "medkit-outline",
  general: "receipt-outline",
};

export default function ExpenseDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, isDark } = useWatermelonTheme();
  const currentUser = useAuthStore((s) => s.user);

  const { data: expense, isLoading } = useExpenseDetails(id!);
  const deleteMutation = useDeleteExpense();

  // Comments state
  const [commentText, setCommentText] = useState("");
  const [commentsList, setCommentsList] = useState<
    { id: string; author: string; text: string; time: string }[]
  >([
    {
      id: "c1",
      author: "Alice Johnson",
      text: "Thanks for paying up front! Will settle this evening.",
      time: "2 hours ago",
    },
  ]);

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const newComment = {
      id: Date.now().toString(),
      author: currentUser?.fullName || "You",
      text: commentText.trim(),
      time: "Just now",
    };
    setCommentsList((prev) => [...prev, newComment]);
    setCommentText("");
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Expense",
      "Are you sure you want to delete this expense? This will recalculate all group and member balances.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(id!);
              Alert.alert("Deleted", "Expense deleted successfully", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (err: any) {
              Alert.alert(
                "Error",
                err.response?.data?.message || "Failed to delete"
              );
            }
          },
        },
      ]
    );
  };

  const iconName = expense
    ? categoryIcons[expense.category] || "receipt-outline"
    : "receipt-outline";

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.container, { backgroundColor: isDark ? '#090D16' : '#F8FAFC' }]}
    >
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

        <Text
          style={[
            styles.headerTitle,
            { color: theme.text },
          ]}
        >
          Expense Receipt
        </Text>

        <Pressable
          onPress={handleDelete}
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
          <Ionicons name="trash-outline" size={18} color="#F43F5E" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading || !expense ? (
          <SkeletonCard />
        ) : (
          <>
            {/* Hero Receipt Card */}
            <View
              style={[
                styles.receiptCard,
                {
                  backgroundColor: isDark ? '#111827' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.25 : 0.04,
                  shadowRadius: 6,
                  elevation: 2,
                },
              ]}
            >
              <View
                style={[
                  styles.categoryCircle,
                  { backgroundColor: isDark ? 'rgba(16,185,129,0.18)' : '#D1FAE5' },
                ]}
              >
                <Ionicons name={iconName} size={32} color={theme.primary} />
              </View>

              <Text
                style={[
                  styles.expenseTitle,
                  { color: theme.text },
                ]}
              >
                {expense.title}
              </Text>

              <Text
                style={[
                  styles.expenseAmountLarge,
                  { color: theme.text },
                ]}
              >
                {formatCurrency(expense.totalAmountMinor, expense.currency)}
              </Text>

              <View style={styles.metaRow}>
                <Badge label={expense.category} size="sm" variant="info" />
                <Text style={{ color: theme.textMuted, marginHorizontal: 8 }}>·</Text>
                <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                  {new Date(expense.date).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>

              {expense.notes ? (
                <View
                  style={[
                    styles.notesBox,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <Ionicons name="document-text-outline" size={16} color={theme.textMuted} style={{ marginRight: 6 }} />
                  <Text style={{ color: theme.text, fontSize: 13, flex: 1 }}>
                    {expense.notes}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Paid By Info Card */}
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: isDark ? '#111827' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              <Text
                style={[
                  styles.sectionHeaderLabel,
                  { color: theme.textMuted },
                ]}
              >
                PAID BY
              </Text>
              <View style={styles.payerRow}>
                <Avatar name={expense.payer?.fullName || "User"} size="md" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: "700", fontSize: 14 }}>
                    {expense.payer?.fullName}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                    Paid the entire amount upfront
                  </Text>
                </View>
                <Text style={{ color: isDark ? '#34D399' : '#059669', fontWeight: "800", fontSize: 15, fontVariant: ['tabular-nums'] }}>
                  {formatCurrency(expense.totalAmountMinor, expense.currency)}
                </Text>
              </View>
            </View>

            {/* Split Breakdown Table */}
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: isDark ? '#111827' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text
                  style={[
                    styles.sectionHeaderLabel,
                    { color: theme.textMuted },
                  ]}
                >
                  SPLIT BREAKDOWN ({expense.participants?.length || 0})
                </Text>
                <Badge
                  label={expense.splitType.toUpperCase()}
                  size="sm"
                  variant="neutral"
                />
              </View>

              {expense.participants?.map((p: any) => {
                const isCurrentUser = p.userId === currentUser?.id;
                return (
                  <View
                    key={p.userId}
                    style={[
                      styles.participantRow,
                      { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' },
                    ]}
                  >
                    <Avatar name={p.user?.fullName || "User"} size="sm" />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text
                        style={{
                          color: theme.text,
                          fontWeight: isCurrentUser ? "800" : "600",
                          fontSize: 13,
                        }}
                      >
                        {p.user?.fullName} {isCurrentUser ? "(You)" : ""}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: theme.text,
                        fontWeight: "700",
                        fontSize: 14,
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      {formatCurrency(p.allocatedAmountMinor, expense.currency)}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Activity & Comments Section */}
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: isDark ? '#111827' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  marginBottom: 24,
                },
              ]}
            >
              <Text
                style={[
                  styles.sectionHeaderLabel,
                  { color: theme.textMuted, marginBottom: 10 },
                ]}
              >
                NOTES & COMMENTS ({commentsList.length})
              </Text>

              {commentsList.map((c) => (
                <View
                  key={c.id}
                  style={[
                    styles.commentBubble,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                    <Text style={{ color: theme.text, fontWeight: "700", fontSize: 12 }}>
                      {c.author}
                    </Text>
                    <Text style={{ color: theme.textMuted, fontSize: 10 }}>
                      {c.time}
                    </Text>
                  </View>
                  <Text style={{ color: theme.text, fontSize: 13, lineHeight: 18 }}>
                    {c.text}
                  </Text>
                </View>
              ))}

              <View style={styles.commentInputRow}>
                <TextInput
                  placeholder="Add a comment or note..."
                  placeholderTextColor={theme.textMuted}
                  value={commentText}
                  onChangeText={setCommentText}
                  style={[
                    styles.commentInput,
                    {
                      color: theme.text,
                      backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                      borderColor: isDark ? '#1E293B' : '#E2E8F0',
                    },
                  ]}
                />
                <Button
                  label="Send"
                  size="sm"
                  variant="primary"
                  onPress={handleAddComment}
                  style={{ height: 40, paddingHorizontal: 14 }}
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>
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
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 36,
  },
  receiptCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    marginBottom: 14,
  },
  categoryCircle: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  expenseTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  expenseAmountLarge: {
    fontSize: 34,
    fontWeight: "800",
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.8,
    marginVertical: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  notesBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
    width: "100%",
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  sectionHeaderLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  payerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  commentBubble: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
});
