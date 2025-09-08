import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { SupabaseAuthProvider } from '../contexts/SupabaseAuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { NotificationManager } from '../components/NotificationToast';
import { AnalyticsProvider } from '../components/AnalyticsProvider';
import { Provider } from 'react-redux';
import { store } from '../store';
import '../i18n';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  
  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Provider store={store}>
      <SupabaseAuthProvider>
        <NotificationProvider>
          <AnalyticsProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
            <NotificationManager />
          </AnalyticsProvider>
        </NotificationProvider>
      </SupabaseAuthProvider>
    </Provider>
  );
}