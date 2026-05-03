import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withSpring } from 'react-native-reanimated';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import { useTheme } from '@/contexts/ThemeContext';
import { typography, spacing, radius } from '@/constants/theme';
import { LaptopIcon, SmartphoneIcon, TvIcon, RouterIcon, CpuIcon, HelpCircleIcon, ChevronDownIcon, ChevronUpIcon } from '@/components/icons/Icons';
import { NetworkDevice, DeviceType, TrustLevel } from '@/types';
import { setDeviceTrust } from '@/services/storageService';
import { useHaptics } from '@/hooks/useHaptics';

const TYPE_ICONS: Record<DeviceType, typeof LaptopIcon> = {
  router: RouterIcon, laptop: LaptopIcon, phone: SmartphoneIcon,
  smart_tv: TvIcon, iot: CpuIcon, unknown: HelpCircleIcon,
};
const TYPE_COLORS: Record<DeviceType, string> = {
  router: '#3B82F6', laptop: '#8B5CF6', phone: '#10B981',
  smart_tv: '#F59E0B', iot: '#06B6D4', unknown: '#EF4444',
};
const TRUST_VARIANTS: Record<TrustLevel, 'success' | 'warning' | 'error'> = {
  trusted: 'success', guest: 'warning', unknown: 'error',
};

export default function DeviceCard({ device, onUpdate }: { device: NetworkDevice; onUpdate?: () => void }) {
  const { theme } = useTheme();
  const { light } = useHaptics();
  const [expanded, setExpanded] = useState(false);
  const expandH = useSharedValue(0);

  const toggle = useCallback(() => {
    light();
    setExpanded(e => {
      expandH.value = withSpring(e ? 0 : 1, { stiffness: 200, damping: 20 });
      return !e;
    });
  }, []);

  const expandStyle = useAnimatedStyle(() => ({
    maxHeight: expandH.value * 200,
    overflow: 'hidden',
  }));

  const handleTrust = async (trust: TrustLevel) => {
    await setDeviceTrust(device.mac, trust);
    onUpdate?.();
  };

  const Icon = TYPE_ICONS[device.type] || HelpCircleIcon;
  const iconColor = TYPE_COLORS[device.type] || theme.textMuted;

  return (
    <GlassCard padded={false}>
      <TouchableOpacity onPress={toggle} style={styles.row}>
        <View style={[styles.iconBox, { backgroundColor: `${iconColor}20` }]}>
          <Icon size={20} color={iconColor} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.hostname, { color: theme.textPrimary }]} numberOfLines={1}>{device.hostname}</Text>
          <Text style={[styles.ip, { color: theme.textMuted }]}>{device.ip}</Text>
        </View>
        <View style={styles.right}>
          <Badge label={device.trust} variant={TRUST_VARIANTS[device.trust]} />
          <View style={[styles.dot, { backgroundColor: device.isOnline ? theme.success : theme.textMuted }]} />
          {expanded ? <ChevronUpIcon size={14} color={theme.textMuted} /> : <ChevronDownIcon size={14} color={theme.textMuted} />}
        </View>
      </TouchableOpacity>

      <Animated.View style={expandStyle}>
        <View style={[styles.expanded, { borderTopColor: theme.border }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>MAC</Text>
            <Text style={[styles.detailValue, { color: theme.textSecondary }]}>{device.mac}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Vendor</Text>
            <Text style={[styles.detailValue, { color: theme.textSecondary }]}>{device.vendor}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Signal</Text>
            <Text style={[styles.detailValue, { color: theme.textSecondary }]}>{device.signalStrength} dBm</Text>
          </View>
          {device.openPorts.length > 0 && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Open Ports</Text>
              <Text style={[styles.detailValue, { color: theme.warning }]}>{device.openPorts.join(', ')}</Text>
            </View>
          )}
          <View style={styles.trustRow}>
            {(['trusted', 'guest', 'unknown'] as TrustLevel[]).map(t => (
              <TouchableOpacity
                key={t}
                onPress={() => handleTrust(t)}
                style={[styles.trustBtn, device.trust === t && { backgroundColor: theme.primary }]}
              >
                <Text style={[styles.trustLabel, { color: device.trust === t ? '#FFF' : theme.textMuted }]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  hostname: { fontSize: typography.base, fontWeight: typography.semibold },
  ip: { fontSize: typography.xs, marginTop: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3 },
  expanded: { borderTopWidth: 1, padding: spacing.md, gap: spacing.sm },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontSize: typography.sm },
  detailValue: { fontSize: typography.sm, fontWeight: typography.medium },
  trustRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  trustBtn: { flex: 1, paddingVertical: spacing.xs, borderRadius: radius.sm, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  trustLabel: { fontSize: typography.xs, fontWeight: typography.semibold },
});
