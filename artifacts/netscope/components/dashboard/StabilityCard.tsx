import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import GlassCard from '@/components/ui/GlassCard';
import PulsingDot from '@/components/ui/PulsingDot';
import { useTheme } from '@/contexts/ThemeContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { typography, spacing } from '@/constants/theme';

export default function StabilityCard() {
  const { theme } = useTheme();
  const { pingHistory, healthScore } = useNetwork();

  const jitter = healthScore?.stability ?? 100;
  const isStable = jitter >= 60;
  const dotColor = isStable ? theme.success : theme.error;
  const statusText = isStable ? 'Stable' : 'Unstable';

  const sparkPoints = pingHistory.slice(-10);
  const maxPing = Math.max(...sparkPoints, 100);
  const W = 120, H = 36;
  const pts = sparkPoints.map((p, i) => {
    const x = (i / Math.max(sparkPoints.length - 1, 1)) * W;
    const y = H - (p / maxPing) * H;
    return `${x},${y}`;
  }).join(' ');

  return (
    <GlassCard>
      <View style={styles.row}>
        <PulsingDot color={dotColor} size={8} />
        <Text style={[styles.status, { color: dotColor }]}>{statusText}</Text>
        {pingHistory.length > 0 && (
          <Text style={[styles.jitter, { color: theme.textMuted }]}>
            {pingHistory[pingHistory.length - 1]}ms
          </Text>
        )}
        <View style={styles.spark}>
          {sparkPoints.length > 1 && (
            <Svg width={W} height={H}>
              <Polyline points={pts} fill="none" stroke={dotColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          )}
        </View>
      </View>
      <Text style={[styles.label, { color: theme.textMuted }]}>Connection Stability</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  status: { fontSize: typography.base, fontWeight: typography.semibold },
  jitter: { fontSize: typography.sm },
  spark: { flex: 1, alignItems: 'flex-end' },
  label: { fontSize: typography.xs, marginTop: spacing.xs },
});
