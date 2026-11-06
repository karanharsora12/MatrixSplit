import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  Card,
  Button,
  SkeletonCard,
  useWatermelonTheme,
} from '@matrixsplit/watermelon-ui';
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

export default function AnalyticsScreen() {
  const { theme, typography, spacing, borderRadius } = useWatermelonTheme();
  const { data: analytics, isLoading, refetch, isRefetching } = useAnalyticsSummary();

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.headerBar}>
        <Text
          style={[
            styles.headerTitle,
            { color: theme.text, fontSize: typography.fontSize['2xl'] },
          ]}
        >
          Analytics
        </Text>
        <TouchableOpacity
          onPress={handleExportCsv}
          style={[
            styles.exportBtn,
            { backgroundColor: theme.card, borderColor: theme.border, flexDirection: 'row', alignItems: 'center' },
          ]}
        >
          <Ionicons name="download-outline" size={15} color={theme.text} style={{ marginRight: 6 }} />
          <Text
            style={[
              styles.exportBtnText,
              { color: theme.text, fontSize: typography.fontSize.xs },
            ]}
          >
            Export CSV
          </Text>
        </TouchableOpacity>
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
            {/* Total Spending Stat Card */}
            <Card
              variant="elevated"
              padding="lg"
              style={{ marginBottom: spacing.md }}
            >
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.textMuted, fontSize: typography.fontSize.xs },
                ]}
              >
                YOUR TOTAL SPENDING
              </Text>
              <Text
                style={[
                  styles.totalSpentAmount,
                  { color: theme.text, fontSize: typography.fontSize['3xl'] },
                ]}
              >
                {formatCurrency(
                  analytics?.totalSpentMinor || 0,
                  analytics?.currency || 'INR'
                )}
              </Text>
              <Text
                style={[
                  styles.statSub,
                  { color: theme.textMuted, fontSize: typography.fontSize.xs },
                ]}
              >
                Across {analytics?.totalExpensesCount || 0} recorded shared
                expenses
              </Text>
            </Card>

            {/* Category Breakdown with Visual Bars */}
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.text, fontSize: typography.fontSize.lg },
                ]}
              >
                Category Breakdown
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
                  return (
                    <View key={cat.category} style={styles.categoryItem}>
                      <View style={styles.categoryHeaderRow}>
                        <View style={styles.categoryLabelRow}>
                          <View
                            style={[
                              styles.catDot,
                              { backgroundColor: color },
                            ]}
                          />
                          <Text
                            style={[
                              styles.categoryName,
                              { color: theme.text },
                            ]}
                          >
                            {cat.categoryLabel}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.categoryAmount,
                            { color: theme.text },
                          ]}
                        >
                          {formatCurrency(cat.totalAmountMinor, analytics.currency)} (
                          {cat.percentage}%)
                        </Text>
                      </View>

                      {/* Progress bar */}
                      <View
                        style={[
                          styles.progressBarBg,
                          { backgroundColor: theme.divider },
                        ]}
                      >
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              backgroundColor: color,
                              width: `${Math.min(cat.percentage, 100)}%`,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </Card>
            ) : (
              <Card padding="md" variant="outlined">
                <Text style={{ color: theme.textMuted, textAlign: 'center' }}>
                  No categorized expenses recorded yet.
                </Text>
              </Card>
            )}

            {/* Group Breakdown Section */}
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.text, fontSize: typography.fontSize.lg },
                ]}
              >
                Group Breakdown
              </Text>
            </View>

            {analytics?.groupBreakdown && analytics.groupBreakdown.length > 0 ? (
              <Card
                variant="outlined"
                padding="md"
                style={{ marginBottom: spacing.md }}
              >
                {analytics.groupBreakdown.map((grp: any) => (
                  <View key={grp.groupId} style={styles.groupBreakdownRow}>
                    <Text
                      style={[
                        styles.groupBreakdownName,
                        { color: theme.text },
                      ]}
                    >
                      {grp.groupName}
                    </Text>
                    <Text
                      style={[
                        styles.groupBreakdownAmount,
                        { color: theme.primary },
                      ]}
                    >
                      {formatCurrency(grp.totalAmountMinor, analytics.currency)}
                    </Text>
                  </View>
                ))}
              </Card>
            ) : (
              <Card padding="md" variant="outlined">
                <Text style={{ color: theme.textMuted, textAlign: 'center' }}>
                  No group expenses recorded yet.
                </Text>
              </Card>
            )}

            {/* Monthly Trends */}
            {analytics?.monthlyTrends && analytics.monthlyTrends.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: theme.text, fontSize: typography.fontSize.lg },
                    ]}
                  >
                    Monthly Spending Trends
                  </Text>
                </View>

                <Card variant="outlined" padding="md">
                  {analytics.monthlyTrends.map((trend: any) => (
                    <View key={trend.month} style={styles.trendRow}>
                      <Text
                        style={[styles.trendMonth, { color: theme.text }]}
                      >
                        {trend.label}
                      </Text>
                      <Text
                        style={[
                          styles.trendAmount,
                          { color: theme.text, fontWeight: '700' },
                        ]}
                      >
                        {formatCurrency(trend.amountMinor, analytics.currency)}
                      </Text>
                    </View>
                  ))}
                </Card>
              </>
            )}
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
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  exportBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 8,
  },
  exportBtnText: {
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  totalSpentAmount: {
    fontWeight: '800',
    letterSpacing: -0.5,
    marginVertical: 6,
  },
  statSub: {
    marginTop: 2,
  },
  sectionHeader: {
    marginTop: 14,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  categoryItem: {
    marginBottom: 14,
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
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  categoryName: {
    fontWeight: '600',
    fontSize: 13,
  },
  categoryAmount: {
    fontWeight: '600',
    fontSize: 13,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  groupBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  groupBreakdownName: {
    fontWeight: '600',
  },
  groupBreakdownAmount: {
    fontWeight: '700',
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  trendMonth: {
    fontWeight: '600',
  },
  trendAmount: {
    fontWeight: '700',
  },
});
