import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { typography, spacing, radius } from '@/constants/theme';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'muted' | 'primary';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

export default function Badge({ label, variant = 'muted', size = 'sm' }: BadgeProps) {
  const { theme } = useTheme();

  const colors: Record<BadgeVariant, { bg: string; text: string }> = {
    success: { bg: theme.successGlow, text: theme.success },
    warning: { bg: theme.warningGlow, text: theme.warning },
    error:   { bg: theme.errorGlow,   text: theme.error   },
    info:    { bg: theme.primaryGlow, text: theme.primary  },
    muted:   { bg: theme.glass,       text: theme.textMuted },
    primary: { bg: theme.primaryGlow, text: theme.primary  },
  };

  const { bg, text } = colors[variant];
  const fontSize = size === 'sm' ? typography.xs : typography.sm;
  const paddingH = size === 'sm' ? spacing.sm : spacing.md;
  const paddingV = size === 'sm' ? 2 : spacing.xs;

  return (
    <View style={[styles.badge, { backgroundColor: bg, paddingHorizontal: paddingH, paddingVertical: paddingV }]}>
      <Text style={[styles.text, { color: text, fontSize }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: radius.full, alignSelf: 'flex-start' },
  text: { fontWeight: typography.semibold, letterSpacing: 0.3 },
});
