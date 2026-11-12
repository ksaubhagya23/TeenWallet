import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // NunitoSans-Regular, NunitoSans-Bold and rubik.ttf are empty (0 byte) files in the repo, so they are not loaded.
  // Text that asks for 'Rubik' simply uses the phone's default font. Put real font files back, then add them here.
  const [loaded, fontError] = useFonts({
    'Samarkan': require('../../assets/fonts/samarkan.ttf'),
  });

  useEffect(() => {
    // Hide the splash screen even if a font fails, so the app never gets stuck on it
    if (loaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [loaded, fontError]);

  // Agar font load na ho tab bhi app dikhega, blank nahi rahega
  // if (!loaded) return null; -> YE LINE HATA DE

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A235A' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="choose-language" />
      <Stack.Screen name="choose-role" />
      <Stack.Screen name="login-teen" />
      <Stack.Screen name="login-parent" />
      <Stack.Screen name="teen-dashboard" />
      <Stack.Screen name="parent-dashboard" />
      <Stack.Screen name="dashboard" />
    </Stack>
  );
}