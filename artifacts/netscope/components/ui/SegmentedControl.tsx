import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useHaptics } from '@/hooks/useHaptics';
import { typography, spacing, radius } from '@/constants/theme';

interface SegmentedControlProps {
  options: string[];
  selected: number;
  onChange: (index: number) => void;
}

export default function SegmentedControl({ options, selected, onChange }: SegmentedControlProps) {
  const { theme } = useTheme();
  const { light } = useHaptics();

  return (
    <View style={[styles.container, { backgroundColor: theme.bgInput, borderColor: theme.border }]}>
      {options.map((opt, i) => {
        const isSelected = i === selected;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => { light(); onChange(i); }}
            style={[
              styles.option,
              isSelected && { backgroundColor: theme.primary, borderRadius: radius.md },
            ]}
          >
            <Text style={[
              styles.label,
              { color: isSelected ? '#FFFFFF' : theme.textMuted },
            ]}>
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radius.md + 2,
    borderWidth: 1,
    padding: 3,
  },
  option: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },
});
