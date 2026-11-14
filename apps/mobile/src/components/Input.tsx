import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TextInputProps,
  ViewStyle,
  TextStyle,
  StyleProp,
  TouchableOpacity,
} from 'react-native';
import { useWatermelonTheme } from '@/theme';
import { cn } from '@/lib/utils';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<TextStyle>;
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  style,
  className,
  onFocus,
  onBlur,
  ...rest
}) => {
  const { theme, borderRadius, typography } = useWatermelonTheme();
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? theme.negative
    : isFocused
    ? theme.primary
    : theme.border;

  return (
    <View
      className={cn('mb-3 w-full', className)}
      style={containerStyle}
    >
      {label && (
        <Text
          className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          style={{
            color: isFocused ? theme.primary : theme.textMuted,
            fontSize: typography.fontSize.xs,
          }}
        >
          {label}
        </Text>
      )}

      <View
        className={cn(
          'flex-row items-center rounded-xl border bg-card px-3',
          error
            ? 'border-destructive'
            : isFocused
            ? 'border-primary'
            : 'border-border'
        )}
        style={{
          height: 44,
          backgroundColor: theme.surface,
          borderColor,
          borderWidth: isFocused || error ? 1.5 : 1,
          borderRadius: borderRadius.md,
        }}
      >
        {leftIcon && (
          <View className="mr-2.5 items-center justify-center">
            {leftIcon}
          </View>
        )}

        <TextInput
          placeholderTextColor={theme.textMuted}
          className="flex-1 text-sm text-foreground"
          style={[
            {
              color: theme.text,
              fontSize: typography.fontSize.sm,
              paddingVertical: 0,
              paddingHorizontal: 0,
              height: '100%',
            },
            style,
          ]}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />

        {rightIcon && (
          <TouchableOpacity
            disabled={!onRightIconPress}
            onPress={onRightIconPress}
            activeOpacity={0.7}
            className="ml-2 items-center justify-center"
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <Text
          className="mt-1 text-xs text-destructive"
          style={{ color: theme.negative, fontSize: typography.fontSize.xs }}
        >
          {error}
        </Text>
      ) : hint ? (
        <Text
          className="mt-1 text-xs text-muted-foreground"
          style={{ color: theme.textMuted, fontSize: typography.fontSize.xs }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
};
