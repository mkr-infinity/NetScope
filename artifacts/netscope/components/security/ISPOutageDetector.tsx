import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { typography, spacing } from '@/constants/theme';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@/components/icons/Icons';
import { checkISPOutage } from '@/services/networkService';

type LayerStatus = 'idle' | 'checking' | 'pass' | 'fail';

const LAYERS = [
  { label: 'WiFi → Router', desc: 'Local gateway reachability' },
  { label: 'Router → ISP',  desc: 'ISP DNS connectivity' },
  { label: 'ISP → Internet',desc: 'Internet access check' },
  { label: 'CDN Reachability', desc: '1.1.1.1 availability' },
];

function LayerRow({ status, label, desc }: { status: LayerStatus; label: string; desc: string }) {
  const { theme } = useTheme();
  const Icon = status === 'pass' ? CheckCircleIcon : status === 'fail' ? XCircleIcon : ClockIcon;
  const color = status === 'pass' ? theme.success : status === 'fail' ? theme.error : theme.textMuted;

  return (
    <View style={styles.layerRow}>
      <Icon size={18} color={color} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.layerLabel, { color: theme.textPrimary }]}>{label}</Text>
        <Text style={[styles.layerDesc, { color: theme.textMuted }]}>{desc}</Text>
      </View>
    </View>
  );
}

export default function ISPOutageDetector() {
  const { theme } = useTheme();
  const { networkInfo } = useNetwork();
  const [running, setRunning] = useState(false);
  const [layers, setLayers] = useState<LayerStatus[]>(['idle', 'idle', 'idle', 'idle']);
  const [verdict, setVerdict] = useState<string | null>(null);

  const runCheck = useCallback(async () => {
    setRunning(true);
    setVerdict(null);
    setLayers(['checking', 'idle', 'idle', 'idle']);

    const gateway = networkInfo?.gateway || '192.168.1.1';
    const result = await checkISPOutage(gateway);

    setLayers([
      result.layer1 ? 'pass' : 'fail',
      result.layer2 ? 'pass' : 'fail',
      result.layer3 ? 'pass' : 'fail',
      result.layer4 ? 'pass' : 'fail',
    ]);
    setVerdict(result.message);
    setRunning(false);
  }, [networkInfo]);

  return (
    <GlassCard>
      <Text style={[styles.title, { color: theme.textPrimary }]}>ISP Outage Detector</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>4-layer network diagnosis</Text>

      <View style={styles.layers}>
        {LAYERS.map((l, i) => <LayerRow key={l.label} status={layers[i]} label={l.label} desc={l.desc} />)}
      </View>

      {verdict && (
        <View style={[styles.verdict, { backgroundColor: theme.bgInput, borderColor: theme.border }]}>
          <Text style={[styles.verdictText, { color: theme.textPrimary }]}>{verdict}</Text>
        </View>
      )}

      <GlassButton title={running ? 'Diagnosing...' : 'Diagnose Connection'} onPress={runCheck} loading={running} style={{ marginTop: spacing.md }} />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: typography.md, fontWeight: typography.semibold },
  subtitle: { fontSize: typography.sm, marginTop: 2, marginBottom: spacing.md },
  layers: { gap: spacing.md },
  layerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  layerLabel: { fontSize: typography.sm, fontWeight: typography.medium },
  layerDesc: { fontSize: typography.xs },
  verdict: { borderRadius: 10, borderWidth: 1, padding: spacing.md, marginTop: spacing.md },
  verdictText: { fontSize: typography.sm, lineHeight: 20 },
});
