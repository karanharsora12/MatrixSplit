import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useWatermelonTheme } from '../theme/ThemeContext';

export interface BadgeProps {
  label: string;
  variant?: 'positive' | 'negative' | 'neutral' | 'warning' | 'info' | 'primary';
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  style,
}) => {
  const { theme, borderRadius, typography, spacing } = useWatermelonTheme();

  let bgColor = theme.neutralBg;
  let textColor = theme.neutral;
  let borderColor = theme.neutralBorder;

  if (variant === 'positive') {
    bgColor = theme.positiveBg;
    textColor = theme.positive;
    borderColor = theme.positiveBorder;
  } else if (variant === 'negative') {
    bgColor = theme.negativeBg;
    textColor = theme.negative;
    borderColor = theme.negativeBorder;
  } else if (variant === 'warning') {
    bgColor = theme.warningBg;
    textColor = theme.warning;
    borderColor = theme.warning;
  } else if (variant === 'info') {
    bgColor = theme.infoBg;
    textColor = theme.info;
    borderColor = theme.info;
  } else if (variant === 'primary') {
    bgColor = theme.primaryLight;
    textColor = theme.primary;
    borderColor = theme.primary;
  }

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bgColor,
          borderColor,
          borderRadius: borderRadius.full,
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? spacing.sm : spacing.md,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: textColor,
            fontSize: isSmall ? typography.fontSize.xs : typography.fontSize.sm,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
});
