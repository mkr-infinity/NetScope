import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import GlassCard from '@/components/ui/GlassCard';
import { useTheme } from '@/contexts/ThemeContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { typography, spacing } from '@/constants/theme';
import { LaptopIcon, SmartphoneIcon, TvIcon, RouterIcon, CpuIcon, HelpCircleIcon } from '@/components/icons/Icons';
import { DeviceType } from '@/types';

const TYPE_ICONS: Record<DeviceType, typeof LaptopIcon> = {
  router: RouterIcon,
  laptop: LaptopIcon,
  phone: SmartphoneIcon,
  smart_tv: TvIcon,
  iot: CpuIcon,
  unknown: HelpCircleIcon,
};

export default function DeviceCountCard({ onPress }: { onPress: () => void }) {
  const { theme } = useTheme();
  const { devices } = useNetwork();

  const typeCounts: Partial<Record<DeviceType, number>> = {};
  devices.forEach(d => {
    typeCounts[d.type] = (typeCounts[d.type] || 0) + 1;
  });

  return (
    <GlassCard onPress={onPress}>
      <View style={styles.row}>
        <View>
          <Text style={[styles.count, { color: theme.textPrimary }]}>{devices.length}</Text>
          <Text style={[styles.label, { color: theme.textMuted }]}>devices on network</Text>
        </View>
        <View style={styles.icons}>
          {(Object.entries(typeCounts) as [DeviceType, number][]).slice(0, 5).map(([type, count]) => {
            const Icon = TYPE_ICONS[type] || HelpCircleIcon;
            return (
              <View key={type} style={styles.iconItem}>
                <Icon size={18} color={theme.textSecondary} />
                <Text style={[styles.iconCount, { color: theme.textMuted }]}>{count}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  count: { fontSize: typography.xxl, fontWeight: typography.bold },
  label: { fontSize: typography.xs, marginTop: -2 },
  icons: { flexDirection: 'row', gap: spacing.md },
  iconItem: { alignItems: 'center', gap: 2 },
  iconCount: { fontSize: typography.xs },
});
