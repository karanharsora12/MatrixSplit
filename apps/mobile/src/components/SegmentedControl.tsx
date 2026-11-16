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
  const { isDark } = useWatermelonTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#141D2E' : '#EAEFF5',
          borderColor: isDark ? '#23324D' : '#E2E8F0',
        },
        style,
      ]}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        const hasBadge = opt.badge !== undefined && opt.badge !== null && opt.badge !== '';
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            style={({ pressed }) => [
              styles.segment,
              isSelected
                ? {
                    backgroundColor: isDark ? '#1E2A42' : '#FFFFFF',
                    borderWidth: 1.5,
                    borderColor: isDark ? '#3B82F6' : '#93C5FD',
                  }
                : {
                    backgroundColor: pressed
                      ? isDark
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(0,0,0,0.04)'
                      : 'transparent',
                    borderWidth: 1.5,
                    borderColor: 'transparent',
                  },
              {
                opacity: pressed && !isSelected ? 0.75 : 1,
                transform: [{ scale: pressed && !isSelected ? 0.98 : 1 }],
              },
            ]}
          >
            <View style={styles.innerContent}>
              <Text
                numberOfLines={1}
                style={{
                  color: isSelected
                    ? isDark
                      ? '#FFFFFF'
                      : '#0F172A'
                    : isDark
                    ? '#94A3B8'
                    : '#64748B',
                  fontSize: 13,
                  fontWeight: isSelected ? '700' : '600',
                  letterSpacing: -0.2,
                }}
              >
                {opt.label}
              </Text>

              {hasBadge && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: isSelected
                        ? '#10B981'
                        : isDark
                        ? '#23324D'
                        : '#E2E8F0',
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: isSelected
                        ? '#FFFFFF'
                        : isDark
                        ? '#94A3B8'
                        : '#64748B',
                      fontSize: 11,
                      fontWeight: '800',
                    }}
                  >
                    {opt.badge}
                  </Text>
                </View>
              )}
            </View>
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
    width: '100%',
    height: 46,
    padding: 3,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  segment: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    height: '100%',
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  innerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 9999,
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 18,
  },
});
