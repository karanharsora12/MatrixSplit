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
  Card,
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
  const { theme, typography, spacing, borderRadius, isDark } = useWatermelonTheme();
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

        <Text
          style={[
            styles.headerTitle,
            { color: theme.text, fontSize: typography.fontSize.base },
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
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons name="trash-outline" size={18} color={theme.negative} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isLoading || !expense ? (
          <SkeletonCard />
        ) : (
          <>
            {/* Hero Receipt Card */}
            <Card
              variant="elevated"
              padding="lg"
              style={{ marginBottom: spacing.md, alignItems: "center" }}
            >
              <View
                style={[
                  styles.categoryCircle,
                  { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#D1FAE5' },
                ]}
              >
                <Ionicons name={iconName} size={36} color={theme.primary} />
              </View>

              <Text
                style={[
                  styles.expenseTitle,
                  { color: theme.text, fontSize: typography.fontSize.xl },
                ]}
              >
                {expense.title}
              </Text>

              <Text
                style={[
                  styles.expenseAmountLarge,
                  { color: theme.text, fontSize: typography.fontSize['4xl'] },
                ]}
              >
                {formatCurrency(expense.totalAmountMinor, expense.currency)}
              </Text>

              <View style={styles.metaRow}>
                <Badge label={expense.category} size="sm" variant="info" />
                <Text style={{ color: theme.textMuted, marginHorizontal: 8 }}>•</Text>
                <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                  {new Date(expense.date).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>

              {expense.notes ? (
                <View style={[styles.notesBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Ionicons name="document-text-outline" size={16} color={theme.textMuted} style={{ marginRight: 6 }} />
                  <Text style={{ color: theme.text, fontSize: 13, flex: 1 }}>
                    {expense.notes}
                  </Text>
                </View>
              ) : null}
            </Card>

            {/* Paid By Info Card */}
            <Card
              variant="outlined"
              padding="md"
              style={{ marginBottom: spacing.md }}
            >
              <Text
                style={[
                  styles.sectionHeaderLabel,
                  { color: theme.textMuted, fontSize: typography.fontSize.xs },
                ]}
              >
                PAID BY
              </Text>
              <View style={styles.payerRow}>
                <Avatar name={expense.payer?.fullName || "User"} size="md" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: "700", fontSize: 15 }}>
                    {expense.payer?.fullName}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                    Paid the entire amount upfront
                  </Text>
                </View>
                <Text style={{ color: theme.primary, fontWeight: "800", fontSize: 15 }}>
                  {formatCurrency(expense.totalAmountMinor, expense.currency)}
                </Text>
              </View>
            </Card>

            {/* Split Breakdown Table */}
            <Card
              variant="outlined"
              padding="md"
              style={{ marginBottom: spacing.md }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text
                  style={[
                    styles.sectionHeaderLabel,
                    { color: theme.textMuted, fontSize: typography.fontSize.xs },
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
                      { borderBottomColor: theme.divider },
                    ]}
                  >
                    <Avatar name={p.user?.fullName || "User"} size="sm" />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text
                        style={{
                          color: theme.text,
                          fontWeight: isCurrentUser ? "800" : "600",
                          fontSize: 14,
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
                      }}
                    >
                      {formatCurrency(p.allocatedAmountMinor, expense.currency)}
                    </Text>
                  </View>
                );
              })}
            </Card>

            {/* Activity & Comments Section */}
            <Card
              variant="outlined"
              padding="md"
              style={{ marginBottom: spacing.lg }}
            >
              <Text
                style={[
                  styles.sectionHeaderLabel,
                  { color: theme.textMuted, fontSize: typography.fontSize.xs, marginBottom: 10 },
                ]}
              >
                NOTES & COMMENTS ({commentsList.length})
              </Text>

              {commentsList.map((c) => (
                <View
                  key={c.id}
                  style={[
                    styles.commentBubble,
                    { backgroundColor: theme.surface, borderColor: theme.border },
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
                  <Text style={{ color: theme.text, fontSize: 13 }}>
                    {c.text}
                  </Text>
                </View>
              ))}

              <View style={styles.addCommentRow}>
                <TextInput
                  placeholder="Add a comment or receipt note..."
                  placeholderTextColor={theme.textMuted}
                  value={commentText}
                  onChangeText={setCommentText}
                  style={[
                    styles.commentInput,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                />
                <Button
                  label="Send"
                  size="sm"
                  variant="primary"
                  onPress={handleAddComment}
                  style={{ marginLeft: 8 }}
                />
              </View>
            </Card>
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
  headerTitle: {
    fontWeight: "800",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  categoryCircle: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  expenseTitle: {
    fontWeight: "800",
    marginBottom: 6,
    textAlign: "center",
  },
  expenseAmountLarge: {
    fontWeight: "900",
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  notesBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
    width: "100%",
  },
  sectionHeaderLabel: {
    fontWeight: "700",
    letterSpacing: 0.6,
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
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  addCommentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  commentInput: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
});
