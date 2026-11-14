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
  const { theme, isDark } = useWatermelonTheme();
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? '#F43F5E'
    : isFocused
    ? theme.primary
    : isDark
    ? '#1E293B'
    : '#E2E8F0';

  const inputBg = isDark ? '#0F172A' : '#FFFFFF';

  return (
    <View style={[{ marginBottom: 14, width: '100%' }, containerStyle]}>
      {label && (
        <Text
          style={{
            color: isFocused ? theme.primary : isDark ? '#94A3B8' : '#475569',
            fontSize: 13,
            fontWeight: '600',
            marginBottom: 6,
            letterSpacing: -0.1,
          }}
        >
          {label}
        </Text>
      )}

      <View
        style={{
          minHeight: 46,
          backgroundColor: inputBg,
          borderColor,
          borderWidth: isFocused || error ? 1.5 : 1,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
        }}
      >
        {leftIcon && <View style={{ marginRight: 8 }}>{leftIcon}</View>}

        <TextInput
          placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
          style={[
            {
              flex: 1,
              color: theme.text,
              fontSize: 14,
              fontWeight: '500',
              paddingVertical: 10,
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
            onPress={onRightIconPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ marginLeft: 6 }}
          >
            {rightIcon}
          </Pressable>
        )}
      </View>

      {error ? (
        <Text
          style={{
            color: '#F43F5E',
            fontSize: 11,
            fontWeight: '600',
            marginTop: 4,
            marginLeft: 2,
          }}
        >
          {error}
        </Text>
      ) : hint ? (
        <Text
          style={{
            color: theme.textMuted,
            fontSize: 11,
            marginTop: 4,
            marginLeft: 2,
          }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
};
