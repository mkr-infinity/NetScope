import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { typography, spacing, radius } from '@/constants/theme';
import { ArrowLeftIcon, ActivityIcon, ZapIcon, TrendingUpIcon, TrendingDownIcon, ShieldIcon } from '@/components/icons/Icons';
import ToolLearnCard from '@/components/ui/ToolLearnCard';

const HOSTS = [
  { name: 'Cloudflare 1.1.1.1', url: 'https://1.1.1.1', desc: 'Privacy-first anycast DNS' },
  { name: 'Google 8.8.8.8', url: 'https://8.8.8.8', desc: 'Global redundant DNS' },
  { name: 'Quad9 9.9.9.9', url: 'https://9.9.9.9', desc: 'Security-filtered DNS' },
];

async function probeHost(url: string): Promise<{ success: boolean; ms: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  const start = Date.now();
  try {
    await fetch(url, { method: 'HEAD', mode: 'no-cors', cache: 'no-store', signal: controller.signal });
    clearTimeout(timer);
    return { success: true, ms: Date.now() - start };
  } catch {
    return { success: false, ms: Date.now() - start };
  }
}

interface SampleResult { success: boolean; ms: number; }
interface HostResult { name: string; desc: string; samples: SampleResult[]; }

function LossChart({ samples }: { samples: SampleResult[] }) {
  const { theme } = useTheme();
  if (samples.length < 2) return null;
  const W = 280; const H = 60; const pad = 8;
  const maxMs = Math.max(...samples.map(s => s.ms), 100);
  const points = samples.map((s, i) => {
    const x = pad + (i / (samples.length - 1)) * (W - pad * 2);
    const y = s.success ? pad + (1 - Math.min(s.ms / maxMs, 1)) * (H - pad * 2) : H - pad;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const pathD = `M ${points.replace(/ /g, ' L ')}`;
  return (
    <Svg width={W} height={H} style={{ marginTop: spacing.sm }}>
      <Path d={pathD} stroke={theme.primary} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
      {samples.map((s, i) => {
        const x = pad + (i / (samples.length - 1)) * (W - pad * 2);
        const y = s.success ? pad + (1 - Math.min(s.ms / maxMs, 1)) * (H - pad * 2) : H - pad;
        return <Circle key={i} cx={x} cy={y} r={3} fill={s.success ? theme.success : theme.error} />;
      })}
    </Svg>
  );
}

const LEARN_SECTIONS = [
  {
    title: 'What is Packet Loss?',
    color: '#4F87FF',
    items: [
      'Percentage of data packets that fail to reach their destination',
      'Each "packet" is a chunk of data (typically 1,500 bytes) traveling the network',
      'NetScope probes 3 DNS servers with 10 rounds each (30 total probes)',
      'Loss is caused by congestion, hardware failure, Wi-Fi interference, or ISP issues',
      'Industry standard: 0% is the goal for any production network',
    ],
  },
  {
    title: 'Impact on Applications',
    color: '#FF5C5C',
    items: [
      '0%: perfect — all traffic delivers reliably',
      '1%: subtle VoIP audio artifacts, occasional gaming hitches',
      '3%: video calls become choppy; VoIP essentially broken',
      '5%: HTTP streaming buffers constantly; file downloads stall',
      '10%+: connection functionally unusable for real-time apps',
      '>20%: even basic web browsing fails or times out',
    ],
  },
  {
    title: 'Probe Targets Explained',
    color: '#00E5A0',
    items: [
      '1.1.1.1 (Cloudflare): anycast — routes to nearest datacenter worldwide',
      '8.8.8.8 (Google): globally distributed, backed by Google infrastructure',
      '9.9.9.9 (Quad9): security-focused — blocks malware/phishing domains',
      'Testing all 3 isolates whether loss is local (all fail) vs route-specific',
      'If only one target loses packets, issue is with that specific path',
    ],
  },
  {
    title: 'Diagnosing & Fixing',
    color: '#FFBE5C',
    items: [
      'High loss on all targets: likely your router, modem, or ISP line',
      'Loss only on Wi-Fi: interference — change channel (1/6/11 on 2.4GHz)',
      'Loss only on one target: that server or its upstream path is congested',
      'Fix: reboot router/modem, replace ethernet cable, upgrade firmware',
      'Report persistent loss (>3%) to your ISP with test data as evidence',
    ],
  },
];

export default function PacketLoss() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<HostResult[]>([]);
  const [totalSent, setTotalSent] = useState(0);
  const paddingTop = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const run = useCallback(async () => {
    if (running) return;
    setRunning(true); setResults([]); setTotalSent(0);
    const ROUNDS = 10;
    const hostResults: HostResult[] = HOSTS.map(h => ({ name: h.name, desc: h.desc, samples: [] }));
    setResults([...hostResults]);
    for (let i = 0; i < ROUNDS; i++) {
      await Promise.all(HOSTS.map(async (h, hi) => {
        const result = await probeHost(h.url);
        hostResults[hi].samples.push(result);
      }));
      setResults(hostResults.map(r => ({ ...r, samples: [...r.samples] })));
      setTotalSent(i + 1);
      if (i < ROUNDS - 1) await new Promise(r => setTimeout(r, 500));
    }
    setRunning(false);
  }, [running]);

  const overallLoss = results.length > 0
    ? Math.round(results.reduce((sum, hr) => {
        if (hr.samples.length === 0) return sum;
        return sum + ((hr.samples.length - hr.samples.filter(s => s.success).length) / hr.samples.length) * 100;
      }, 0) / results.length)
    : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <LinearGradient colors={theme.gradientBg as [string, string, string]} style={StyleSheet.absoluteFill} />
      <View style={[styles.header, { paddingTop: paddingTop + spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <ArrowLeftIcon size={18} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Packet Loss</Text>
          <Text style={[styles.pageSub, { color: theme.textMuted }]}>10 probes · 3 DNS servers · real-time graph</Text>
        </View>
        <ToolLearnCard tool="Packet Loss" tagline="Network reliability · probe analysis · diagnostics" sections={LEARN_SECTIONS} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]} showsVerticalScrollIndicator={false}>

        {overallLoss !== null && !running && (
          <LinearGradient
            colors={overallLoss === 0 ? [`${theme.success}15`, `${theme.success}05`] as [string, string] : [`${theme.error}15`, `${theme.error}05`] as [string, string]}
            style={[styles.overallBanner, { borderColor: overallLoss === 0 ? `${theme.success}30` : `${theme.error}30` }]}
          >
            <ShieldIcon size={20} color={overallLoss === 0 ? theme.success : overallLoss < 10 ? theme.warning : theme.error} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.overallValue, { color: overallLoss === 0 ? theme.success : theme.error }]}>
                {overallLoss}% average loss
              </Text>
              <Text style={[styles.overallSub, { color: theme.textSecondary }]}>
                {overallLoss === 0 ? 'Perfect connectivity across all probe targets'
                  : overallLoss < 5 ? 'Minor packet loss — monitor and retest'
                  : overallLoss < 15 ? 'Significant loss — check router and ISP'
                  : 'Severe packet loss — network is degraded'}
              </Text>
            </View>
          </LinearGradient>
        )}

        {results.map((hr) => {
          const successful = hr.samples.filter(s => s.success);
          const lossRate = hr.samples.length > 0 ? ((hr.samples.length - successful.length) / hr.samples.length) * 100 : 0;
          const avgMs = successful.length > 0 ? Math.round(successful.reduce((a, b) => a + b.ms, 0) / successful.length) : 0;
          const color = lossRate === 0 ? theme.success : lossRate < 20 ? theme.warning : theme.error;
          return (
            <View key={hr.name} style={[styles.hostCard, { backgroundColor: theme.bgSurface, borderColor: `${color}20` }]}>
              <LinearGradient colors={[`${color}08`, 'transparent'] as [string, string]} style={[StyleSheet.absoluteFill, { borderRadius: radius.xl }]} />
              <View style={styles.hostHeader}>
                <View style={[styles.hostBadge, { backgroundColor: `${color}18` }]}>
                  <ActivityIcon size={16} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.hostName, { color: theme.textPrimary }]}>{hr.name}</Text>
                  <Text style={[styles.hostDesc, { color: theme.textMuted }]}>{hr.desc}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.lossRate, { color }]}>{lossRate.toFixed(0)}% loss</Text>
                  {avgMs > 0 && <Text style={[styles.avgMs, { color: theme.textMuted }]}>{avgMs}ms avg</Text>}
                </View>
              </View>
              <LossChart samples={hr.samples} />
              <View style={styles.samplesRow}>
                {hr.samples.map((s, i) => (
                  <View key={i} style={[styles.sampleDot, { backgroundColor: s.success ? theme.success : theme.error }]} />
                ))}
              </View>
            </View>
          );
        })}

        {results.length === 0 && !running && (
          <View style={[styles.emptyCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <TrendingUpIcon size={40} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Ready to Test</Text>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>Sends 10 probes to Cloudflare, Google, and Quad9 DNS servers. Results are visualized in real-time.</Text>
          </View>
        )}

        {running && (
          <View style={[styles.progressCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
              <Text style={[styles.configLabel, { color: theme.textMuted }]}>PROBING HOSTS...</Text>
              <Text style={[styles.configLabel, { color: theme.primary }]}>{totalSent}/10 rounds</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: theme.bgInput }]}>
              <LinearGradient colors={[theme.primary, theme.accent] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressFill, { width: `${(totalSent / 10) * 100}%` as any }]} />
            </View>
          </View>
        )}

        <TouchableOpacity onPress={run} disabled={running} activeOpacity={0.85}>
          <LinearGradient
            colors={!running ? [theme.primary, theme.accent] as [string, string] : ['#333', '#555'] as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.runBtn}
          >
            <ActivityIcon size={18} color="#FFFFFF" />
            <Text style={styles.runBtnText}>{running ? 'Running...' : results.length > 0 ? 'Run Again' : 'Start Test'}</Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  pageTitle: { fontSize: typography.lg, fontWeight: typography.bold },
  pageSub: { fontSize: typography.xs, marginTop: 1 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  overallBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  overallValue: { fontSize: typography.md, fontWeight: typography.black },
  overallSub: { fontSize: 11, marginTop: 2, lineHeight: 16 },
  hostCard: { borderRadius: radius.xl, borderWidth: 1, padding: spacing.md, gap: spacing.sm, overflow: 'hidden' },
  hostHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  hostBadge: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  hostName: { fontSize: typography.sm, fontWeight: typography.bold },
  hostDesc: { fontSize: 10, marginTop: 2 },
  lossRate: { fontSize: typography.sm, fontWeight: typography.bold },
  avgMs: { fontSize: 11, marginTop: 1 },
  samplesRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  sampleDot: { width: 10, height: 10, borderRadius: 5 },
  emptyCard: { borderRadius: radius.xl, borderWidth: 1, padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  emptyTitle: { fontSize: typography.md, fontWeight: typography.bold },
  emptyText: { fontSize: typography.sm, textAlign: 'center', lineHeight: 20 },
  progressCard: { borderRadius: radius.xl, borderWidth: 1, padding: spacing.md },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  configLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  runBtn: { height: 54, borderRadius: radius.full, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  runBtnText: { color: '#FFFFFF', fontSize: typography.base, fontWeight: typography.bold },
});
