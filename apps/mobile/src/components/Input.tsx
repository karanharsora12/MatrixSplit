import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TextInputProps,
  ViewStyle,
  TextStyle,
  StyleProp,
  Pressable,
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
          className="mb-1 text-xs font-semibold uppercase tracking-wider"
          style={{
            color: isFocused ? theme.primary : theme.textMuted,
            fontSize: typography.fontSize.xs,
          }}
        >
          {label}
        </Text>
      )}

      <View
        style={{
          minHeight: 44,
          backgroundColor: theme.surface,
          borderColor,
          borderWidth: isFocused || error ? 1.5 : 1,
          borderRadius: borderRadius.md,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
        }}
      >
        {leftIcon && (
          <View style={{ marginRight: 8, alignItems: 'center', justifyContent: 'center' }}>
            {leftIcon}
          </View>
        )}

        <TextInput
          placeholderTextColor={theme.textMuted}
          style={[
            {
              color: theme.text,
              fontSize: typography.fontSize.sm,
              paddingVertical: 8,
              paddingHorizontal: 0,
              flex: 1,
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
          <Pressable
            disabled={!onRightIconPress}
            onPress={onRightIconPress}
            style={({ pressed }) => [
              {
                marginLeft: 8,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            {rightIcon}
          </Pressable>
        )}
      </View>

      {error ? (
        <Text
          className="mt-1 text-xs"
          style={{ color: theme.negative, fontSize: typography.fontSize.xs }}
        >
          {error}
        </Text>
      ) : hint ? (
        <Text
          className="mt-1 text-xs"
          style={{ color: theme.textMuted, fontSize: typography.fontSize.xs }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
};
