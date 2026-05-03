import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { typography, spacing, radius } from '@/constants/theme';

interface SectionHeaderProps {
  title: string;
  rightContent?: React.ReactNode;
}

export default function SectionHeader({ title, rightContent }: SectionHeaderProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <LinearGradient
          colors={[theme.primary, theme.accent] as [string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          style={styles.accent}
        />
        <Text style={[styles.title, { color: theme.textMuted }]}>{title.toUpperCase()}</Text>
      </View>
      {rightContent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  accent: {
    width: 3,
    height: 14,
    borderRadius: radius.full,
  },
  title: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    letterSpacing: 1.4,
  },
});
