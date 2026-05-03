import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import { useTheme } from '@/contexts/ThemeContext';
import { typography, spacing } from '@/constants/theme';
import {
  SmartphoneIcon, LaptopIcon, CpuIcon, HelpCircleIcon,
  ChevronDownIcon, ChevronUpIcon, BluetoothIcon,
} from '@/components/icons/Icons';
import { BluetoothDevice, BluetoothDeviceType } from '@/types';

const TYPE_ICONS: Record<BluetoothDeviceType, typeof SmartphoneIcon> = {
  phone:    SmartphoneIcon,
  audio:    BluetoothIcon,
  wearable: BluetoothIcon,
  laptop:   LaptopIcon,
  iot:      CpuIcon,
  unknown:  HelpCircleIcon,
};
const TYPE_COLORS: Record<BluetoothDeviceType, string> = {
  phone:    '#4F87FF',
  audio:    '#A855F7',
  wearable: '#00D4FF',
  laptop:   '#8B5CF6',
  iot:      '#06B6D4',
  unknown:  '#94A3B8',
};
const TYPE_LABELS: Record<BluetoothDeviceType, string> = {
  phone: 'Phone', audio: 'Audio', wearable: 'Wearable',
  laptop: 'Laptop', iot: 'IoT', unknown: 'Unknown',
};

function SignalBars({ rssi, color }: { rssi: number; color: string }) {
  const bars = rssi >= -55 ? 4 : rssi >= -65 ? 3 : rssi >= -75 ? 2 : 1;
  return (
    <View style={styles.bars}>
      {[1, 2, 3, 4].map(b => (
        <View
          key={b}
          style={[styles.bar, { height: 3 + b * 4, backgroundColor: b <= bars ? color : 'rgba(255,255,255,0.12)' }]}
        />
      ))}
    </View>
  );
}

export default function BluetoothCard({ device }: { device: BluetoothDevice }) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const expandH = useSharedValue(0);

  const toggle = () => {
    setExpanded(e => {
      expandH.value = withSpring(e ? 0 : 1, { stiffness: 200, damping: 20 });
      return !e;
    });
  };

  const expandStyle = useAnimatedStyle(() => ({
    maxHeight: expandH.value * 180,
    overflow: 'hidden',
  }));

  const Icon = TYPE_ICONS[device.type] || HelpCircleIcon;
  const iconColor = TYPE_COLORS[device.type] || theme.textMuted;
  const signalColor = device.rssi >= -60 ? theme.success : device.rssi >= -75 ? theme.warning : theme.error;

  return (
    <GlassCard padded={false} style={{ marginBottom: spacing.sm }}>
      <TouchableOpacity onPress={toggle} style={styles.row} activeOpacity={0.8}>
        <View style={[styles.iconBox, { backgroundColor: `${iconColor}20` }]}>
          <Icon size={20} color={iconColor} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>{device.name}</Text>
          <Text style={[styles.address, { color: theme.textMuted }]}>{device.address}</Text>
        </View>
        <View style={styles.right}>
          <SignalBars rssi={device.rssi} color={signalColor} />
          <Badge label={TYPE_LABELS[device.type]} variant="info" />
          {expanded
            ? <ChevronUpIcon size={13} color={theme.textMuted} />
            : <ChevronDownIcon size={13} color={theme.textMuted} />
          }
        </View>
      </TouchableOpacity>

      <Animated.View style={expandStyle}>
        <View style={[styles.expanded, { borderTopColor: theme.border }]}>
          <View style={styles.grid}>
            <Detail label="Address" value={device.address} />
            <Detail label="RSSI" value={`${device.rssi} dBm`} />
            <Detail label="Manufacturer" value={device.manufacturer} />
            <Detail label="Service Class" value={device.serviceClass || '—'} />
            <Detail label="Status" value={device.isPaired ? 'Paired' : 'Discovered'} />
            <Detail label="Type" value={TYPE_LABELS[device.type]} />
          </View>
          <View style={[styles.pairedBadge, {
            backgroundColor: device.isPaired ? `${theme.success}15` : `${theme.textMuted}10`,
            borderColor: device.isPaired ? theme.success : theme.border,
          }]}>
            <View style={[styles.dot, { backgroundColor: device.isPaired ? theme.success : theme.textMuted }]} />
            <Text style={[styles.pairedText, { color: device.isPaired ? theme.success : theme.textMuted }]}>
              {device.isPaired ? 'Paired with this device' : 'Not paired'}
            </Text>
          </View>
        </View>
      </Animated.View>
    </GlassCard>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.detail}>
      <Text style={[styles.detailLabel, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: theme.textSecondary }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontSize: typography.base, fontWeight: typography.semibold },
  address: { fontSize: 11, marginTop: 1, fontFamily: 'monospace' },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  bar: { width: 3, borderRadius: 2 },
  expanded: { borderTopWidth: 1, padding: spacing.md, gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  detail: { width: '47%' },
  detailLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 1 },
  detailValue: { fontSize: typography.sm, fontWeight: '500' },
  pairedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: 8, borderWidth: 1, marginTop: spacing.xs,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  pairedText: { fontSize: typography.xs, fontWeight: '600' },
});
