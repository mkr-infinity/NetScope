import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { isOnboardingDone } from '@/services/storageService';

type Route = '/(tabs)/dashboard' | '/onboarding' | null;

export default function Index() {
  const [route, setRoute] = useState<Route>(null);

  useEffect(() => {
    isOnboardingDone().then(done => {
      setRoute(done ? '/(tabs)/dashboard' : '/onboarding');
    }).catch(() => {
      setRoute('/onboarding');
    });
  }, []);

  if (!route) return <View style={{ flex: 1 }} />;
  return <Redirect href={route} />;
}
