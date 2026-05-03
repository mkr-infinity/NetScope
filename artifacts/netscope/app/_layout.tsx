import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { NetworkProvider } from "@/contexts/NetworkContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { ActivityProvider } from "@/contexts/ActivityContext";
import { ToastProvider } from "@/components/ui/Toast";

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

function RootLayoutNav() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding/index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="tool/speed-test" />
        <Stack.Screen name="tool/ping" />
        <Stack.Screen name="tool/port-scan" />
        <Stack.Screen name="tool/dns" />
        <Stack.Screen name="tool/packet-loss" />
        <Stack.Screen name="tool/ip-info" />
        <Stack.Screen name="tool/whois" />
        <Stack.Screen name="tool/latency" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [ready, setReady] = useState(Platform.OS === 'web');

  useEffect(() => {
    if (fontsLoaded || fontError) {
      if (Platform.OS !== 'web') {
        SplashScreen.hideAsync().catch(() => {});
      }
      setReady(true);
    }
  }, [fontsLoaded, fontError]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ThemeProvider>
            <SettingsProvider>
              <ActivityProvider>
                <NetworkProvider>
                  <ToastProvider>
                    <RootLayoutNav />
                  </ToastProvider>
                </NetworkProvider>
              </ActivityProvider>
            </SettingsProvider>
          </ThemeProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
