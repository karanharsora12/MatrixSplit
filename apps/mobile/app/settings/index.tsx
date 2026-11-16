import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useWatermelonTheme } from "@/theme";
import { useAuthStore } from "../../src/stores/authStore";
import { useThemeStore } from "../../src/stores/themeStore";
import { apiClient } from "../../src/services/api";
import { CurrencyCode } from "@matrixsplit/shared";
import { cn } from "@/lib/utils";
import { dialog } from "@/components";

const currencyOptions: { code: CurrencyCode; symbol: string; label: string }[] =
  [
    { code: "INR", symbol: "₹", label: "INR" },
    { code: "USD", symbol: "$", label: "USD" },
    { code: "EUR", symbol: "€", label: "EUR" },
    { code: "GBP", symbol: "£", label: "GBP" },
  ];

export default function SettingsScreen() {
  const router = useRouter();
  const { isDark } = useWatermelonTheme();
  const { user, logout, setUser } = useAuthStore();
  const { mode, setMode } = useThemeStore();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [currency, setCurrency] = useState<CurrencyCode>(
    user?.defaultCurrency || "INR",
  );
  const [updating, setUpdating] = useState(false);

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  const handleUpdateProfile = async () => {
    setUpdating(true);
    try {
      const res = await apiClient.patch("/auth/profile", {
        fullName: fullName.trim(),
        defaultCurrency: currency,
      });

      setUser(res.data);
      dialog.success("Saved", "Profile updated successfully!");
    } catch (err: any) {
      dialog.error(
        "Error",
        err.response?.data?.message || "Failed to update profile",
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = await dialog.confirm({
      title: "Logout",
      description: "Are you sure you want to log out of MatrixSplit?",
      confirmText: "Logout",
      destructive: true,
    });

    if (confirmed) {
      logout();
      router.replace("/(auth)/welcome");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await dialog.confirm({
      title: "Delete Account",
      description:
        "This will permanently delete your account and sessions. This action cannot be undone.",
      confirmText: "Delete Forever",
      destructive: true,
    });

    if (confirmed) {
      try {
        await apiClient.delete("/users/me");
        logout();
        router.replace("/(auth)/welcome");
      } catch (err: any) {
        dialog.error(
          "Error",
          err.response?.data?.message || "Failed to delete account",
        );
      }
    }
  };

  const initials = (user?.fullName || "User")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className={cn("flex-1", isDark ? "bg-[#090D16]" : "bg-[#F8FAFC]")}
    >
      {/* Top Header */}
      <View
        className={cn(
          "flex-row items-center justify-between px-5 pt-3 pb-3 border-b",
          isDark
            ? "border-[#1E293B] bg-[#090D16]"
            : "border-slate-200 bg-white",
        )}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className={cn(
            "w-9 h-9 rounded-xl items-center justify-center border active:scale-95",
            isDark
              ? "bg-[#141D2E] border-[#23324D] active:bg-[#1E2A42]"
              : "bg-white border-slate-200 active:bg-slate-100",
          )}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={isDark ? "#E2E8F0" : "#334155"}
          />
        </Pressable>

        <Text
          className={cn(
            "text-base font-extrabold tracking-tight",
            isDark ? "text-white" : "text-slate-900",
          )}
        >
          Settings
        </Text>

        <View className="w-9 h-9" />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 16,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Card */}
        <View
          className={cn(
            "p-6 rounded-3xl border items-center mb-5",
            isDark
              ? "bg-[#141D2E] border-[#23324D]"
              : "bg-white border-slate-200 shadow-sm shadow-black/5",
          )}
        >
          <View className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 items-center justify-center mb-3">
            <Text className="text-2xl font-extrabold text-emerald-500 font-mono">
              {initials}
            </Text>
          </View>
          <Text
            className={cn(
              "text-lg font-extrabold tracking-tight",
              isDark ? "text-white" : "text-slate-900",
            )}
          >
            {user?.fullName || "MatrixSplit Member"}
          </Text>
          <Text className="text-xs text-slate-400 mt-0.5">{user?.email}</Text>
          <View className="flex-row items-center mt-3 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30">
            <Ionicons
              name="checkmark-circle"
              size={13}
              color="#10B981"
              style={{ marginRight: 4 }}
            />
            <Text className="text-[11px] font-bold text-emerald-400">
              Verified Account
            </Text>
          </View>
        </View>

        {/* Appearance / Theme Options */}
        <View className="mb-5">
          <Text
            className={cn(
              "text-xs font-bold tracking-wider mb-2.5 uppercase",
              isDark ? "text-slate-400" : "text-slate-500",
            )}
          >
            Appearance & Theme
          </Text>
          <View
            className={cn(
              "p-4 rounded-3xl border",
              isDark
                ? "bg-[#141D2E] border-[#23324D]"
                : "bg-white border-slate-200 shadow-sm shadow-black/5",
            )}
          >
            <View className="flex-row gap-2.5">
              {[
                {
                  id: "system",
                  label: "System",
                  icon: "phone-portrait-outline" as const,
                },
                { id: "light", label: "Light", icon: "sunny-outline" as const },
                { id: "dark", label: "Dark", icon: "moon-outline" as const },
              ].map((t) => {
                const isSelected = mode === t.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => setMode(t.id as any)}
                    className={cn(
                      "flex-1 py-3.5 rounded-2xl items-center justify-center border active:scale-95",
                      isSelected
                        ? isDark
                          ? "bg-emerald-500/15 border-emerald-500/50"
                          : "bg-emerald-50 border-emerald-500"
                        : isDark
                          ? "bg-[#090D16] border-[#23324D]"
                          : "bg-slate-50 border-slate-200",
                    )}
                  >
                    <Ionicons
                      name={t.icon}
                      size={20}
                      color={
                        isSelected ? "#10B981" : isDark ? "#94A3B8" : "#64748B"
                      }
                    />
                    <Text
                      className={cn(
                        "text-xs font-bold mt-1.5",
                        isSelected
                          ? "text-emerald-500"
                          : isDark
                            ? "text-slate-300"
                            : "text-slate-700",
                      )}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Account Preferences */}
        <View className="mb-5">
          <Text
            className={cn(
              "text-xs font-bold tracking-wider mb-2.5 uppercase",
              isDark ? "text-slate-400" : "text-slate-500",
            )}
          >
            Account Preferences
          </Text>
          <View
            className={cn(
              "p-5 rounded-3xl border",
              isDark
                ? "bg-[#141D2E] border-[#23324D]"
                : "bg-white border-slate-200 shadow-sm shadow-black/5",
            )}
          >
            <Text
              className={cn(
                "text-xs font-bold tracking-wider mb-2 uppercase",
                isDark ? "text-slate-400" : "text-slate-500",
              )}
            >
              Full Name
            </Text>
            <View
              className={cn(
                "flex-row items-center h-12 px-3.5 rounded-2xl border mb-4",
                isDark
                  ? "bg-[#090D16] border-[#23324D]"
                  : "bg-slate-50 border-slate-200",
              )}
            >
              <Ionicons
                name="person-outline"
                size={17}
                color="#64748B"
                style={{ marginRight: 8 }}
              />
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your full name"
                placeholderTextColor="#64748B"
                className={cn(
                  "flex-1 text-sm font-semibold py-0",
                  isDark ? "text-white" : "text-slate-900",
                )}
              />
            </View>

            <Text
              className={cn(
                "text-xs font-bold tracking-wider mb-2 uppercase",
                isDark ? "text-slate-400" : "text-slate-500",
              )}
            >
              Default Currency
            </Text>
            <View className="flex-row gap-2.5 mb-5">
              {currencyOptions.map((c) => {
                const isSelected = currency === c.code;
                return (
                  <Pressable
                    key={c.code}
                    onPress={() => setCurrency(c.code)}
                    className={cn(
                      "flex-1 py-2.5 rounded-2xl items-center justify-center border active:scale-95",
                      isSelected
                        ? "bg-emerald-500 border-emerald-500 shadow-sm"
                        : isDark
                          ? "bg-[#090D16] border-[#23324D]"
                          : "bg-slate-50 border-slate-200",
                    )}
                  >
                    <Text
                      className={cn(
                        "text-base font-extrabold font-mono",
                        isSelected ? "text-white" : "text-emerald-500",
                      )}
                    >
                      {c.symbol}
                    </Text>
                    <Text
                      className={cn(
                        "text-[11px] font-bold mt-0.5",
                        isSelected
                          ? "text-white"
                          : isDark
                            ? "text-slate-400"
                            : "text-slate-600",
                      )}
                    >
                      {c.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={handleUpdateProfile}
              disabled={updating}
              className="h-12 rounded-2xl bg-emerald-500 items-center justify-center active:scale-[0.98] shadow-sm"
            >
              {updating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-sm font-bold text-white">
                  Save Profile Changes
                </Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* Notifications */}
        <View className="mb-5">
          <Text
            className={cn(
              "text-xs font-bold tracking-wider mb-2.5 uppercase",
              isDark ? "text-slate-400" : "text-slate-500",
            )}
          >
            Notifications
          </Text>
          <View
            className={cn(
              "p-5 rounded-3xl border",
              isDark
                ? "bg-[#141D2E] border-[#23324D]"
                : "bg-white border-slate-200 shadow-sm shadow-black/5",
            )}
          >
            <View className="flex-row items-center justify-between py-1">
              <View className="flex-1 mr-3">
                <Text
                  className={cn(
                    "text-sm font-bold",
                    isDark ? "text-white" : "text-slate-900",
                  )}
                >
                  Push Notifications
                </Text>
                <Text className="text-xs text-slate-400 mt-0.5 leading-4">
                  Instant alerts when you are added to an expense or settlement
                </Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{
                  false: isDark ? "#1E293B" : "#E2E8F0",
                  true: "#10B981",
                }}
              />
            </View>

            <View
              className={cn(
                "h-[1px] my-3.5",
                isDark ? "bg-[#23324D]" : "bg-slate-100",
              )}
            />

            <View className="flex-row items-center justify-between py-1">
              <View className="flex-1 mr-3">
                <Text
                  className={cn(
                    "text-sm font-bold",
                    isDark ? "text-white" : "text-slate-900",
                  )}
                >
                  Email Summaries
                </Text>
                <Text className="text-xs text-slate-400 mt-0.5 leading-4">
                  Weekly balance digests & settlement confirmations
                </Text>
              </View>
              <Switch
                value={emailEnabled}
                onValueChange={setEmailEnabled}
                trackColor={{
                  false: isDark ? "#1E293B" : "#E2E8F0",
                  true: "#10B981",
                }}
              />
            </View>
          </View>
        </View>

        {/* UI Showcase / Design System Link */}
        <View
          className={cn(
            "p-4 rounded-3xl border mb-5",
            isDark
              ? "bg-[#141D2E] border-[#23324D]"
              : "bg-white border-slate-200 shadow-sm shadow-black/5",
          )}
        >
          <Pressable
            onPress={() => router.push("/settings/ui-showcase")}
            className="flex-row items-center justify-between active:scale-[0.99]"
          >
            <View className="flex-row items-center flex-1 mr-2">
              <View className="w-10 h-10 rounded-2xl bg-emerald-500/15 items-center justify-center mr-3">
                <Ionicons
                  name="color-palette-outline"
                  size={19}
                  color="#10B981"
                />
              </View>
              <View className="flex-1">
                <Text
                  className={cn(
                    "text-sm font-bold",
                    isDark ? "text-white" : "text-slate-900",
                  )}
                >
                  Design System Showcase
                </Text>
                <Text className="text-xs text-slate-400 mt-0.5">
                  Preview all buttons, badges, avatars & input states
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={17} color="#64748B" />
          </Pressable>
        </View>

        {/* Danger & Session Zone */}
        <View
          className={cn(
            "p-4 rounded-3xl border mb-8",
            isDark
              ? "bg-[#141D2E] border-[#23324D]"
              : "bg-white border-slate-200 shadow-sm shadow-black/5",
          )}
        >
          <Pressable
            onPress={handleLogout}
            className="flex-row items-center py-2.5 px-2 active:scale-[0.99]"
          >
            <Ionicons
              name="log-out-outline"
              size={19}
              color={isDark ? "#E2E8F0" : "#334155"}
              style={{ marginRight: 10 }}
            />
            <Text
              className={cn(
                "text-sm font-bold",
                isDark ? "text-slate-200" : "text-slate-800",
              )}
            >
              Log Out of MatrixSplit
            </Text>
          </Pressable>

          <View
            className={cn(
              "h-[1px] my-2",
              isDark ? "bg-[#23324D]" : "bg-slate-100",
            )}
          />

          <Pressable
            onPress={handleDeleteAccount}
            className="flex-row items-center py-2.5 px-2 active:scale-[0.99]"
          >
            <Ionicons
              name="trash-outline"
              size={19}
              color="#EF4444"
              style={{ marginRight: 10 }}
            />
            <Text className="text-sm font-bold text-red-500">
              Delete Account Permanently
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
