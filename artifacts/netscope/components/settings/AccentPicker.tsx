import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { accentPresets, AccentKey, typography, spacing, radius } from '@/constants/theme';
import { CheckCircleIcon } from '@/components/icons/Icons';

export default function AccentPicker() {
  const { theme, accent, setAccent } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>Accent Color</Text>
      <View style={styles.swatches}>
        {(Object.keys(accentPresets) as AccentKey[]).map(key => {
          const color = accentPresets[key].primary;
          const selected = accent === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setAccent(key)}
              style={[styles.swatch, { backgroundColor: color, borderWidth: selected ? 3 : 0, borderColor: '#FFFFFF' }]}
            >
              {selected && <CheckCircleIcon size={14} color="#FFFFFF" />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  label: { fontSize: typography.sm, marginBottom: spacing.sm },
  swatches: { flexDirection: 'row', gap: spacing.md },
  swatch: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
