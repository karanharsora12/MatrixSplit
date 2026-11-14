import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useWatermelonTheme } from '@/theme/ThemeContext';
import { formatCurrency, CurrencyCode } from '@matrixsplit/shared';

export interface BalanceCardProps {
  totalBalanceMinor: number;
  totalYouOweMinor: number;
  totalOwedToYouMinor: number;
  currency?: CurrencyCode;
  activeGroupsCount?: number;
  style?: StyleProp<ViewStyle>;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  totalBalanceMinor,
  totalYouOweMinor,
  totalOwedToYouMinor,
  currency = 'INR',
  activeGroupsCount,
  style,
}) => {
  const { theme, isDark } = useWatermelonTheme();

  const isPositive = totalBalanceMinor > 0;
  const isNegative = totalBalanceMinor < 0;

  const statusColor = isPositive
    ? (isDark ? '#34D399' : '#059669')
    : isNegative
    ? '#F43F5E'
    : theme.textMuted;

  const statusLabel = isPositive
    ? 'Overall, you are owed'
    : isNegative
    ? 'Overall, you owe'
    : 'All accounts settled';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          borderColor: isDark ? '#1E293B' : '#E2E8F0',
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.25 : 0.04,
          shadowRadius: 6,
          elevation: 2,
        },
        style,
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.statusWrap}>
          <View
            style={[
              styles.indicatorDot,
              { backgroundColor: statusColor },
            ]}
          />
          <Text
            style={[
              styles.label,
              { color: theme.textMuted },
            ]}
          >
            {statusLabel}
          </Text>
        </View>

        {activeGroupsCount !== undefined && (
          <View
            style={[
              styles.groupBadge,
              {
                backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                borderColor: isDark ? '#334155' : '#E2E8F0',
              },
            ]}
          >
            <Text
              style={[
                styles.groupBadgeText,
                { color: theme.textMuted },
              ]}
            >
              {activeGroupsCount} {activeGroupsCount === 1 ? 'group' : 'groups'}
            </Text>
          </View>
        )}
      </View>

      <Text
        style={[
          styles.mainBalance,
          {
            color: statusColor,
          },
        ]}
      >
        {isNegative ? '-' : ''}
        {formatCurrency(Math.abs(totalBalanceMinor), currency)}
      </Text>

      <View
        style={[
          styles.divider,
          { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
        ]}
      />

      <View style={styles.subRow}>
        <View style={styles.subCol}>
          <Text style={[styles.subLabel, { color: theme.textMuted }]}>
            You owe
          </Text>
          <Text
            style={[
              styles.subValue,
              {
                color: totalYouOweMinor > 0 ? '#F43F5E' : theme.textMuted,
              },
            ]}
          >
            {formatCurrency(totalYouOweMinor, currency)}
          </Text>
        </View>

        <View
          style={[
            styles.verticalDivider,
            { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' },
          ]}
        />

        <View style={[styles.subCol, { alignItems: 'flex-end' }]}>
          <Text style={[styles.subLabel, { color: theme.textMuted }]}>
            You are owed
          </Text>
          <Text
            style={[
              styles.subValue,
              {
                color: totalOwedToYouMinor > 0 ? (isDark ? '#34D399' : '#059669') : theme.textMuted,
              },
            ]}
          >
            {formatCurrency(totalOwedToYouMinor, currency)}
          </Text>
        </View>
      </View>
    </View>
  );
};

export interface BalancePillProps {
  amountMinor: number;
  currency?: CurrencyCode;
  showPrefix?: boolean;
}

export const BalancePill: React.FC<BalancePillProps> = ({
  amountMinor,
  currency = 'INR',
  showPrefix = true,
}) => {
  const { isDark } = useWatermelonTheme();

  const isPositive = amountMinor > 0;
  const isNegative = amountMinor < 0;

  const bg = isPositive
    ? (isDark ? 'rgba(16,185,129,0.18)' : '#D1FAE5')
    : isNegative
    ? (isDark ? 'rgba(244,63,94,0.18)' : '#FFE4E6')
    : (isDark ? '#1E293B' : '#F1F5F9');

  const color = isPositive
    ? (isDark ? '#34D399' : '#059669')
    : isNegative
    ? '#F43F5E'
    : (isDark ? '#94A3B8' : '#64748B');

  const border = isPositive
    ? (isDark ? 'rgba(16,185,129,0.3)' : '#A7F3D0')
    : isNegative
    ? (isDark ? 'rgba(244,63,94,0.3)' : '#FECDD3')
    : (isDark ? '#334155' : '#E2E8F0');

  const prefix = isPositive ? '+ ' : isNegative ? '- ' : '';
  const text = `${showPrefix ? prefix : ''}${formatCurrency(Math.abs(amountMinor), currency)}`;

  return (
    <View
      style={[
        styles.pillContainer,
        {
          backgroundColor: bg,
          borderColor: border,
        },
      ]}
    >
      <Text
        style={[
          styles.pillText,
          {
            color,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 7,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  groupBadge: {
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 14,
  },
  groupBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  mainBalance: {
    fontSize: 34,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.8,
    marginTop: 8,
    marginBottom: 6,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subCol: {
    flex: 1,
  },
  verticalDivider: {
    width: 1,
    height: 28,
    marginHorizontal: 12,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  subValue: {
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  pillContainer: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
  },
});
