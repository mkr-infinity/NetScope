import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { typography, spacing, radius } from '@/constants/theme';

interface ScanProgressProps {
  progress: number;
  subnet: string;
}

export default function ScanProgress({ progress, subnet }: ScanProgressProps) {
  const { theme } = useTheme();
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 1500, easing: Easing.linear }), -1, false);
  }, []);

  const rotStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  return (
    <View style={styles.container}>
      <Animated.View style={[rotStyle, styles.ring, { borderColor: theme.primary, borderTopColor: 'transparent' }]} />
      <View style={[styles.bar, { backgroundColor: theme.bgInput }]}>
        <View style={[styles.fill, { width: `${progress}%` as any, backgroundColor: theme.primary }]} />
      </View>
      <Text style={[styles.label, { color: theme.textMuted }]}>
        Scanning {subnet} · {Math.round(progress)}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  ring: { width: 48, height: 48, borderRadius: 24, borderWidth: 3 },
  bar: { width: '80%', height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  label: { fontSize: typography.sm },
});
