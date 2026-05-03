import React, { useState, useCallback } from 'react';
import { TextInput, View, Text, StyleSheet, TouchableOpacity, TextInputProps } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { typography, spacing, radius } from '@/constants/theme';
import { XIcon } from '@/components/icons/Icons';

interface GlassInputProps extends TextInputProps {
  label?: string;
  rightIcon?: React.ReactNode;
  error?: string;
  clearable?: boolean;
}

export default function GlassInput({ label, rightIcon, error, clearable, style, ...props }: GlassInputProps) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? theme.error : focused ? theme.primary : theme.glassBorder;

  return (
    <View style={style}>
      {label && (
        <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      )}
      <View style={[styles.container, { backgroundColor: theme.bgInput, borderColor }]}>
        <TextInput
          {...props}
          style={[styles.input, { color: theme.textPrimary }]}
          placeholderTextColor={theme.textMuted}
          onFocus={e => { setFocused(true); props.onFocus?.(e); }}
          onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        />
        {clearable && props.value ? (
          <TouchableOpacity onPress={() => (props.onChangeText?.(''))}>
            <XIcon size={16} color={theme.textMuted} />
          </TouchableOpacity>
        ) : rightIcon}
      </View>
      {error && <Text style={[styles.error, { color: theme.error }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    marginBottom: spacing.xs,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.base,
    height: '100%',
  },
  error: {
    fontSize: typography.xs,
    marginTop: spacing.xs,
  },
});
