import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Some font files in the repo are empty (0 byte), so only Samarkan is loaded.
  // Text that asks for 'Rubik' uses the phone's default font instead.
  const [loaded, fontError] = useFonts({
    'Samarkan': require('../../assets/fonts/samarkan.ttf'),
  });

  useEffect(() => {
    // Hide the splash screen even if a font fails, so the app never gets stuck on it
    if (loaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [loaded, fontError]);

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
