import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useWatermelonTheme } from '@/theme';
import { cn } from '@/lib/utils';

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
  className,
}: SegmentedControlProps<T>) {
  const { theme, borderRadius, typography, shadows } = useWatermelonTheme();

  return (
    <View
      className={cn(
        'flex-row items-center rounded-xl border border-border bg-muted/40 p-1',
        className
      )}
      style={[
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderRadius: borderRadius.lg,
          padding: 4,
        },
        style,
      ]}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            activeOpacity={0.8}
            onPress={() => onChange(opt.value)}
            className={cn(
              'flex-1 flex-row items-center justify-center py-2 px-3 rounded-lg',
              isSelected ? 'bg-card shadow-sm' : 'bg-transparent'
            )}
            style={[
              {
                borderRadius: borderRadius.md,
                backgroundColor: isSelected ? theme.card : 'transparent',
                ...(isSelected ? shadows.subtle : {}),
              },
            ]}
          >
            <Text
              className={cn(
                'text-center text-sm font-medium',
                isSelected ? 'font-semibold text-primary' : 'text-muted-foreground'
              )}
              style={[
                {
                  color: isSelected ? theme.primary : theme.textMuted,
                  fontSize: typography.fontSize.sm,
                  fontWeight: isSelected ? '700' : '500',
                },
              ]}
            >
              {opt.label}
            </Text>
            {opt.badge !== undefined && (
              <View
                className="ml-1.5 rounded-full px-1.5 py-0.5"
                style={[
                  {
                    backgroundColor: isSelected
                      ? theme.primaryLight
                      : theme.neutralBg,
                  },
                ]}
              >
                <Text
                  style={{
                    color: isSelected ? theme.primary : theme.textMuted,
                    fontSize: typography.fontSize.xs,
                    fontWeight: '700',
                  }}
                >
                  {opt.badge}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
