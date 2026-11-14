import '../global.css';
import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WatermelonThemeProvider } from '@/theme';
import { useThemeStore } from '../src/stores/themeStore';
import { useAuthStore } from '../src/stores/authStore';
import { initSocket } from '../src/services/socket';
import { StatusBar } from 'expo-status-bar';
import { PortalHost } from '@rn-primitives/portal';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 30, // 30s
    },
  },
});

function RootNavigation() {
  const segments = useSegments();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isReady, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="group/[id]"
        options={{ presentation: 'card', headerShown: false }}
      />
      <Stack.Screen
        name="friend/[id]"
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
      <Stack.Screen
        name="settings/ui-showcase"
        options={{ presentation: 'card', headerShown: false }}
      />
    </Stack>
  );
}

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
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <WatermelonThemeProvider isDark={isDark}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <RootNavigation />
          <PortalHost />
        </WatermelonThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
