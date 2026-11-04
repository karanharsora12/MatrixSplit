import React from 'react';
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { useWatermelonTheme } from '@matrixsplit/watermelon-ui';

function TabIcon({ label, icon, focused, color }: { label: string; icon: string; focused: boolean; color: string }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', top: 4 }}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text style={{ fontSize: 10, color, fontWeight: focused ? '700' : '500', marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { theme } = useWatermelonTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.divider,
          height: 64,
          paddingBottom: 8,
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              label="Home"
              icon="🏠"
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
              icon="👥"
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
              icon="🤝"
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
              icon="⚡"
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
              icon="📊"
              focused={focused}
              color={focused ? theme.primary : theme.textMuted}
            />
          ),
        }}
      />
    </Tabs>
  );
}
