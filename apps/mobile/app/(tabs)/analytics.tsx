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
  SkeletonCard,
  SegmentedControl,
} from '@/components';
import { useWatermelonTheme } from '@/theme';
import { useAnalyticsSummary } from '../../src/hooks/useQueries';
import { formatCurrency } from '@matrixsplit/shared';
import { API_BASE_URL } from '../../src/services/api';

const categoryMeta: Record<
  string,
  { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  food_and_drink: { label: 'Food & Drink', color: '#F59E0B', icon: 'restaurant-outline' },
  groceries: { label: 'Groceries', color: '#10B981', icon: 'cart-outline' },
  transport: { label: 'Transport', color: '#3B82F6', icon: 'car-outline' },
  housing: { label: 'Housing & Rent', color: '#8B5CF6', icon: 'home-outline' },
  entertainment: { label: 'Entertainment', color: '#EC4899', icon: 'film-outline' },
  travel: { label: 'Travel & Trips', color: '#06B6D4', icon: 'airplane-outline' },
  utilities: { label: 'Bills & Utilities', color: '#F97316', icon: 'flash-outline' },
  shopping: { label: 'Shopping', color: '#EAB308', icon: 'bag-handle-outline' },
  health: { label: 'Health & Medical', color: '#EF4444', icon: 'medkit-outline' },
  general: { label: 'General', color: '#64748B', icon: 'pricetag-outline' },
};

export default function AnalyticsScreen() {
  const { theme, typography, spacing, borderRadius, isDark } = useWatermelonTheme();
  const { data: analytics, isLoading, refetch, isRefetching } = useAnalyticsSummary();
  const [period, setPeriod] = useState<'month' | 'quarter' | 'all'>('month');

  const handleExportCsv = async () => {
    try {
      Alert.alert(
        'Export Ledger Report',
        `CSV export generated.\nEndpoint: ${API_BASE_URL}/analytics/export/csv`,
        [{ text: 'Dismiss' }]
      );
    } catch {
      Alert.alert('Export Failed', 'Could not generate report.');
    }
  };

  const totalSpent = analytics?.totalSpentMinor || 0;
  const currency = analytics?.currency || 'INR';
  const totalCount = analytics?.totalExpensesCount || 0;
  const avgExpense = totalCount > 0 ? Math.round(totalSpent / totalCount) : 0;

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
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
      <View style={styles.periodSection}>
        <SegmentedControl
          value={period}
          onChange={(val) => setPeriod(val as any)}
          options={[
            { value: 'month', label: 'This Month' },
            { value: 'quarter', label: 'Last 3 Months' },
            { value: 'all', label: 'All Time' },
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
            <Card
              variant="elevated"
              padding="lg"
              style={{ marginBottom: 20 }}
            >
              <View style={styles.heroTopRow}>
                <Text
                  style={[
                    styles.statLabel,
                    { color: theme.textMuted, fontSize: typography.fontSize.xs },
                  ]}
                >
                  TOTAL EXPENDITURE
                </Text>
                <View
                  style={[
                    styles.badgePill,
                    { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#D1FAE5' },
                  ]}
                >
                  <Ionicons name="trending-up" size={12} color={theme.primary} style={{ marginRight: 4 }} />
                  <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '700' }}>Active</Text>
                </View>
              </View>

              <Text
                style={[
                  styles.totalSpentAmount,
                  { color: theme.text, fontSize: 34, fontVariant: ['tabular-nums'] },
                ]}
              >
                {formatCurrency(totalSpent, currency)}
              </Text>

              <View style={[styles.statDivider, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]} />

              <View style={styles.statSubRow}>
                <View>
                  <Text style={{ color: theme.textMuted, fontSize: 11 }}>Total Transactions</Text>
                  <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13, marginTop: 2, fontVariant: ['tabular-nums'] }}>
                    {totalCount} bills
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: theme.textMuted, fontSize: 11 }}>Average / Expense</Text>
                  <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13, marginTop: 2, fontVariant: ['tabular-nums'] }}>
                    {formatCurrency(avgExpense, currency)}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Category Breakdown Header */}
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.text, fontSize: typography.fontSize.base },
                ]}
              >
                Spending by Category
              </Text>
            </View>

            {analytics?.categoryBreakdown && analytics.categoryBreakdown.length > 0 ? (
              <Card
                variant="outlined"
                padding="md"
                style={{ marginBottom: 20 }}
              >
                {analytics.categoryBreakdown.map((cat: any) => {
                  const meta = categoryMeta[cat.category] || {
                    label: cat.category,
                    color: theme.primary,
                    icon: 'pricetag-outline',
                  };
                  const percent = totalSpent > 0 ? Math.round((cat.amountMinor / totalSpent) * 100) : 0;

                  return (
                    <View key={cat.category} style={styles.categoryItem}>
                      <View style={styles.categoryHeaderRow}>
                        <View style={styles.categoryLabelRow}>
                          <View
                            style={[
                              styles.categoryIconCircle,
                              { backgroundColor: `${meta.color}20` },
                            ]}
                          >
                            <Ionicons name={meta.icon} size={14} color={meta.color} />
                          </View>
                          <Text
                            style={[
                              styles.categoryName,
                              { color: theme.text, fontSize: typography.fontSize.sm },
                            ]}
                          >
                            {meta.label}
                          </Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text
                            style={[
                              styles.categoryAmount,
                              { color: theme.text, fontSize: typography.fontSize.sm, fontVariant: ['tabular-nums'] },
                            ]}
                          >
                            {formatCurrency(cat.amountMinor, currency)}
                          </Text>
                          <Text
                            style={[
                              styles.categoryPercent,
                              { color: theme.textMuted, fontSize: typography.fontSize.xs, fontVariant: ['tabular-nums'] },
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
                          {
                            backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                            borderRadius: borderRadius.full,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              backgroundColor: meta.color,
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
              <Card padding="lg" variant="outlined" style={{ alignItems: 'center', paddingVertical: 32, marginBottom: 20 }}>
                <Ionicons name="pie-chart-outline" size={38} color={theme.textMuted} style={{ marginBottom: 8 }} />
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15, marginBottom: 4 }}>
                  No category data yet
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center', maxWidth: 260 }}>
                  Add expenses to see real-time visual categorization and spending distribution.
                </Text>
              </Card>
            )}

            {/* Smart Financial Optimization Card */}
            <View
              style={[
                styles.tipCard,
                {
                  backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#EFF6FF',
                  borderColor: isDark ? 'rgba(59,130,246,0.3)' : '#BFDBFE',
                  borderRadius: borderRadius.lg,
                },
              ]}
            >
              <Ionicons name="sparkles" size={18} color="#3B82F6" style={{ marginRight: 10, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13, marginBottom: 2 }}>
                  Min-Cash Flow Graph Optimization
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, lineHeight: 18 }}>
                  MatrixSplit simplifies multi-party debts behind the scenes, eliminating circular repayments so groups settle up in the minimum number of steps.
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
  periodSection: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    letterSpacing: -0.5,
  },
  statDivider: {
    height: 1,
    marginVertical: 12,
  },
  statSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: '700',
    letterSpacing: -0.2,
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
  categoryIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
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
    height: 6,
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
  },
});
