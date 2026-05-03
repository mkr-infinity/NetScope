import React, { useCallback } from 'react';
import { StyleSheet, ViewStyle, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';
import { useHaptics } from '@/hooks/useHaptics';
import { spacing } from '@/constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  intensity?: number;
  glow?: string;
  padded?: boolean;
  accentTop?: string;
}

export default function GlassCard({
  children, style, onPress, intensity = 12, glow, padded = true, accentTop,
}: GlassCardProps) {
  const { theme, isDark } = useTheme();
  const { light } = useHaptics();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = useCallback(() => {
    if (!onPress) return;
    scale.value = withSpring(0.97, { stiffness: theme.motionStiffness, damping: theme.motionDamping });
    light();
  }, [onPress, theme.motionStiffness, theme.motionDamping]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { stiffness: theme.motionStiffness, damping: theme.motionDamping });
  }, [theme.motionStiffness, theme.motionDamping]);

  const borderTopColor = accentTop || theme.primary;
  const cr = theme.cardRadius;

  const renderContent = () => {
    if (theme.cardVariant === 'terminal') {
      return (
        <View style={[
          styles.terminalWrap,
          { borderRadius: cr, borderColor: theme.primary, backgroundColor: theme.bgSurface },
          glow ? { shadowColor: theme.primary, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 } : null,
          style,
        ]}>
          <View style={[styles.terminalScanline, { backgroundColor: theme.primary }]} />
          <View style={[padded && styles.padded]}>
            {children}
          </View>
        </View>
      );
    }

    if (theme.cardVariant === 'elevated') {
      return (
        <View style={[
          styles.elevatedWrap,
          {
            borderRadius: cr,
            backgroundColor: theme.bgSurface,
            borderColor: theme.border,
            shadowColor: '#000',
            shadowOpacity: isDark ? 0.22 : 0.09,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 4 },
            elevation: theme.cardElevation,
          },
          glow ? { shadowColor: glow, shadowOpacity: 0.18, shadowRadius: 20 } : null,
          style,
        ]}>
          {accentTop && (
            <View style={[styles.accentLine, { backgroundColor: borderTopColor, borderTopLeftRadius: cr, borderTopRightRadius: cr }]} />
          )}
          <View style={padded && styles.padded}>
            {children}
          </View>
        </View>
      );
    }

    // glass (default)
    return (
      <LinearGradient
        colors={[theme.glassBorder, theme.border] as [string, string]}
        style={[
          styles.borderWrap,
          { borderRadius: cr },
          glow ? { shadowColor: glow, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 } : null,
          style,
        ]}
      >
        {accentTop && (
          <LinearGradient
            colors={[borderTopColor, 'transparent'] as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.accentLine}
          />
        )}
        <BlurView intensity={intensity} tint={isDark ? 'dark' : 'light'} style={[styles.blur, { borderRadius: cr - 1 }]}>
          <LinearGradient
            colors={[theme.glass, 'transparent'] as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={[{ borderRadius: cr - 1 }, padded && styles.padded]}
          >
            {children}
          </LinearGradient>
        </BlurView>
      </LinearGradient>
    );
  };

  if (onPress) {
    return (
      <Animated.View style={animStyle}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          {renderContent()}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return <Animated.View style={animStyle}>{renderContent()}</Animated.View>;
}

const styles = StyleSheet.create({
  borderWrap: {
    padding: 1,
    overflow: 'hidden',
  },
  accentLine: {
    height: 2,
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    zIndex: 10,
  },
  blur: {
    overflow: 'hidden',
  },
  padded: {
    padding: spacing.lg,
  },
  terminalWrap: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  terminalScanline: {
    height: 1,
    opacity: 0.6,
  },
  elevatedWrap: {
    borderWidth: 1,
    overflow: 'hidden',
  },
});
