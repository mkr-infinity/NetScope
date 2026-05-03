import React, { useCallback } from 'react';
import { Text, StyleSheet, ActivityIndicator, TouchableOpacity, ViewStyle, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useHaptics } from '@/hooks/useHaptics';
import { typography, spacing } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'compact' | 'standard' | 'large';

interface GlassButtonProps {
  onPress: () => void;
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

const HEIGHT = { compact: 44, standard: 52, large: 58 };
const FONT = { compact: typography.sm, standard: typography.base, large: typography.md };

export default function GlassButton({
  onPress, title, variant = 'primary', size = 'standard', loading, disabled, icon, style,
}: GlassButtonProps) {
  const { theme } = useTheme();
  const { light } = useHaptics();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, { stiffness: theme.motionStiffness, damping: theme.motionDamping });
  }, [theme.motionStiffness, theme.motionDamping]);
  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { stiffness: theme.motionStiffness, damping: theme.motionDamping });
  }, [theme.motionStiffness, theme.motionDamping]);
  const handlePress = useCallback(() => {
    if (!disabled && !loading) { light(); onPress(); }
  }, [disabled, loading, onPress]);

  const height = HEIGHT[size];
  const fontSize = FONT[size];
  const br = theme.buttonRadius;
  const bv = theme.buttonVariant;

  const getLabel = (textColor: string) => (
    <>
      {icon && icon}
      {loading
        ? <ActivityIndicator color={textColor} size="small" />
        : <Text style={[styles.text, { color: textColor, fontSize }]}>{title}</Text>
      }
    </>
  );

  if (variant === 'primary') {
    if (bv === 'terminal') {
      return (
        <Animated.View style={[animStyle, style]}>
          <TouchableOpacity
            onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut}
            activeOpacity={1} disabled={disabled || loading}
          >
            <View style={[styles.button, {
              height, borderRadius: br,
              backgroundColor: theme.primary,
              borderWidth: 1, borderColor: theme.primary,
              opacity: disabled ? 0.45 : 1,
            }]}>
              {getLabel(theme.textInverse)}
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    }

    if (bv === 'solid') {
      return (
        <Animated.View style={[animStyle, style]}>
          <TouchableOpacity
            onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut}
            activeOpacity={1} disabled={disabled || loading}
          >
            <View style={[styles.button, {
              height, borderRadius: br,
              backgroundColor: theme.primary,
              shadowColor: theme.primary, shadowOpacity: 0.28, shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 }, elevation: 6,
              opacity: disabled ? 0.45 : 1,
            }]}>
              {getLabel('#FFFFFF')}
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    }

    // gradient (default)
    return (
      <Animated.View style={[animStyle, style]}>
        <TouchableOpacity
          onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut}
          activeOpacity={1} disabled={disabled || loading}
        >
          <LinearGradient
            colors={[theme.primary, theme.accent] as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.button, { height, borderRadius: br, opacity: disabled ? 0.45 : 1,
              shadowColor: theme.primary, shadowOpacity: 0.5, shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 }, elevation: 10,
            }]}
          >
            {getLabel('#FFFFFF')}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (variant === 'danger') {
    return (
      <Animated.View style={[animStyle, style]}>
        <TouchableOpacity
          onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut}
          activeOpacity={1} disabled={disabled || loading}
        >
          <LinearGradient
            colors={[theme.error, '#C02020'] as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.button, { height, borderRadius: br, opacity: disabled ? 0.45 : 1,
              shadowColor: theme.error, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
            }]}
          >
            {getLabel('#FFFFFF')}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (variant === 'success') {
    return (
      <Animated.View style={[animStyle, style]}>
        <TouchableOpacity
          onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut}
          activeOpacity={1} disabled={disabled || loading}
        >
          <LinearGradient
            colors={theme.gradientSuccess as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.button, { height, borderRadius: br, opacity: disabled ? 0.45 : 1 }]}
          >
            {getLabel('#FFFFFF')}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (variant === 'secondary') {
    return (
      <Animated.View style={[animStyle, style]}>
        <TouchableOpacity
          onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut}
          activeOpacity={1} disabled={disabled || loading}
          style={[styles.button, {
            height, borderRadius: br,
            backgroundColor: theme.glass,
            borderColor: theme.glassBorder,
            borderWidth: 1,
            opacity: disabled ? 0.45 : 1,
          }]}
        >
          {getLabel(theme.primary)}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[animStyle, style]}>
      <TouchableOpacity
        onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut}
        activeOpacity={1} disabled={disabled || loading}
        style={[styles.button, { height, borderRadius: br, opacity: disabled ? 0.45 : 1 }]}
      >
        {getLabel(theme.textMuted)}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  text: {
    fontWeight: typography.semibold,
    letterSpacing: 0.4,
  },
});
