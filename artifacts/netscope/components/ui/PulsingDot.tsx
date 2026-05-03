import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

interface PulsingDotProps {
  color: string;
  size?: number;
}

export default function PulsingDot({ color, size = 8 }: PulsingDotProps) {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withSequence(withTiming(0.3, { duration: 700 }), withTiming(1, { duration: 700 })), -1, false);
    scale.value = withRepeat(withSequence(withTiming(1.3, { duration: 700 }), withTiming(1, { duration: 700 })), -1, false);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={[styles.outer, { width: size * 2, height: size * 2, borderRadius: size, backgroundColor: `${color}30` }]}>
      <Animated.View style={[animStyle, styles.inner, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { alignItems: 'center', justifyContent: 'center' },
  inner: {},
});
