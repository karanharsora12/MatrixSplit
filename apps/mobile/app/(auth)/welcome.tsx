import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button } from "@/components";
import { useWatermelonTheme } from "@/theme";
import { useAuthStore } from "../../src/stores/authStore";

export default function WelcomeScreen() {
  const router = useRouter();
  const { theme, isDark } = useWatermelonTheme();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleInstantDemo = () => {
    setAuth(
      {
        id: "usr-demo-alice",
        email: "alice@matrixsplit.com",
        fullName: "Alice Johnson",
        defaultCurrency: "INR",
        preferredLanguage: "en",
        themePreference: "system",
        isEmailVerified: true,
        profileImage: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      "demo_access_token",
      "demo_refresh_token",
    );
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#090D16" : "#F8FAFC" },
      ]}
      edges={["top", "bottom", "left", "right"]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View
            style={[
              styles.logoBadge,
              {
                backgroundColor: isDark ? "#111827" : "#FFFFFF",
                borderColor: isDark ? "#1E293B" : "#E2E8F0",
              },
            ]}
          >
            <View
              style={[
                styles.logoIconCircle,
                { backgroundColor: theme.primary },
              ]}
            >
              <Ionicons name="flash" size={20} color="#FFFFFF" />
            </View>
            <Text style={[styles.brandTitle, { color: theme.text }]}>
              MatrixSplit
            </Text>
          </View>
          <Text style={[styles.brandTagline, { color: theme.textMuted }]}>
            Shared expenses, simplified debts & instant settlements.
          </Text>
        </View>

        {/* Live Visual Ledger Preview Card */}
        <View
          style={[
            styles.previewCard,
            {
              backgroundColor: isDark ? "#111827" : "#FFFFFF",
              borderColor: isDark ? "#1E293B" : "#E2E8F0",
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.35 : 0.06,
              shadowRadius: 10,
              elevation: 4,
            },
          ]}
        >
          <View style={styles.previewTop}>
            <View style={styles.previewGroupMeta}>
              <View
                style={[
                  styles.previewGroupIcon,
                  {
                    backgroundColor: isDark
                      ? "rgba(16,185,129,0.18)"
                      : "#D1FAE5",
                  },
                ]}
              >
                <Ionicons name="airplane" size={16} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.previewGroupName, { color: theme.text }]}>
                  Goa Trip 🌴
                </Text>
                <Text
                  style={[styles.previewGroupSub, { color: theme.textMuted }]}
                >
                  4 members · Active ledger
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.previewStatusPill,
                {
                  backgroundColor: isDark ? "rgba(16,185,129,0.18)" : "#D1FAE5",
                  borderColor: isDark ? "rgba(16,185,129,0.3)" : "#A7F3D0",
                },
              ]}
            >
              <Text
                style={[
                  styles.previewStatusText,
                  { color: isDark ? "#34D399" : "#059669" },
                ]}
              >
                +₹4,650
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.previewDivider,
              { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" },
            ]}
          />

          <View style={styles.previewDetailRow}>
            <View style={styles.previewUserStack}>
              <View
                style={[
                  styles.miniAvatar,
                  { backgroundColor: "#3B82F6", zIndex: 3 },
                ]}
              >
                <Text style={styles.miniAvatarText}>A</Text>
              </View>
              <View
                style={[
                  styles.miniAvatar,
                  { backgroundColor: "#F59E0B", marginLeft: -8, zIndex: 2 },
                ]}
              >
                <Text style={styles.miniAvatarText}>B</Text>
              </View>
              <View
                style={[
                  styles.miniAvatar,
                  { backgroundColor: "#8B5CF6", marginLeft: -8, zIndex: 1 },
                ]}
              >
                <Text style={styles.miniAvatarText}>C</Text>
              </View>
            </View>
            <Text style={[styles.previewInfoText, { color: theme.textMuted }]}>
              Dinner & Airbnb split equally
            </Text>
            <Text style={[styles.previewAmountText, { color: theme.text }]}>
              ₹18,600
            </Text>
          </View>
        </View>

        {/* Core Value Pillars */}
        <View style={styles.pillarsContainer}>
          <View style={styles.pillarItem}>
            <View
              style={[
                styles.pillarIconWrap,
                {
                  backgroundColor: isDark ? "rgba(16,185,129,0.15)" : "#D1FAE5",
                },
              ]}
            >
              <Ionicons
                name="pie-chart-outline"
                size={18}
                color={theme.primary}
              />
            </View>
            <View style={styles.pillarTextWrap}>
              <Text style={[styles.pillarTitle, { color: theme.text }]}>
                Zero-Math Bill Splitting
              </Text>
              <Text style={[styles.pillarDesc, { color: theme.textMuted }]}>
                Equal shares, exact rupee amounts, percentages, or custom
                shares.
              </Text>
            </View>
          </View>

          <View style={styles.pillarItem}>
            <View
              style={[
                styles.pillarIconWrap,
                {
                  backgroundColor: isDark ? "rgba(59,130,246,0.15)" : "#DBEAFE",
                },
              ]}
            >
              <Ionicons name="git-network-outline" size={18} color="#3B82F6" />
            </View>
            <View style={styles.pillarTextWrap}>
              <Text style={[styles.pillarTitle, { color: theme.text }]}>
                Smart Debt Minimization
              </Text>
              <Text style={[styles.pillarDesc, { color: theme.textMuted }]}>
                Min-cash-flow graph reduces 10+ group transfers down to 2 or 3.
              </Text>
            </View>
          </View>

          <View style={styles.pillarItem}>
            <View
              style={[
                styles.pillarIconWrap,
                {
                  backgroundColor: isDark ? "rgba(245,158,11,0.15)" : "#FEF3C7",
                },
              ]}
            >
              <Ionicons name="flash-outline" size={18} color="#F59E0B" />
            </View>
            <View style={styles.pillarTextWrap}>
              <Text style={[styles.pillarTitle, { color: theme.text }]}>
                Instant Multi-Rail Settlements
              </Text>
              <Text style={[styles.pillarDesc, { color: theme.textMuted }]}>
                Settle up via UPI, cash, or bank transfer with live balance
                verification.
              </Text>
            </View>
          </View>
        </View>

        {/* Action CTAs */}
        <View style={styles.actionSection}>
          <Button
            label="Get Started"
            size="lg"
            variant="primary"
            fullWidth
            icon={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
            iconPosition="right"
            onPress={() => router.push("/(auth)/signup")}
            style={{ marginBottom: 12 }}
          />

          <View style={styles.loginRow}>
            <Text style={[styles.loginPromptText, { color: theme.textMuted }]}>
              Already have an account?{" "}
            </Text>
            <Pressable
              onPress={() => router.push("/(auth)/login")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={[styles.loginLinkText, { color: theme.primary }]}>
                Log In
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 28,
    flexGrow: 1,
    justifyContent: "space-between",
  },
  brandHeader: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  logoBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12,
  },
  logoIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  brandTagline: {
    fontSize: 14,
    textAlign: "center",
    maxWidth: 290,
    lineHeight: 20,
  },
  previewCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  previewTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewGroupMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  previewGroupIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  previewGroupName: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  previewGroupSub: {
    fontSize: 12,
    marginTop: 1,
  },
  previewStatusPill: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  previewStatusText: {
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  previewDivider: {
    height: 1,
    marginVertical: 12,
  },
  previewDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewUserStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  miniAvatarText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  previewInfoText: {
    fontSize: 12,
    flex: 1,
    marginLeft: 8,
  },
  previewAmountText: {
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  pillarsContainer: {
    gap: 14,
    marginBottom: 24,
  },
  pillarItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  pillarIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 1,
  },
  pillarTextWrap: {
    flex: 1,
  },
  pillarTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  pillarDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  actionSection: {
    width: "100%",
  },
  demoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  demoBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  loginRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  loginPromptText: {
    fontSize: 14,
    fontWeight: "500",
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
