import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WatermelonThemeProvider } from '@matrixsplit/watermelon-ui';
import { useThemeStore } from '../src/stores/themeStore';
import { useAuthStore } from '../src/stores/authStore';
import { initSocket } from '../src/services/socket';
import { StatusBar } from 'expo-status-bar';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 30, // 30s
    },
  },
});

export default function RootLayout() {
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      initSocket(queryClient);
    }
  }, [isAuthenticated]);

  return (
    <QueryClientProvider client={queryClient}>
      <WatermelonThemeProvider isDark={isDark}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="group/[id]"
            options={{ presentation: 'card', headerShown: false }}
          />
          <Stack.Screen
            name="expense/add"
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="expense/[id]"
            options={{ presentation: 'card', headerShown: false }}
          />
          <Stack.Screen
            name="settle/index"
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="settings/index"
            options={{ presentation: 'card', headerShown: false }}
          />
        </Stack>
      </WatermelonThemeProvider>
    </QueryClientProvider>
  );
}
