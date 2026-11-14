import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Text, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useWatermelonTheme } from '@/theme';
import { useAuthStore } from '../../src/stores/authStore';

function TabIcon({
  name,
  outlineName,
  label,
  focused,
  color,
  isDark,
  primaryColor,
}: {
  name: keyof typeof Ionicons.glyphMap;
  outlineName: keyof typeof Ionicons.glyphMap;
  label: string;
  focused: boolean;
  color: string;
  isDark: boolean;
  primaryColor: string;
}) {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 2,
      }}
    >
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 16,
          paddingVertical: 4,
          borderRadius: 16,
          backgroundColor: focused
            ? isDark
              ? 'rgba(16,185,129,0.18)'
              : '#D1FAE5'
            : 'transparent',
          minWidth: 52,
          marginBottom: 3,
        }}
      >
        <Ionicons
          name={focused ? name : outlineName}
          size={21}
          color={focused ? primaryColor : color}
        />
      </View>
      <Text
        style={{
          fontSize: 11,
          color: focused
            ? isDark
              ? '#34D399'
              : '#059669'
            : color,
          fontWeight: focused ? '700' : '500',
          letterSpacing: -0.2,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { theme, isDark } = useWatermelonTheme();
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: isDark ? '#94A3B8' : '#64748B',
        tabBarStyle: {
          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
          borderTopColor: isDark ? '#1E293B' : '#E2E8F0',
          borderTopWidth: 1,
          height: 64 + Math.max(insets.bottom, 6),
          paddingBottom: Math.max(insets.bottom, 6),
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.2 : 0.05,
          shadowRadius: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              label="Home"
              name="home"
              outlineName="home-outline"
              focused={focused}
              color={color}
              isDark={isDark}
              primaryColor={theme.primary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              label="Groups"
              name="people"
              outlineName="people-outline"
              focused={focused}
              color={color}
              isDark={isDark}
              primaryColor={theme.primary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              label="Friends"
              name="person"
              outlineName="person-outline"
              focused={focused}
              color={color}
              isDark={isDark}
              primaryColor={theme.primary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              label="Activity"
              name="flash"
              outlineName="flash-outline"
              focused={focused}
              color={color}
              isDark={isDark}
              primaryColor={theme.primary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              label="Analytics"
              name="pie-chart"
              outlineName="pie-chart-outline"
              focused={focused}
              color={color}
              isDark={isDark}
              primaryColor={theme.primary}
            />
          ),
        }}
      />
    </Tabs>
  );
}
