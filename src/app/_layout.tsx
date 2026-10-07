import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { colors } from '@/core/theme';
import { SessionProvider, useSession } from '@/features/auth/SessionProvider';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SessionProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </SessionProvider>
  );
}

function RootNavigator() {
  const { session, isRestoring } = useSession();

  useEffect(() => {
    if (!isRestoring) SplashScreen.hideAsync();
  }, [isRestoring]);

  // Keep the splash up until we know whether a session exists, so we never flash the login screen.
  if (isRestoring) return null;

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text },
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="index" options={{ title: 'My Courses' }} />
        <Stack.Screen name="course/[id]" options={{ title: 'Course' }} />
      </Stack.Protected>
    </Stack>
  );
}
