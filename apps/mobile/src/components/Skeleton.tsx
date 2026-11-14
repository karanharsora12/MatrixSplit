import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleProp, ViewStyle } from 'react-native';
import { useWatermelonTheme } from '@/theme';
import { cn } from '@/lib/utils';

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 18,
  borderRadius: customRadius,
  style,
  className,
}) => {
  const { theme, borderRadius } = useWatermelonTheme();
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      className={cn('overflow-hidden bg-muted', className)}
      style={[
        {
          width: width as any,
          height,
          borderRadius: customRadius ?? borderRadius.sm,
          backgroundColor: theme.border,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
};

export const SkeletonCard: React.FC<{ className?: string; style?: StyleProp<ViewStyle> }> = ({
  className,
  style,
}) => {
  const { theme, borderRadius, spacing } = useWatermelonTheme();
  return (
    <View
      className={cn(
        'my-1.5 overflow-hidden rounded-2xl border border-border bg-card p-4',
        className
      )}
      style={[
        {
          backgroundColor: theme.card,
          borderRadius: borderRadius.lg,
          padding: spacing.base,
          borderColor: theme.border,
        },
        style,
      ]}
    >
      <View className="flex-row items-center">
        <Skeleton width={42} height={42} borderRadius={21} />
        <View className="ml-3 flex-1">
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} className="mt-1.5" />
        </View>
      </View>
      <Skeleton width="90%" height={14} className="mt-3.5" />
      <Skeleton width="35%" height={24} className="mt-2.5" />
    </View>
  );
};
