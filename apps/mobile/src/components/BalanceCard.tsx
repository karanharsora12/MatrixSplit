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
      className="border border-border bg-card rounded-2xl"
    >
      <View style={styles.topRow} className="flex-row items-center justify-between">
        <Text
          style={[
            styles.label,
            { color: theme.textMuted, fontSize: typography.fontSize.sm },
          ]}
          className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
        >
          {statusLabel}
        </Text>
        {activeGroupsCount !== undefined && (
          <View
            style={[
              styles.groupBadge,
              {
                backgroundColor: theme.surface,
                borderRadius: borderRadius.full,
                borderColor: theme.border,
              },
            ]}
            className="border border-border bg-muted/30 px-2.5 py-0.5 rounded-full"
          >
            <Text
              style={[
                styles.groupBadgeText,
                { color: theme.textMuted, fontSize: typography.fontSize.xs },
              ]}
              className="text-xs text-muted-foreground font-medium"
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
            fontSize: typography.fontSize['3xl'],
            fontWeight: typography.fontWeight.extrabold,
            marginVertical: spacing.sm,
          },
        ]}
        className="text-3xl font-extrabold my-2"
      >
        {formatCurrency(Math.abs(totalBalanceMinor), currency)}
      </Text>

      <View
        style={[styles.divider, { backgroundColor: theme.divider }]}
        className="h-px bg-border my-2.5"
      />

      <View style={styles.subRow} className="flex-row items-center justify-between pt-1">
        <View style={styles.subCol} className="flex-1">
          <Text
            style={[
              styles.subLabel,
              { color: theme.textMuted, fontSize: typography.fontSize.xs },
            ]}
            className="text-xs text-muted-foreground"
          >
            You owe
          </Text>
          <Text
            style={[
              styles.subValue,
              {
                color: totalYouOweMinor > 0 ? theme.negative : theme.textMuted,
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.bold,
              },
            ]}
            className="text-base font-bold text-destructive"
          >
            {formatCurrency(totalYouOweMinor, currency)}
          </Text>
        </View>

        <View
          style={[styles.verticalDivider, { backgroundColor: theme.divider }]}
          className="w-px h-7 bg-border mx-3"
        />

        <View style={styles.subCol} className="flex-1 items-end">
          <Text
            style={[
              styles.subLabel,
              { color: theme.textMuted, fontSize: typography.fontSize.xs },
            ]}
            className="text-xs text-muted-foreground"
          >
            You are owed
          </Text>
          <Text
            style={[
              styles.subValue,
              {
                color: totalOwedToYouMinor > 0 ? theme.positive : theme.textMuted,
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.bold,
              },
            ]}
            className="text-base font-bold text-primary"
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
      className="rounded-full px-2.5 py-1 border flex-row items-center justify-center self-start"
    >
      <Text
        style={[
          styles.pillText,
          {
            color,
            fontSize: typography.fontSize.xs,
          },
        ]}
        className="text-xs font-semibold"
      >
        {prefix}
        {formatCurrency(Math.abs(amountMinor), currency)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pillContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontWeight: '600',
  },
  container: {
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
  },
  groupBadgeText: {
    fontWeight: '500',
  },
  mainBalance: {},
  divider: {
    height: 1,
    marginVertical: 10,
  },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subCol: {},
  subLabel: {
    fontWeight: '500',
    marginBottom: 2,
  },
  subValue: {},
  verticalDivider: {
    width: 1,
    height: 28,
  },
});
