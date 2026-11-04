import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useWatermelonTheme } from '../theme/ThemeContext';
import { formatCurrency } from '@matrixsplit/shared';
import { CurrencyCode } from '@matrixsplit/shared';

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
  const { theme, borderRadius, typography, spacing, shadows } = useWatermelonTheme();

  const isPositive = totalBalanceMinor > 0;
  const isNegative = totalBalanceMinor < 0;

  const statusColor = isPositive
    ? theme.positive
    : isNegative
    ? theme.negative
    : theme.neutral;

  const statusLabel = isPositive
    ? 'Overall, you are owed'
    : isNegative
    ? 'Overall, you owe'
    : 'All settled up';

  return (
    <View
      style={[
        styles.container,
        shadows.card,
        {
          backgroundColor: theme.card,
          borderRadius: borderRadius.xl,
          padding: spacing.lg,
          borderColor: theme.border,
        },
        style,
      ]}
    >
      <View style={styles.headerRow}>
        <Text
          style={[
            styles.statusLabel,
            { color: theme.textMuted, fontSize: typography.fontSize.sm },
          ]}
        >
          {statusLabel}
        </Text>
        {activeGroupsCount !== undefined && (
          <View
            style={[
              styles.groupsBadge,
              {
                backgroundColor: theme.surface,
                borderRadius: borderRadius.full,
                borderColor: theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.groupsText,
                { color: theme.textMuted, fontSize: typography.fontSize.xs },
              ]}
            >
              {activeGroupsCount} active groups
            </Text>
          </View>
        )}
      </View>

      <Text
        style={[
          styles.mainAmount,
          {
            color: statusColor,
            fontSize: typography.fontSize['3xl'],
          },
        ]}
      >
        {formatCurrency(Math.abs(totalBalanceMinor), currency)}
      </Text>

      <View style={[styles.divider, { backgroundColor: theme.divider }]} />

      <View style={styles.subStatsRow}>
        <View style={styles.subStat}>
          <Text
            style={[
              styles.subStatLabel,
              { color: theme.textMuted, fontSize: typography.fontSize.xs },
            ]}
          >
            YOU OWE
          </Text>
          <Text
            style={[
              styles.subStatAmount,
              { color: theme.negative, fontSize: typography.fontSize.base },
            ]}
          >
            {formatCurrency(totalYouOweMinor, currency)}
          </Text>
        </View>

        <View style={[styles.verticalDivider, { backgroundColor: theme.divider }]} />

        <View style={styles.subStat}>
          <Text
            style={[
              styles.subStatLabel,
              { color: theme.textMuted, fontSize: typography.fontSize.xs },
            ]}
          >
            YOU ARE OWED
          </Text>
          <Text
            style={[
              styles.subStatAmount,
              { color: theme.positive, fontSize: typography.fontSize.base },
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
  const { theme, borderRadius, typography } = useWatermelonTheme();

  const isPositive = amountMinor > 0;
  const isNegative = amountMinor < 0;

  const bg = isPositive
    ? theme.positiveBg
    : isNegative
    ? theme.negativeBg
    : theme.neutralBg;
  const color = isPositive
    ? theme.positive
    : isNegative
    ? theme.negative
    : theme.neutral;
  const border = isPositive
    ? theme.positiveBorder
    : isNegative
    ? theme.negativeBorder
    : theme.neutralBorder;

  const prefix = showPrefix ? (isPositive ? '+' : isNegative ? '-' : '') : '';

  return (
    <View
      style={[
        styles.pillContainer,
        {
          backgroundColor: bg,
          borderColor: border,
          borderRadius: borderRadius.full,
        },
      ]}
    >
      <Text
        style={[
          styles.pillText,
          {
            color,
            fontSize: typography.fontSize.xs,
          },
        ]}
      >
        {prefix}
        {formatCurrency(Math.abs(amountMinor), currency)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusLabel: {
    fontWeight: '500',
  },
  groupsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  groupsText: {
    fontWeight: '600',
  },
  mainAmount: {
    fontWeight: '800',
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  subStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  subStat: {
    flex: 1,
    alignItems: 'center',
  },
  subStatLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subStatAmount: {
    fontWeight: '700',
  },
  verticalDivider: {
    width: 1,
    height: 32,
  },
  pillContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontWeight: '700',
  },
});
