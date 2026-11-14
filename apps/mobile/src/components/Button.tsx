import { cn } from "@/lib/utils";
import { useWatermelonTheme } from "@/theme";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
export { buttonTextVariants, buttonVariants } from "./ui/button";

export interface ButtonProps {
  label?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "destructive"
    | "default";
  size?: "sm" | "md" | "lg" | "icon" | "default";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  style?:
    | StyleProp<ViewStyle>
    | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
  textStyle?: StyleProp<TextStyle>;
  className?: string;
  [key: string]: any;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  children,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
  style,
  textStyle,
  className,
  ...rest
}) => {
  const { theme, borderRadius, typography, spacing, isDark } =
    useWatermelonTheme();

  // Normalize variant names
  const normVariant =
    variant === "primary" || variant === "default"
      ? "primary"
      : variant === "danger" || variant === "destructive"
        ? "destructive"
        : variant;

  let bgColor = theme.primary;
  let textColor = "#FFFFFF";
  let borderWidth = 0;
  let borderColor = "transparent";
  let shadowStyle: ViewStyle = {};

  if (normVariant === "primary") {
    bgColor = theme.primary;
    textColor = "#FFFFFF";
    if (!isDark && !disabled) {
      shadowStyle = {
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.22,
        shadowRadius: 4,
        elevation: 3,
      };
    }
  } else if (normVariant === "secondary") {
    bgColor = isDark ? "#1E293B" : "#F1F5F9";
    textColor = theme.text;
    borderWidth = 1;
    borderColor = isDark ? "#334155" : "#E2E8F0";
  } else if (normVariant === "outline") {
    bgColor = "transparent";
    textColor = theme.text;
    borderWidth = 1.5;
    borderColor = isDark ? "#334155" : "#CBD5E1";
  } else if (normVariant === "ghost") {
    bgColor = "transparent";
    textColor = theme.primary;
    borderWidth = 0;
  } else if (normVariant === "destructive") {
    bgColor = theme.negative || "#EF4444";
    textColor = "#FFFFFF";
    if (!isDark && !disabled) {
      shadowStyle = {
        shadowColor: "#EF4444",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
      };
    }
  }

  let minHeight = 46;
  let minWidth = undefined;
  let paddingVertical = 12;
  let paddingHorizontal = 18;
  let fontSize = typography.fontSize.sm + 1; // 15px

  if (size === "sm") {
    minHeight = 36;
    paddingVertical = 7;
    paddingHorizontal = 12;
    fontSize = typography.fontSize.xs + 1; // 13px
  } else if (size === "lg") {
    minHeight = 52;
    paddingVertical = 14;
    paddingHorizontal = 24;
    fontSize = typography.fontSize.base; // 16px
  } else if (size === "icon") {
    minHeight = 44;
    minWidth = 44;
    paddingVertical = 0;
    paddingHorizontal = 0;
  }

  const baseRadius = 14;

  const containerStyle: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: disabled ? (isDark ? "#1E293B" : "#E2E8F0") : bgColor,
    borderRadius: baseRadius,
    borderWidth,
    borderColor: disabled ? "transparent" : borderColor,
    paddingVertical,
    paddingHorizontal,
    minHeight,
    minWidth,
    width: fullWidth ? "100%" : undefined,
    ...shadowStyle,
  };

  const labelStyle: TextStyle = {
    color: disabled ? (isDark ? "#64748B" : "#94A3B8") : textColor,
    fontSize,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.2,
  };

  const tailwindClasses = cn(
    "flex-row items-center justify-center",
    fullWidth && "w-full",
    className,
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      role="button"
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      android_ripple={
        disabled
          ? undefined
          : {
              color: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
              borderless: false,
            }
      }
      className={tailwindClasses}
      style={({ pressed }) => {
        const resolvedCustomStyle =
          typeof style === "function" ? style({ pressed }) : style;
        return [
          containerStyle,
          {
            opacity: disabled ? 0.5 : pressed ? 0.84 : 1,
            transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
          },
          resolvedCustomStyle,
        ];
      }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon && iconPosition === "left" && (
            <View style={{ marginRight: size === "sm" ? 6 : 8 }}>{icon}</View>
          )}
          {typeof children === "string" ? (
            <Text style={[labelStyle, textStyle]}>{children}</Text>
          ) : children ? (
            children
          ) : label ? (
            <Text style={[labelStyle, textStyle]}>{label}</Text>
          ) : null}
          {icon && iconPosition === "right" && (
            <View style={{ marginLeft: size === "sm" ? 6 : 8 }}>{icon}</View>
          )}
        </View>
      )}
    </Pressable>
  );
};
