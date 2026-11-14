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
  const { theme, isDark } = useWatermelonTheme();

  return (
    <View
      className="w-full flex-row items-center"
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#0D131F' : '#EAEFF5',
          borderColor: isDark ? '#1E293B' : '#E2E8F0',
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
            className="flex-1 h-full flex-row items-center justify-center"
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
                      : 'rgba(0,0,0,0.06)',
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
                opacity: pressed && !isSelected ? 0.75 : 1,
                transform: [{ scale: pressed && !isSelected ? 0.98 : 1 }],
              },
            ]}
          >
            <View
              className="flex-row items-center justify-center"
              style={styles.innerContent}
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
                  fontSize: 12.5,
                  fontWeight: isSelected ? '700' : '600',
                  letterSpacing: -0.2,
                  textAlign: 'center',
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {opt.label}
              </Text>

              {opt.badge !== undefined && (
                <View
                  style={{
                    backgroundColor: isSelected
                      ? isDark
                        ? 'rgba(16,185,129,0.22)'
                        : '#D1FAE5'
                      : isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.06)',
                    borderRadius: 9,
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                    marginLeft: 5,
                  }}
                >
                  <Text
                    style={{
                      color: isSelected
                        ? '#10B981'
                        : isDark
                        ? '#94A3B8'
                        : '#64748B',
                      fontSize: 10.5,
                      fontWeight: '700',
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
    height: 44,
    padding: 3,
    borderRadius: 14,
    borderWidth: 1,
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
    paddingHorizontal: 4,
  },
  innerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
