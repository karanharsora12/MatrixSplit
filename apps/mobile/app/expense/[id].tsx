import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { formatCurrency } from '@matrixsplit/shared';

export default function ExpenseDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, typography, spacing, borderRadius } = useWatermelonTheme();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const { data: expense, isLoading } = useExpenseDetails(id!);
  const deleteMutation = useDeleteExpense();

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.headerBar,
          { backgroundColor: theme.surface, borderBottomColor: theme.divider },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: theme.text }]}>‹</Text>
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: theme.text, fontSize: typography.fontSize.lg },
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
                <Badge label={expense.category} size="md" variant="info" />
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
                    {expense.payerId === currentUserId ? '(You)' : ''}
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
                      {p.userId === currentUserId ? '(You)' : ''}
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
            {expense.notes && (
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
            )}

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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 28,
    fontWeight: '300',
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
    marginBottom: 10,
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
  actionsContainer: {
    marginTop: 14,
  },
});
