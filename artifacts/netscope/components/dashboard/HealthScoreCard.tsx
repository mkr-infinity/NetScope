import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GlassCard from '@/components/ui/GlassCard';
import ProgressRing from '@/components/ui/ProgressRing';
import { useTheme } from '@/contexts/ThemeContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { typography, spacing } from '@/constants/theme';

export default function HealthScoreCard() {
  const { theme } = useTheme();
  const { healthScore } = useNetwork();

  const score = healthScore?.total ?? 0;
  const grade = healthScore?.grade ?? 'Poor';
  const subs = healthScore ? [
    { label: 'Signal',    value: healthScore.signal    },
    { label: 'Latency',   value: healthScore.latency   },
    { label: 'Security',  value: healthScore.security  },
    { label: 'Devices',   value: healthScore.devices   },
    { label: 'Stability', value: healthScore.stability },
  ] : [];

  const ringColor = score >= 80 ? theme.success : score >= 60 ? theme.primary : score >= 40 ? theme.warning : theme.error;

  return (
    <GlassCard>
      <View style={styles.ringRow}>
        <ProgressRing size={130} strokeWidth={10} progress={score} color={ringColor}>
          <View style={styles.scoreCenter}>
            <Text style={[styles.scoreNum, { color: theme.textPrimary }]}>{score}</Text>
            <Text style={[styles.grade, { color: ringColor }]}>{grade}</Text>
          </View>
        </ProgressRing>
        <View style={styles.legend}>
          <Text style={[styles.legendTitle, { color: theme.textSecondary }]}>Network Health</Text>
          <Text style={[styles.legendSub, { color: theme.textMuted }]}>Live score</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.subScores}>
        {subs.map(sub => (
          <View key={sub.label} style={styles.subRow}>
            <Text style={[styles.subLabel, { color: theme.textSecondary }]}>{sub.label}</Text>
            <View style={[styles.barBg, { backgroundColor: theme.bgInput }]}>
              <View style={[styles.barFill, {
                width: `${sub.value}%` as any,
                backgroundColor: sub.value >= 70 ? theme.success : sub.value >= 40 ? theme.warning : theme.error,
              }]} />
            </View>
            <Text style={[styles.subValue, { color: theme.textMuted }]}>{sub.value}</Text>
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
  scoreCenter: { alignItems: 'center' },
  scoreNum: { fontSize: typography.display, fontWeight: typography.bold },
  grade: { fontSize: typography.sm, fontWeight: typography.semibold, marginTop: -4 },
  legend: { flex: 1 },
  legendTitle: { fontSize: typography.lg, fontWeight: typography.semibold },
  legendSub: { fontSize: typography.sm, marginTop: spacing.xs },
  divider: { height: 1, marginVertical: spacing.md },
  subScores: { gap: spacing.sm },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  subLabel: { width: 68, fontSize: typography.sm },
  barBg: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  subValue: { width: 28, fontSize: typography.xs, textAlign: 'right' },
});
