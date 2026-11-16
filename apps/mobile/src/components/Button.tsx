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
import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "flex-row items-center justify-center font-semibold rounded-2xl",
  {
    variants: {
      variant: {
        default: "bg-emerald-500 text-white",
        primary: "bg-emerald-500 text-white",
        secondary: "bg-slate-800 text-slate-100",
        outline: "border border-slate-700 text-slate-100",
        ghost: "text-emerald-500",
        destructive: "bg-rose-500 text-white",
        danger: "bg-rose-500 text-white",
        link: "text-emerald-500 underline",
      },
      size: {
        default: "h-12 px-5",
        sm: "h-10 px-4",
        md: "h-12 px-5",
        lg: "h-14 px-7",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export const buttonTextVariants = cva("font-bold text-center", {
  variants: {
    variant: {
      default: "text-white",
      primary: "text-white",
      secondary: "text-slate-100",
      outline: "text-slate-100",
      ghost: "text-emerald-500",
      destructive: "text-white",
      danger: "text-white",
      link: "text-emerald-500",
    },
    size: {
      default: "text-base",
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
      icon: "text-sm",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

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
    | "default"
    | "link";
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
  const { isDark } = useWatermelonTheme();

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

  if (normVariant === "primary") {
    bgColor = "#10B981";
    pressedBgColor = "#059669";
    textColor = "#FFFFFF";
  } else if (normVariant === "secondary") {
    bgColor = isDark ? "#141D2E" : "#F1F5F9";
    pressedBgColor = isDark ? "#1E2A42" : "#E2E8F0";
    textColor = isDark ? "#F8FAFC" : "#0F172A";
    borderWidth = 1.5;
    borderColor = isDark ? "#23324D" : "#CBD5E1";
  } else if (normVariant === "outline") {
    bgColor = "transparent";
    pressedBgColor = isDark ? "rgba(35,50,77,0.5)" : "rgba(0,0,0,0.05)";
    textColor = isDark ? "#F8FAFC" : "#0F172A";
    borderWidth = 1.5;
    borderColor = isDark ? "#23324D" : "#CBD5E1";
  } else if (normVariant === "ghost") {
    bgColor = "transparent";
    pressedBgColor = isDark ? "rgba(16,185,129,0.14)" : "rgba(16,185,129,0.08)";
    textColor = "#10B981";
    borderWidth = 0;
  } else if (normVariant === "destructive") {
    bgColor = "#EF4444";
    pressedBgColor = "#DC2626";
    textColor = "#FFFFFF";
  } else if (normVariant === "link") {
    bgColor = "transparent";
    pressedBgColor = "transparent";
    textColor = "#10B981";
  }

  let minHeight = 50;
  let minWidth: number | undefined = undefined;
  let paddingVertical = 12;
  let paddingHorizontal = 20;
  let fontSize = 15;
  let baseRadius = 16;

  if (size === "sm") {
    minHeight = 40;
    paddingVertical = 8;
    paddingHorizontal = 14;
    fontSize = 13;
    baseRadius = 12;
  } else if (size === "lg") {
    minHeight = 54;
    paddingVertical = 15;
    paddingHorizontal = 24;
    fontSize = 16;
    baseRadius = 18;
  } else if (size === "icon") {
    minHeight = 44;
    minWidth = 44;
    paddingVertical = 0;
    paddingHorizontal = 0;
    baseRadius = 14;
  }

  const labelStyle: TextStyle = {
    color: disabled ? (isDark ? "#64748B" : "#94A3B8") : textColor,
    fontSize,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.2,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      role="button"
      style={({ pressed }) => {
        const resolvedCustomStyle =
          typeof style === "function" ? style({ pressed }) : style;
        return [
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: disabled
              ? isDark
                ? "#1A2333"
                : "#E2E8F0"
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
