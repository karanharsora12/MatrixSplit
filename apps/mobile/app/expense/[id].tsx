import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Card,
  Avatar,
  Badge,
  Button,
  SkeletonCard,
  useWatermelonTheme,
} from '@matrixsplit/watermelon-ui';
import {
  useExpenseDetails,
  useDeleteExpense,
} from '../../src/hooks/useQueries';
import { useAuthStore } from '../../src/stores/authStore';
import { formatCurrency, ExpenseCategory } from '@matrixsplit/shared';

const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  food_and_drink: 'restaurant-outline',
  groceries: 'cart-outline',
  transport: 'car-outline',
  housing: 'home-outline',
  entertainment: 'film-outline',
  travel: 'airplane-outline',
  utilities: 'flash-outline',
  shopping: 'bag-handle-outline',
  health: 'medkit-outline',
  general: 'receipt-outline',
};

export default function ExpenseDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, typography, spacing, borderRadius } = useWatermelonTheme();
  const currentUser = useAuthStore((s) => s.user);

  const { data: expense, isLoading } = useExpenseDetails(id!);
  const deleteMutation = useDeleteExpense();

  // Comments state
  const [commentText, setCommentText] = useState('');
  const [commentsList, setCommentsList] = useState<
    { id: string; author: string; text: string; time: string }[]
  >([
    {
      id: 'c1',
      author: 'Alice Johnson',
      text: 'Thanks for paying up front! Will settle this evening.',
      time: '2 hours ago',
    },
  ]);

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const newComment = {
      id: Date.now().toString(),
      author: currentUser?.fullName || 'You',
      text: commentText.trim(),
      time: 'Just now',
    };
    setCommentsList((prev) => [...prev, newComment]);
    setCommentText('');
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense? This will recalculate all group and member balances.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(id!);
              Alert.alert('Deleted', 'Expense deleted successfully', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  const handleDuplicate = () => {
    if (!expense) return;
    router.push({
      pathname: '/expense/add',
      params: {
        preselectedGroupId: expense.groupId,
      },
    });
  };

  const iconName = expense ? categoryIcons[expense.category] || 'receipt-outline' : 'receipt-outline';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: theme.text, fontSize: typography.fontSize.base },
          ]}
        >
          Expense Details
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isLoading || !expense ? (
          <SkeletonCard />
        ) : (
          <>
            {/* Header Amount Card */}
            <Card
              variant="elevated"
              padding="lg"
              style={{ marginBottom: spacing.md }}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.categoryBadgeRow}>
                  <View
                    style={[
                      styles.catIconCircle,
                      { backgroundColor: theme.primaryLight },
                    ]}
                  >
                    <Ionicons name={iconName} size={18} color={theme.primary} />
                  </View>
                  <Badge label={expense.category} size="md" variant="info" />
                </View>
                <Badge
                  label={`Split: ${expense.splitType.toUpperCase()}`}
                  size="sm"
                  variant="primary"
                />
              </View>

              <Text
                style={[
                  styles.expenseTitle,
                  { color: theme.text, fontSize: typography.fontSize['2xl'] },
                ]}
              >
                {expense.title}
              </Text>

              <Text
                style={[
                  styles.expenseAmount,
                  { color: theme.text, fontSize: typography.fontSize['4xl'] },
                ]}
              >
                {formatCurrency(expense.totalAmountMinor, expense.currency)}
              </Text>

              <Text
                style={[
                  styles.expenseDate,
                  { color: theme.textMuted, fontSize: typography.fontSize.xs },
                ]}
              >
                Added on {new Date(expense.date).toLocaleDateString()}
              </Text>
            </Card>

            {/* Payer Card */}
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.text, fontSize: typography.fontSize.sm },
                ]}
              >
                PAID BY
              </Text>
            </View>

            <Card
              variant="outlined"
              padding="sm"
              style={{ marginBottom: spacing.md }}
            >
              <View style={styles.payerRow}>
                <Avatar name={expense.payer?.fullName || 'User'} size="md" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text
                    style={[
                      styles.payerName,
                      { color: theme.text, fontSize: typography.fontSize.base },
                    ]}
                  >
                    {expense.payer?.fullName}{' '}
                    {expense.payerId === currentUser?.id ? '(You)' : ''}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                    Paid the full amount of{' '}
                    {formatCurrency(expense.totalAmountMinor, expense.currency)}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Participant Breakdown */}
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.text, fontSize: typography.fontSize.sm },
                ]}
              >
                PARTICIPANTS & SHARES ({expense.participants?.length || 0})
              </Text>
            </View>

            <Card
              variant="outlined"
              padding="sm"
              style={{ marginBottom: spacing.md }}
            >
              {expense.participants?.map((p: any) => (
                <View key={p.id} style={styles.participantShareRow}>
                  <Avatar name={p.user?.fullName || 'User'} size="sm" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text
                      style={[
                        styles.participantName,
                        { color: theme.text, fontSize: typography.fontSize.sm },
                      ]}
                    >
                      {p.user?.fullName}{' '}
                      {p.userId === currentUser?.id ? '(You)' : ''}
                    </Text>
                    {p.splitValue ? (
                      <Text style={{ color: theme.textMuted, fontSize: 11 }}>
                        {expense.splitType === 'percentage'
                          ? `${p.splitValue}% share`
                          : `${p.splitValue} shares`}
                      </Text>
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.participantShareAmount,
                      {
                        color:
                          p.userId === expense.payerId
                            ? theme.positive
                            : theme.text,
                        fontSize: typography.fontSize.base,
                      },
                    ]}
                  >
                    {formatCurrency(p.allocatedAmountMinor, expense.currency)}
                  </Text>
                </View>
              ))}
            </Card>

            {/* Notes Section */}
            {expense.notes ? (
              <Card
                variant="outlined"
                padding="md"
                style={{ marginBottom: spacing.md }}
              >
                <Text
                  style={{
                    color: theme.textMuted,
                    fontSize: 11,
                    fontWeight: '700',
                    marginBottom: 4,
                  }}
                >
                  NOTES
                </Text>
                <Text style={{ color: theme.text, lineHeight: 20 }}>
                  {expense.notes}
                </Text>
              </Card>
            ) : null}

            {/* Receipt Preview */}
            <Card
              variant="outlined"
              padding="md"
              style={{ marginBottom: spacing.md }}
            >
              <Text
                style={{
                  color: theme.textMuted,
                  fontSize: 11,
                  fontWeight: '700',
                  marginBottom: 8,
                }}
              >
                RECEIPT ATTACHMENT
              </Text>
              <View
                style={[
                  styles.receiptBox,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Ionicons name="receipt-outline" size={32} color={theme.primary} />
                <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>
                  Itemized bill scanned & verified
                </Text>
              </View>
            </Card>

            {/* Comments Feed Section */}
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.text, fontSize: typography.fontSize.sm },
                ]}
              >
                COMMENTS ({commentsList.length})
              </Text>
            </View>

            <Card
              variant="outlined"
              padding="md"
              style={{ marginBottom: spacing.md }}
            >
              {commentsList.map((c) => (
                <View
                  key={c.id}
                  style={[
                    styles.commentItem,
                    { borderBottomColor: theme.divider },
                  ]}
                >
                  <Avatar name={c.author} size="sm" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={styles.commentHeader}>
                      <Text style={[styles.commentAuthor, { color: theme.text }]}>
                        {c.author}
                      </Text>
                      <Text style={{ color: theme.textMuted, fontSize: 11 }}>
                        {c.time}
                      </Text>
                    </View>
                    <Text style={[styles.commentText, { color: theme.text }]}>
                      {c.text}
                    </Text>
                  </View>
                </View>
              ))}

              {/* Add Comment Input */}
              <View style={styles.addCommentRow}>
                <TextInput
                  placeholder="Write a comment..."
                  placeholderTextColor={theme.textMuted}
                  value={commentText}
                  onChangeText={setCommentText}
                  style={[
                    styles.commentInput,
                    {
                      backgroundColor: theme.background,
                      color: theme.text,
                      borderColor: theme.border,
                      borderRadius: borderRadius.md,
                    },
                  ]}
                />
                <TouchableOpacity
                  onPress={handleAddComment}
                  style={[
                    styles.sendCommentBtn,
                    { backgroundColor: theme.primary, borderRadius: borderRadius.md },
                  ]}
                >
                  <Ionicons name="send" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </Card>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <Button
                label="Duplicate Expense"
                variant="outline"
                size="md"
                onPress={handleDuplicate}
                style={{ marginBottom: spacing.sm }}
              />

              <Button
                label="Delete Expense"
                variant="danger"
                size="md"
                onPress={handleDelete}
                loading={deleteMutation.isPending}
              />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  expenseTitle: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  expenseAmount: {
    fontWeight: '800',
    letterSpacing: -0.5,
    marginVertical: 6,
  },
  expenseDate: {
    fontWeight: '500',
  },
  sectionHeader: {
    marginBottom: 6,
    marginLeft: 2,
  },
  sectionTitle: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  payerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  payerName: {
    fontWeight: '700',
  },
  participantShareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  participantName: {
    fontWeight: '600',
  },
  participantShareAmount: {
    fontWeight: '700',
  },
  receiptBox: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentAuthor: {
    fontWeight: '700',
    fontSize: 13,
  },
  commentText: {
    fontSize: 13,
    lineHeight: 18,
  },
  addCommentRow: {
    flexDirection: 'row',
    marginTop: 12,
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  sendCommentBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  actionsContainer: {
    marginTop: 14,
  },
});
