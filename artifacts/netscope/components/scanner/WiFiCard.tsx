import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import { useTheme } from '@/contexts/ThemeContext';
import { typography, spacing } from '@/constants/theme';
import { WifiIcon, ChevronDownIcon, ChevronUpIcon, ShieldIcon } from '@/components/icons/Icons';
import { WiFiNetwork } from '@/types';

function SignalBars({ rssi, color }: { rssi: number; color: string }) {
  const bars = rssi >= -50 ? 4 : rssi >= -65 ? 3 : rssi >= -75 ? 2 : 1;
  return (
    <View style={styles.bars}>
      {[1, 2, 3, 4].map(b => (
        <View
          key={b}
          style={[styles.bar, { height: 4 + b * 4, backgroundColor: b <= bars ? color : 'rgba(255,255,255,0.15)' }]}
        />
      ))}
    </View>
  );
}

const SECURITY_VARIANTS: Record<WiFiNetwork['security'], 'success' | 'info' | 'warning' | 'error'> = {
  WPA3: 'success', WPA2: 'info', WPA: 'warning', WEP: 'error', Open: 'error',
};

const SECURITY_DESC: Record<WiFiNetwork['security'], string> = {
  WPA3: 'WPA3 — Latest standard, highly secure',
  WPA2: 'WPA2 — Strong encryption (CCMP/AES)',
  WPA:  'WPA — Older standard, moderate security',
  WEP:  'WEP — Deprecated, easily cracked',
  Open: 'Open — No encryption, avoid if possible',
};

function getSpeedClass(rssi: number, freq: string): string {
  if (freq === '5GHz') {
    if (rssi >= -50) return 'Very Fast (AC/AX)';
    if (rssi >= -65) return 'Fast (AC)';
    return 'Moderate (AC)';
  }
  if (rssi >= -50) return 'Good (N300+)';
  if (rssi >= -65) return 'Moderate (N150)';
  return 'Slow (N)';
}

export default function WiFiCard({ network }: { network: WiFiNetwork }) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const expandH = useSharedValue(0);

  const toggle = () => {
    setExpanded(e => {
      expandH.value = withSpring(e ? 0 : 1, { stiffness: 200, damping: 20 });
      return !e;
    });
  };

  const signalColor = network.rssi >= -55 ? theme.success : network.rssi >= -70 ? theme.warning : theme.error;
  const borderColor = network.isConnected ? theme.primary : theme.glassBorder;

  const expandStyle = useAnimatedStyle(() => ({
    maxHeight: expandH.value * 280,
    overflow: 'hidden',
  }));

  const signalQuality = network.rssi >= -50 ? 'Excellent' : network.rssi >= -65 ? 'Good' : network.rssi >= -75 ? 'Fair' : 'Poor';

  return (
    <GlassCard style={{ borderColor }} padded={false}>
      <TouchableOpacity onPress={toggle} style={styles.row} activeOpacity={0.8}>
        <SignalBars rssi={network.rssi} color={signalColor} />
        <View style={styles.info}>
          {network.isHidden
            ? <Text style={[styles.ssid, { color: theme.textMuted, fontStyle: 'italic' }]}>Hidden Network</Text>
            : <Text style={[styles.ssid, { color: theme.textPrimary }]}>{network.ssid}</Text>
          }
          <View style={styles.meta}>
            <Text style={[styles.metaItem, { color: theme.textMuted }]}>{network.frequency}</Text>
            {network.channel > 0 && (
              <Text style={[styles.metaItem, { color: theme.textMuted }]}>CH {network.channel}</Text>
            )}
            <Text style={[styles.metaItem, { color: signalColor }]}>{network.rssi} dBm</Text>
          </View>
        </View>
        <View style={styles.badges}>
          <Badge label={network.security} variant={SECURITY_VARIANTS[network.security]} />
          {network.isConnected && <Badge label="Connected" variant="primary" />}
          {expanded
            ? <ChevronUpIcon size={13} color={theme.textMuted} />
            : <ChevronDownIcon size={13} color={theme.textMuted} />
          }
        </View>
      </TouchableOpacity>

      <Animated.View style={expandStyle}>
        <View style={[styles.expanded, { borderTopColor: theme.border }]}>
          <View style={styles.grid}>
            <Detail label="SSID" value={network.ssid || '—'} />
            <Detail label="BSSID / MAC" value={network.bssid || '—'} mono />
            <Detail label="Signal Strength" value={`${network.rssi} dBm (${signalQuality})`} color={signalColor} />
            <Detail label="Frequency Band" value={network.frequency} />
            <Detail label="Channel" value={network.channel > 0 ? String(network.channel) : 'Unknown'} />
            <Detail label="Speed Class" value={getSpeedClass(network.rssi, network.frequency)} />
            {network.linkSpeed && (
              <Detail label="Link Speed" value={`${network.linkSpeed} Mbps`} />
            )}
            <Detail label="Network Type" value={network.isHidden ? 'Hidden SSID' : 'Broadcast SSID'} />
          </View>

          <View style={[styles.secRow, {
            backgroundColor: SECURITY_VARIANTS[network.security] === 'success'
              ? `${theme.success}12` : SECURITY_VARIANTS[network.security] === 'error'
              ? `${theme.error}12` : `${theme.primary}10`,
            borderColor: SECURITY_VARIANTS[network.security] === 'success'
              ? theme.success : SECURITY_VARIANTS[network.security] === 'error'
              ? theme.error : theme.primary,
          }]}>
            <ShieldIcon size={14} color={
              SECURITY_VARIANTS[network.security] === 'success' ? theme.success
              : SECURITY_VARIANTS[network.security] === 'error' ? theme.error : theme.primary
            } />
            <Text style={[styles.secText, { color: theme.textSecondary }]}>
              {SECURITY_DESC[network.security]}
            </Text>
          </View>

          {network.isConnected && (
            <View style={[styles.connectedRow, { backgroundColor: `${theme.success}10`, borderColor: theme.success }]}>
              <WifiIcon size={13} color={theme.success} />
              <Text style={[styles.connectedText, { color: theme.success }]}>
                You are connected to this network
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </GlassCard>
  );
}

function Detail({ label, value, mono, color }: {
  label: string; value: string; mono?: boolean; color?: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.detail}>
      <Text style={[styles.detailLabel, { color: theme.textMuted }]}>{label}</Text>
      <Text
        style={[styles.detailValue, {
          color: color || theme.textSecondary,
          fontFamily: mono ? 'monospace' : undefined,
          fontSize: mono ? 10 : typography.sm,
        }]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, width: 22 },
  bar: { width: 4, borderRadius: 2 },
  info: { flex: 1 },
  ssid: { fontSize: typography.base, fontWeight: typography.semibold },
  meta: { flexDirection: 'row', gap: spacing.sm, marginTop: 2 },
  metaItem: { fontSize: typography.xs },
  badges: { gap: 4, alignItems: 'flex-end', flexDirection: 'column' },
  expanded: { borderTopWidth: 1, padding: spacing.md, gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  detail: { width: '47%' },
  detailLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 1 },
  detailValue: { fontSize: typography.sm, fontWeight: '500' },
  secRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    padding: spacing.sm, borderRadius: 8, borderWidth: 1,
  },
  secText: { flex: 1, fontSize: typography.xs, lineHeight: 16 },
  connectedRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.sm, borderRadius: 8, borderWidth: 1,
  },
  connectedText: { fontSize: typography.xs, fontWeight: '600' },
});
