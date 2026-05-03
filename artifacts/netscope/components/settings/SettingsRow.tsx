import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { typography, spacing } from '@/constants/theme';
import { ChevronRightIcon } from '@/components/icons/Icons';

interface SettingsRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (val: boolean) => void;
  rightContent?: React.ReactNode;
  destructive?: boolean;
  icon?: React.ReactNode;
}

export default function SettingsRow({
  label, value, onPress, toggle, toggleValue, onToggle, rightContent, destructive, icon,
}: SettingsRowProps) {
  const { theme } = useTheme();
  const labelColor = destructive ? theme.error : theme.textPrimary;

  const content = (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.label, { color: labelColor, flex: 1 }]}>{label}</Text>
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: theme.bgInput, true: theme.primary }}
          thumbColor="#FFFFFF"
        />
      ) : rightContent ? rightContent : (
        <>
          {value && <Text style={[styles.value, { color: theme.textMuted }]}>{value}</Text>}
          {onPress && <ChevronRightIcon size={16} color={theme.textMuted} />}
        </>
      )}
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>;
  }
  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 52,
  },
  icon: { marginRight: spacing.md },
  label: { fontSize: typography.base },
  value: { fontSize: typography.sm, marginRight: spacing.sm },
});
