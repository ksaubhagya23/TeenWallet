import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded, fontError] = useFonts({
    'Samarkan': require('../../assets/fonts/samarkan.ttf'),
  });

  // Hide the splash as soon as fonts are ready or failed
  useEffect(() => {
    if (loaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, fontError]);

  // Safety: always hide the splash after 3 seconds, so the app never gets stuck
  useEffect(() => {
    const t = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A235A' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="choose-language" />
      <Stack.Screen name="choose-role" />
      <Stack.Screen name="login-teen" />
      <Stack.Screen name="login-parent" />
      <Stack.Screen name="teen-dashboard" />
      <Stack.Screen name="parent-dashboard" />
    </Stack>
  );
}
