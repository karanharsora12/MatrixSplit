import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button, Input, Card } from "@/components";
import { useWatermelonTheme } from "@/theme";
import { apiClient, API_BASE_URL } from "../../src/services/api";
import { useAuthStore } from "../../src/stores/authStore";

export default function LoginScreen() {
  const router = useRouter();
  const { theme, typography, spacing, isDark, borderRadius } =
    useWatermelonTheme();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const handleLogin = async () => {
    setErrors({});
    if (!email) {
      setErrors((prev) => ({ ...prev, email: "Email is required" }));
      return;
    }
    if (!password) {
      setErrors((prev) => ({ ...prev, password: "Password is required" }));
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/auth/login", {
        email: email.trim(),
        password,
      });

      const { user, accessToken, refreshToken } = res.data;
      setAuth(user, accessToken, refreshToken);
      router.replace("/(tabs)");
    } catch (err: any) {
      const serverMsg = err.response?.data?.message;
      const netMsg =
        err.message === "Network Error" || !err.response
          ? `Cannot reach backend at ${API_BASE_URL}.\nMake sure the NestJS backend is running.`
          : err.message;
      Alert.alert("Login Failed", serverMsg || netMsg || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (userEmail: string) => {
    setEmail(userEmail);
    setPassword("Password123!");
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "bottom", "left", "right"]}
    >
      {/* Top Bar with Back */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(auth)/welcome");
            }
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={({ pressed }) => [
            styles.iconButton,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.brandIcon,
                { backgroundColor: theme.primary, borderRadius: 16 },
              ]}
            >
              <Ionicons name="log-in-outline" size={24} color="#FFFFFF" />
            </View>
            <Text
              style={[
                styles.title,
                { color: theme.text, fontSize: typography.fontSize["3xl"] },
              ]}
            >
              Welcome back
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: theme.textMuted, fontSize: typography.fontSize.sm },
              ]}
            >
              Enter your credentials to access your ledgers and shared balances
            </Text>
          </View>

          {/* Form Card */}
          <Card variant="elevated" padding="lg" style={{ marginBottom: 20 }}>
            <Input
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              leftIcon={
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={theme.textMuted}
                />
              }
            />

            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              error={errors.password}
              leftIcon={
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={theme.textMuted}
                />
              }
              rightIcon={
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={theme.textMuted}
                />
              }
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <View style={styles.forgotRow}>
              <Pressable
                onPress={() => router.push("/(auth)/forgot-password")}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={[styles.forgotText, { color: theme.primary }]}>
                  Forgot Password?
                </Text>
              </Pressable>
            </View>

            <Button
              label={loading ? "Signing in..." : "Sign In"}
              size="lg"
              variant="primary"
              fullWidth
              loading={loading}
              onPress={handleLogin}
              style={{ marginTop: 4 }}
            />
          </Card>
          {/* Sign Up Redirect */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: theme.textMuted }]}>
              Don't have an account?{" "}
            </Text>
            <Pressable
              onPress={() => router.push("/(auth)/signup")}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={[styles.signUpLink, { color: theme.primary }]}>
                Sign Up
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  brandIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontWeight: "800",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginTop: 6,
    maxWidth: 290,
    lineHeight: 19,
  },
  forgotRow: {
    alignItems: "flex-end",
    marginBottom: 14,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: "600",
  },
  quickFillSection: {
    marginBottom: 24,
    alignItems: "center",
  },
  quickFillLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  demoChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  demoPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  demoPillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: "700",
  },
});
