import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleProp,
  ViewStyle,
  StyleSheet,
} from 'react-native';
import { useWatermelonTheme } from '@/theme';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
  badge?: string | number;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  style,
}: SegmentedControlProps<T>) {
  const { theme, borderRadius, typography, isDark } = useWatermelonTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#111827' : '#F1F5F9',
          borderColor: theme.border,
          borderRadius: borderRadius.lg,
        },
        style,
      ]}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [
              styles.segment,
              {
                borderRadius: borderRadius.md,
                backgroundColor: isSelected
                  ? theme.card
                  : pressed
                  ? isDark
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(0,0,0,0.03)'
                  : 'transparent',
                borderWidth: isSelected ? 1 : 0,
                borderColor: isSelected ? theme.border : 'transparent',
              },
            ]}
          >
            <Text
              style={{
                color: isSelected ? theme.primary : theme.textMuted,
                fontSize: typography.fontSize.xs,
                fontWeight: isSelected ? '700' : '600',
              }}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
            {opt.badge !== undefined && (
              <View
                style={{
                  backgroundColor: isSelected
                    ? (isDark ? 'rgba(16,185,129,0.2)' : '#D1FAE5')
                    : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                  borderRadius: borderRadius.full,
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  marginLeft: 6,
                }}
              >
                <Text
                  style={{
                    color: isSelected ? theme.primary : theme.textMuted,
                    fontSize: 10,
                    fontWeight: '700',
                  }}
                >
                  {opt.badge}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    borderWidth: 1,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
});
