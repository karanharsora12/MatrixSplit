import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleProp,
  ViewStyle,
  StyleSheet,
  Platform,
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
  const { theme, isDark } = useWatermelonTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#0D131F' : '#EAEFF5',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
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
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            style={({ pressed }) => [
              styles.segment,
              isSelected
                ? {
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                    borderWidth: 1,
                    borderColor: isDark
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(0,0,0,0.04)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1.5 },
                    shadowOpacity: isDark ? 0.35 : 0.12,
                    shadowRadius: 3,
                    elevation: 3,
                  }
                : {
                    backgroundColor: pressed
                      ? isDark
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(0,0,0,0.04)'
                      : 'transparent',
                    borderWidth: 1,
                    borderColor: 'transparent',
                  },
              {
                transform: [{ scale: pressed && !isSelected ? 0.97 : 1 }],
              },
            ]}
          >
            <Text
              style={{
                color: isSelected
                  ? isDark
                    ? '#F8FAFC'
                    : '#0F172A'
                  : isDark
                  ? '#94A3B8'
                  : '#64748B',
                fontSize: 13,
                fontWeight: isSelected ? '700' : '600',
                letterSpacing: -0.2,
                textAlign: 'center',
              }}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
            {opt.badge !== undefined && (
              <View
                style={{
                  backgroundColor: isSelected
                    ? isDark
                      ? 'rgba(16,185,129,0.25)'
                      : '#D1FAE5'
                    : isDark
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.06)',
                  borderRadius: 10,
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  marginLeft: 5,
                }}
              >
                <Text
                  style={{
                    color: isSelected
                      ? theme.primary
                      : isDark
                      ? '#94A3B8'
                      : '#64748B',
                    fontSize: 11,
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
    height: 42,
    padding: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  segment: {
    flex: 1,
    height: '100%',
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
});
