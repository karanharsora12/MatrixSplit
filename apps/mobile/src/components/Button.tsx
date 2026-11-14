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
import { useWatermelonTheme } from "@/theme";
import { cn } from "@/lib/utils";
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
  const { theme, typography, isDark } = useWatermelonTheme();

  // Normalize variant names
  const normVariant =
    variant === "primary" || variant === "default"
      ? "primary"
      : variant === "danger" || variant === "destructive"
      ? "destructive"
      : variant;

  let bgColor = "#10B981";
  let pressedBgColor = "#059669";
  let textColor = "#FFFFFF";
  let borderWidth = 0;
  let borderColor = "transparent";
  let shadowStyle: ViewStyle = {};

  if (normVariant === "primary") {
    bgColor = "#10B981";
    pressedBgColor = "#059669";
    textColor = "#FFFFFF";
    shadowStyle = {
      shadowColor: "#10B981",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.2,
      shadowRadius: 4,
      elevation: 2,
    };
  } else if (normVariant === "secondary") {
    bgColor = isDark ? "#1E293B" : "#F1F5F9";
    pressedBgColor = isDark ? "#334155" : "#E2E8F0";
    textColor = isDark ? "#F8FAFC" : "#0F172A";
    borderWidth = 1;
    borderColor = isDark ? "#334155" : "#CBD5E1";
  } else if (normVariant === "outline") {
    bgColor = "transparent";
    pressedBgColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";
    textColor = isDark ? "#F8FAFC" : "#0F172A";
    borderWidth = 1.5;
    borderColor = isDark ? "#334155" : "#CBD5E1";
  } else if (normVariant === "ghost") {
    bgColor = "transparent";
    pressedBgColor = isDark ? "rgba(16,185,129,0.14)" : "rgba(16,185,129,0.08)";
    textColor = "#10B981";
    borderWidth = 0;
  } else if (normVariant === "destructive") {
    bgColor = "#EF4444";
    pressedBgColor = "#DC2626";
    textColor = "#FFFFFF";
    shadowStyle = {
      shadowColor: "#EF4444",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.2,
      shadowRadius: 4,
      elevation: 2,
    };
  }

  let minHeight = 48;
  let minWidth: number | undefined = undefined;
  let paddingVertical = 12;
  let paddingHorizontal = 18;
  let fontSize = 15;

  if (size === "sm") {
    minHeight = 38;
    paddingVertical = 8;
    paddingHorizontal = 14;
    fontSize = 13;
  } else if (size === "lg") {
    minHeight = 52;
    paddingVertical = 14;
    paddingHorizontal = 24;
    fontSize = 16;
  } else if (size === "icon") {
    minHeight = 44;
    minWidth = 44;
    paddingVertical = 0;
    paddingHorizontal = 0;
  }

  const baseRadius = 14;

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
    normVariant === "primary" && !disabled && "bg-emerald-500",
    className,
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={tailwindClasses}
      style={({ pressed }) => {
        const resolvedCustomStyle =
          typeof style === "function" ? style({ pressed }) : style;
        return [
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: disabled
              ? (isDark ? "#1E293B" : "#E2E8F0")
              : pressed
              ? pressedBgColor
              : bgColor,
            borderRadius: baseRadius,
            borderWidth,
            borderColor: disabled ? "transparent" : borderColor,
            paddingVertical,
            paddingHorizontal,
            minHeight,
            minWidth,
            width: fullWidth ? "100%" : undefined,
            opacity: disabled ? 0.5 : pressed ? 0.92 : 1,
            transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
            ...shadowStyle,
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
          className="flex-row items-center justify-center"
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
