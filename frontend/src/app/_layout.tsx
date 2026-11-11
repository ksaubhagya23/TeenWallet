import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    'Samarkan': require('../../assets/fonts/samarkan.ttf'),
    'NunitoSans-Regular': require('../../assets/fonts/NunitoSans-Regular.ttf'),
    'NunitoSans-Bold': require('../../assets/fonts/NunitoSans-Bold.ttf'),
    'Rubik': require('../../assets/fonts/rubik.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

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