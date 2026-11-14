import React from 'react';
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useWatermelonTheme } from '@/theme';

function TabIcon({
  name,
  outlineName,
  label,
  focused,
  color,
}: {
  name: keyof typeof Ionicons.glyphMap;
  outlineName: keyof typeof Ionicons.glyphMap;
  label: string;
  focused: boolean;
  color: string;
}) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', top: 2 }}>
      <Ionicons
        name={focused ? name : outlineName}
        size={22}
        color={color}
      />
      <Text
        style={{
          fontSize: 11,
          color,
          fontWeight: focused ? '700' : '500',
          marginTop: 3,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { theme } = useWatermelonTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.divider,
          borderTopWidth: 1,
          height: 60 + Math.max(insets.bottom, 8),
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              label="Home"
              name="home"
              outlineName="home-outline"
              focused={focused}
              color={focused ? theme.primary : theme.textMuted}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              label="Groups"
              name="people"
              outlineName="people-outline"
              focused={focused}
              color={focused ? theme.primary : theme.textMuted}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              label="Friends"
              name="person"
              outlineName="person-outline"
              focused={focused}
              color={focused ? theme.primary : theme.textMuted}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              label="Activity"
              name="flash"
              outlineName="flash-outline"
              focused={focused}
              color={focused ? theme.primary : theme.textMuted}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              label="Analytics"
              name="pie-chart"
              outlineName="pie-chart-outline"
              focused={focused}
              color={focused ? theme.primary : theme.textMuted}
            />
          ),
        }}
      />
    </Tabs>
  );
}
