import React, { useEffect, useState } from 'react';
import { Text, TextStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

interface AnimatedNumberProps {
  value: number;
  style?: TextStyle;
  duration?: number;
  suffix?: string;
  decimals?: number;
}

export default function AnimatedNumber({ value, style, duration = 1200, suffix = '', decimals = 0 }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = display;
    const end = value;
    const startTime = Date.now();
    let frame: ReturnType<typeof requestAnimationFrame>;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <Text style={style}>
      {display.toFixed(decimals)}{suffix}
    </Text>
  );
}
