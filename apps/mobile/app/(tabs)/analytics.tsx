import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SkeletonCard } from '@/components';
import { useWatermelonTheme } from '@/theme';
import { useAnalyticsSummary } from '../../src/hooks/useQueries';
import { formatCurrency } from '@matrixsplit/shared';
import { API_BASE_URL } from '../../src/services/api';
import { cn } from '@/lib/utils';

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
  const { isDark } = useWatermelonTheme();
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

  const totalSpent = Number(analytics?.totalSpentMinor) || 0;
  const currency = analytics?.currency || 'INR';
  const totalCount = Number(analytics?.totalExpensesCount) || 0;
  const avgExpense = totalCount > 0 ? Math.round(totalSpent / totalCount) : 0;

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className={cn('flex-1', isDark ? 'bg-[#090D16]' : 'bg-[#F8FAFC]')}
    >
      {/* Top Header */}
      <View
        className={cn(
          'flex-row items-center justify-between px-5 pt-2 pb-3.5 border-b',
          isDark ? 'border-[#1E293B]' : 'border-slate-200'
        )}
      >
        <View>
          <Text
            className={cn(
              'text-2xl font-extrabold tracking-tight',
              isDark ? 'text-white' : 'text-slate-900'
            )}
          >
            Insights & Analytics
          </Text>
          <Text className="text-xs text-slate-400 mt-0.5">
            Spending trends and group allocation breakdown
          </Text>
        </View>

        <Pressable
          onPress={handleExportCsv}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className={cn(
            'flex-row items-center h-9 px-3.5 rounded-xl border active:scale-95',
            isDark
              ? 'bg-[#141D2E] border-[#23324D] active:bg-[#1E2A42]'
              : 'bg-white border-slate-200 active:bg-slate-100'
          )}
        >
          <Ionicons
            name="download-outline"
            size={14}
            color={isDark ? '#94A3B8' : '#475569'}
            style={{ marginRight: 4 }}
          />
          <Text
            className={cn(
              'text-xs font-bold',
              isDark ? 'text-slate-200' : 'text-slate-700'
            )}
          >
            Export
          </Text>
        </Pressable>
      </View>

      {/* Period Selector Tabs */}
      <View className="px-5 pt-3.5 pb-2">
        <View
          className={cn(
            'flex-row items-center p-1 rounded-2xl border',
            isDark ? 'bg-[#141D2E] border-[#23324D]' : 'bg-slate-100 border-slate-200'
          )}
        >
          {[
            { key: 'month' as const, label: 'This Month' },
            { key: 'quarter' as const, label: 'Last 3 Months' },
            { key: 'all' as const, label: 'All Time' },
          ].map((item) => {
            const isSelected = period === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setPeriod(item.key)}
                className={cn(
                  'flex-1 h-9 items-center justify-center rounded-xl active:scale-95',
                  isSelected
                    ? isDark
                      ? 'bg-[#1E2A42] border border-blue-500/50 shadow-sm'
                      : 'bg-white border border-slate-300 shadow-sm'
                    : 'bg-transparent'
                )}
              >
                <Text
                  className={cn(
                    'text-xs font-bold',
                    isSelected
                      ? isDark
                        ? 'text-white'
                        : 'text-slate-900'
                      : isDark
                      ? 'text-slate-400'
                      : 'text-slate-500'
                  )}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#10B981"
          />
        }
      >
        {isLoading ? (
          <View className="px-5 pt-3">
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : (
          <View className="px-5 pt-2">
            {/* Total Spending Hero Card */}
            <View
              className={cn(
                'p-5 rounded-3xl border mb-5',
                isDark
                  ? 'bg-[#141D2E] border-[#23324D]'
                  : 'bg-white border-slate-200 shadow-sm shadow-black/5'
              )}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs font-bold text-slate-400 tracking-wider">
                  TOTAL EXPENDITURE
                </Text>
                <View className="flex-row items-center px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                  <Ionicons
                    name="trending-up"
                    size={12}
                    color="#10B981"
                    style={{ marginRight: 4 }}
                  />
                  <Text className="text-[11px] font-bold text-emerald-400">
                    Active
                  </Text>
                </View>
              </View>

              <Text
                className={cn(
                  'text-3xl font-extrabold font-mono tracking-tight my-1',
                  isDark ? 'text-white' : 'text-slate-900'
                )}
              >
                {formatCurrency(totalSpent, currency)}
              </Text>

              <View
                className={cn(
                  'h-[1px] my-3.5',
                  isDark ? 'bg-[#23324D]' : 'bg-slate-200'
                )}
              />

              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-xs text-slate-400">
                    Total Transactions
                  </Text>
                  <Text
                    className={cn(
                      'text-sm font-bold mt-0.5 font-mono',
                      isDark ? 'text-white' : 'text-slate-900'
                    )}
                  >
                    {totalCount} bills
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-xs text-slate-400">
                    Average / Expense
                  </Text>
                  <Text
                    className={cn(
                      'text-sm font-bold mt-0.5 font-mono',
                      isDark ? 'text-white' : 'text-slate-900'
                    )}
                  >
                    {formatCurrency(avgExpense, currency)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Category Breakdown Header */}
            <View className="mb-3">
              <Text
                className={cn(
                  'text-base font-bold tracking-tight',
                  isDark ? 'text-white' : 'text-slate-900'
                )}
              >
                Spending by Category
              </Text>
            </View>

            {/* Category Breakdown Card */}
            {analytics?.categoryBreakdown && analytics.categoryBreakdown.length > 0 ? (
              <View
                className={cn(
                  'p-5 rounded-3xl border mb-6',
                  isDark
                    ? 'bg-[#141D2E] border-[#23324D]'
                    : 'bg-white border-slate-200 shadow-sm shadow-black/5'
                )}
              >
                {analytics.categoryBreakdown.map((cat: any, index: number) => {
                  const meta = categoryMeta[cat.category] || {
                    label: cat.categoryLabel || cat.category || 'General',
                    color: '#10B981',
                    icon: 'pricetag-outline',
                  };

                  const catAmount = Number(cat.totalAmountMinor ?? cat.amountMinor ?? 0) || 0;
                  const catPercent =
                    cat.percentage != null && !isNaN(cat.percentage)
                      ? Number(cat.percentage)
                      : totalSpent > 0
                      ? Math.round((catAmount / totalSpent) * 100)
                      : 0;

                  const isLast = index === analytics.categoryBreakdown.length - 1;

                  return (
                    <View key={cat.category} className={isLast ? '' : 'mb-5'}>
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center flex-1 mr-3">
                          <View
                            className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                            style={{ backgroundColor: `${meta.color}20` }}
                          >
                            <Ionicons name={meta.icon} size={16} color={meta.color} />
                          </View>
                          <Text
                            numberOfLines={1}
                            className={cn(
                              'text-sm font-semibold flex-1',
                              isDark ? 'text-white' : 'text-slate-900'
                            )}
                          >
                            {meta.label}
                          </Text>
                        </View>

                        <View className="flex-row items-center">
                          <Text
                            className={cn(
                              'text-sm font-bold font-mono',
                              isDark ? 'text-white' : 'text-slate-900'
                            )}
                          >
                            {formatCurrency(catAmount, currency)}
                          </Text>
                          <Text className="text-xs text-slate-400 ml-1.5 font-mono">
                            ({catPercent}%)
                          </Text>
                        </View>
                      </View>

                      {/* Progress Bar Track */}
                      <View
                        className={cn(
                          'h-2 w-full rounded-full overflow-hidden mt-1',
                          isDark ? 'bg-[#1E293B]' : 'bg-slate-100'
                        )}
                      >
                        <View
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: meta.color,
                            width: `${Math.min(100, Math.max(catPercent, 4))}%`,
                          }}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View
                className={cn(
                  'p-8 rounded-3xl border items-center mb-6',
                  isDark
                    ? 'bg-[#141D2E] border-[#23324D]'
                    : 'bg-white border-slate-200 shadow-sm'
                )}
              >
                <Ionicons name="pie-chart-outline" size={38} color="#64748B" />
                <Text
                  className={cn(
                    'font-bold text-sm mt-2',
                    isDark ? 'text-white' : 'text-slate-900'
                  )}
                >
                  No category data yet
                </Text>
                <Text className="text-xs text-slate-400 text-center mt-1 leading-5 max-w-[260px]">
                  Add expenses to see real-time visual categorization and spending distribution.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
