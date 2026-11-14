import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  Card,
  Button,
  SkeletonCard,
} from '@/components';
import { useWatermelonTheme } from '@/theme';
import { useAnalyticsSummary } from '../../src/hooks/useQueries';
import { formatCurrency } from '@matrixsplit/shared';
import { API_BASE_URL } from '../../src/services/api';

const categoryColors: Record<string, string> = {
  food_and_drink: '#F59E0B',
  groceries: '#10B981',
  transport: '#3B82F6',
  housing: '#8B5CF6',
  entertainment: '#EC4899',
  travel: '#06B6D4',
  utilities: '#F97316',
  shopping: '#EAB308',
  health: '#EF4444',
  general: '#64748B',
};

const categoryNames: Record<string, string> = {
  food_and_drink: 'Food & Drink',
  groceries: 'Groceries',
  transport: 'Transport',
  housing: 'Housing & Rent',
  entertainment: 'Entertainment',
  travel: 'Travel & Trips',
  utilities: 'Bills & Utilities',
  shopping: 'Shopping',
  health: 'Health & Medical',
  general: 'General',
};

export default function AnalyticsScreen() {
  const { theme, typography, spacing, borderRadius, isDark } = useWatermelonTheme();
  const { data: analytics, isLoading, refetch, isRefetching } = useAnalyticsSummary();
  const [period, setPeriod] = useState<'month' | 'quarter' | 'all'>('month');

  const handleExportCsv = async () => {
    try {
      Alert.alert(
        'Export Report',
        `CSV report is ready for download from:\n${API_BASE_URL}/analytics/export/csv`,
        [{ text: 'Got it' }]
      );
    } catch {
      Alert.alert('Export Failed', 'Could not generate report.');
    }
  };

  const totalSpent = analytics?.totalSpentMinor || 0;
  const currency = analytics?.currency || 'INR';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.headerBar}>
        <View>
          <Text
            style={[
              styles.headerTitle,
              { color: theme.text, fontSize: typography.fontSize['2xl'] },
            ]}
          >
            Insights & Analytics
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
            Spending trends and group allocation breakdown
          </Text>
        </View>

        <Pressable
          onPress={handleExportCsv}
          style={({ pressed }) => [
            styles.exportBtn,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons name="download-outline" size={14} color={theme.text} style={{ marginRight: 4 }} />
          <Text
            style={[
              styles.exportBtnText,
              { color: theme.text, fontSize: typography.fontSize.xs },
            ]}
          >
            Export
          </Text>
        </Pressable>
      </View>

      {/* Period Selector */}
      <View style={styles.periodRow}>
        {[
          { id: 'month', label: 'This Month' },
          { id: 'quarter', label: 'Last 3 Months' },
          { id: 'all', label: 'All Time' },
        ].map((item) => {
          const isSelected = period === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setPeriod(item.id as any)}
              style={({ pressed }) => [
                styles.periodTab,
                {
                  backgroundColor: isSelected ? theme.primary : theme.surface,
                  borderColor: isSelected ? theme.primary : theme.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.periodTabText,
                  {
                    color: isSelected ? '#FFFFFF' : theme.text,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
      >
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            {/* Total Spending Hero Card */}
            <View
              style={[
                styles.heroStatCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  borderRadius: borderRadius.xl,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text
                  style={[
                    styles.statLabel,
                    { color: theme.textMuted, fontSize: typography.fontSize.xs },
                  ]}
                >
                  TOTAL EXPENDITURE
                </Text>
                <View style={[styles.badgePill, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#D1FAE5' }]}>
                  <Ionicons name="trending-up" size={12} color={theme.primary} style={{ marginRight: 4 }} />
                  <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '700' }}>Active</Text>
                </View>
              </View>

              <Text
                style={[
                  styles.totalSpentAmount,
                  { color: theme.text, fontSize: typography.fontSize['3xl'] },
                ]}
              >
                {formatCurrency(totalSpent, currency)}
              </Text>

              <View style={[styles.statDivider, { backgroundColor: theme.divider }]} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                  Recorded shared expenses:
                </Text>
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>
                  {analytics?.totalExpensesCount || 0} transactions
                </Text>
              </View>
            </View>

            {/* Category Breakdown with Visual Bars */}
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.text, fontSize: typography.fontSize.lg },
                ]}
              >
                Spending by Category
              </Text>
            </View>

            {analytics?.categoryBreakdown && analytics.categoryBreakdown.length > 0 ? (
              <Card
                variant="outlined"
                padding="md"
                style={{ marginBottom: spacing.md }}
              >
                {analytics.categoryBreakdown.map((cat: any) => {
                  const color = categoryColors[cat.category] || theme.primary;
                  const percent = totalSpent > 0 ? Math.round((cat.amountMinor / totalSpent) * 100) : 0;
                  const catLabel = categoryNames[cat.category] || cat.category;

                  return (
                    <View key={cat.category} style={styles.categoryItem}>
                      <View style={styles.categoryHeaderRow}>
                        <View style={styles.categoryLabelRow}>
                          <View
                            style={[
                              styles.categoryDot,
                              { backgroundColor: color },
                            ]}
                          />
                          <Text
                            style={[
                              styles.categoryName,
                              { color: theme.text, fontSize: typography.fontSize.sm },
                            ]}
                          >
                            {catLabel}
                          </Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text
                            style={[
                              styles.categoryAmount,
                              { color: theme.text, fontSize: typography.fontSize.sm },
                            ]}
                          >
                            {formatCurrency(cat.amountMinor, currency)}
                          </Text>
                          <Text
                            style={[
                              styles.categoryPercent,
                              { color: theme.textMuted, fontSize: typography.fontSize.xs },
                            ]}
                          >
                            ({percent}%)
                          </Text>
                        </View>
                      </View>

                      {/* Visual Progress Bar */}
                      <View
                        style={[
                          styles.progressBarTrack,
                          { backgroundColor: theme.divider, borderRadius: borderRadius.full },
                        ]}
                      >
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              backgroundColor: color,
                              width: `${Math.min(100, Math.max(percent, 4))}%`,
                              borderRadius: borderRadius.full,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </Card>
            ) : (
              <Card padding="md" variant="outlined" style={{ alignItems: 'center', paddingVertical: 28 }}>
                <Ionicons name="pie-chart-outline" size={40} color={theme.textMuted} style={{ marginBottom: 10 }} />
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15, marginBottom: 4 }}>
                  No category data yet
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center' }}>
                  Add group expenses to see visual spending breakdowns.
                </Text>
              </Card>
            )}

            {/* Smart Financial Tips Card */}
            <View
              style={[
                styles.tipCard,
                {
                  backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#EFF6FF',
                  borderColor: isDark ? '#1E3A8A' : '#BFDBFE',
                  borderRadius: borderRadius.lg,
                },
              ]}
            >
              <Ionicons name="bulb-outline" size={20} color="#3B82F6" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13, marginBottom: 2 }}>
                  Min-Cash Flow Optimization
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, lineHeight: 17 }}>
                  MatrixSplit periodically recalculates transitive debts to ensure you settle with the fewest number of transactions.
                </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  exportBtnText: {
    fontWeight: '700',
  },
  periodRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 8,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodTabText: {
    fontSize: 12,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 4,
    paddingBottom: 40,
  },
  heroStatCard: {
    padding: 18,
    borderWidth: 1,
    marginBottom: 20,
  },
  statLabel: {
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  totalSpentAmount: {
    fontWeight: '800',
    marginVertical: 10,
  },
  statDivider: {
    height: 1,
    marginVertical: 12,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  categoryName: {
    fontWeight: '600',
  },
  categoryAmount: {
    fontWeight: '700',
  },
  categoryPercent: {
    marginLeft: 6,
  },
  progressBarTrack: {
    height: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderWidth: 1,
    marginTop: 4,
  },
});
