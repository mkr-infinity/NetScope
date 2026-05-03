import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { typography, spacing, radius } from '@/constants/theme';
import { ArrowLeftIcon, ZapIcon, ActivityIcon, ClockIcon } from '@/components/icons/Icons';
import ToolLearnCard from '@/components/ui/ToolLearnCard';

interface PingResult {
  seq: number;
  ms: number | null;
  status: 'ok' | 'timeout' | 'error';
}

async function doPing(host: string, timeoutMs = 3000): Promise<number | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url = host.startsWith('http') ? host : `https://${host}`;
    const start = Date.now();
    await fetch(url, { method: 'HEAD', mode: 'no-cors', cache: 'no-store', signal: controller.signal });
    return Date.now() - start;
  } catch { return null; }
  finally { clearTimeout(timer); }
}

function PingBar({ result, max }: { result: PingResult; max: number }) {
  const { theme } = useTheme();
  const pct = result.ms !== null ? Math.min(result.ms / max, 1) : 1;
  const color = result.status !== 'ok' ? theme.error : result.ms! < 50 ? theme.success : result.ms! < 150 ? theme.warning : theme.error;
  return (
    <View style={[styles.pingBarRow, { borderBottomColor: theme.border }]}>
      <Text style={[styles.pingSeq, { color: theme.textMuted }]}>#{result.seq}</Text>
      <View style={[styles.pingBarTrack, { backgroundColor: theme.bgInput }]}>
        <View style={[styles.pingBarFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.pingMs, { color: result.status === 'ok' ? color : theme.error }]}>
        {result.status === 'ok' ? `${result.ms}ms` : 'timeout'}
      </Text>
    </View>
  );
}

function getLatencyRating(ms: number | null) {
  if (ms === null) return { label: '—', color: '#7C96CC' };
  if (ms < 20) return { label: 'Excellent', color: '#00E5A0' };
  if (ms < 50) return { label: 'Good', color: '#4F87FF' };
  if (ms < 100) return { label: 'Fair', color: '#FFBE5C' };
  if (ms < 200) return { label: 'Poor', color: '#FF8C5C' };
  return { label: 'Bad', color: '#FF5C5C' };
}

const LEARN_SECTIONS = [
  {
    title: 'How Ping Works',
    color: '#4F87FF',
    items: [
      'Traditional ping uses ICMP (Internet Control Message Protocol) echo requests',
      'NetScope uses HTTP HEAD probes — works without root/admin privileges',
      'Measures round-trip time (RTT): time for packet to travel there and back',
      'Average (Avg), minimum (Min), maximum (Max) computed from all probes',
      'Jitter = standard deviation of RTT samples — measures consistency',
    ],
  },
  {
    title: 'Latency Quality Scale',
    color: '#00E5A0',
    items: [
      '<20ms: Excellent — LAN or fiber, imperceptible for any use case',
      '20–50ms: Good — typical broadband, great for gaming & video calls',
      '50–100ms: Acceptable — VPN overhead or regional routing',
      '100–200ms: Poor — noticeable delay in real-time communication',
      '>200ms: Bad — satellite or severely congested link',
    ],
  },
  {
    title: 'Packet Loss Impact',
    color: '#FFBE5C',
    items: [
      '0% loss: perfect — every probe reached the destination',
      '1–3%: noticeable in VoIP calls (audio glitches, robotic voice)',
      '3–10%: video calls freeze, gaming becomes unplayable',
      '>10%: connection functionally broken for real-time applications',
      'Causes: Wi-Fi interference, ISP congestion, hardware failure',
    ],
  },
  {
    title: 'Jitter & Network Stability',
    color: '#A855F7',
    items: [
      'Jitter: variation between consecutive ping values',
      'Ideal jitter: <10ms for real-time apps (VoIP, gaming, Zoom)',
      'High jitter symptom: voice calls sound choppy or robotic',
      'Fix high jitter: prioritize traffic with QoS, switch to 5GHz Wi-Fi',
      'Wired Ethernet virtually eliminates jitter vs Wi-Fi',
    ],
  },
];

export default function PingTool() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [host, setHost] = useState('google.com');
  const [count, setCount] = useState(8);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<PingResult[]>([]);
  const paddingTop = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const run = useCallback(async () => {
    if (running) return;
    setRunning(true); setResults([]);
    for (let i = 1; i <= count; i++) {
      const ms = await doPing(host);
      setResults(prev => [...prev, { seq: i, ms, status: ms !== null ? 'ok' : 'timeout' }]);
      if (i < count) await new Promise(r => setTimeout(r, 400));
    }
    setRunning(false);
  }, [host, count, running]);

  const successes = results.filter(r => r.status === 'ok');
  const avg = successes.length ? Math.round(successes.reduce((a, b) => a + (b.ms ?? 0), 0) / successes.length) : null;
  const min = successes.length ? Math.min(...successes.map(r => r.ms!)) : null;
  const maxMs = successes.length ? Math.max(...successes.map(r => r.ms!)) : null;
  const loss = results.length ? Math.round(((results.length - successes.length) / results.length) * 100) : 0;
  const barMax = maxMs ? Math.max(maxMs * 1.2, 100) : 500;
  const rating = getLatencyRating(avg);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <LinearGradient colors={theme.gradientBg as [string, string, string]} style={StyleSheet.absoluteFill} />
      <View style={[styles.header, { paddingTop: paddingTop + spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <ArrowLeftIcon size={18} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Ping Test</Text>
          <Text style={[styles.pageSub, { color: theme.textMuted }]}>Measure host latency · HTTP HEAD probe</Text>
        </View>
        <ToolLearnCard tool="Ping Test" tagline="RTT measurement · packet loss · jitter analysis" sections={LEARN_SECTIONS} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]} showsVerticalScrollIndicator={false}>

        <View style={[styles.configCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <Text style={[styles.configLabel, { color: theme.textMuted }]}>HOST / IP</Text>
          <TextInput
            value={host}
            onChangeText={setHost}
            style={[styles.hostInput, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.bgInput }]}
            placeholder="e.g. google.com or 8.8.8.8"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="none" autoCorrect={false}
          />
          <View style={styles.countRow}>
            <Text style={[styles.configLabel, { color: theme.textMuted }]}>PACKETS</Text>
            <View style={styles.countBtns}>
              {[4, 8, 16].map(n => (
                <TouchableOpacity key={n} onPress={() => setCount(n)}
                  style={[styles.countBtn, { borderColor: count === n ? theme.primary : theme.border, backgroundColor: count === n ? `${theme.primary}20` : 'transparent' }]}>
                  <Text style={[styles.countBtnText, { color: count === n ? theme.primary : theme.textMuted }]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {results.length > 0 && (
          <>
            {/* Quality banner */}
            <LinearGradient
              colors={[`${rating.color}18`, `${rating.color}08`] as [string, string]}
              style={[styles.ratingBanner, { borderColor: `${rating.color}30` }]}
            >
              <View style={[styles.ratingDot, { backgroundColor: rating.color, shadowColor: rating.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.ratingLabel, { color: rating.color }]}>{rating.label}</Text>
                <Text style={[styles.ratingSub, { color: theme.textSecondary }]}>
                  {avg !== null ? `${avg}ms average · ${loss}% packet loss` : 'No responses received'}
                </Text>
              </View>
              {loss > 0 && (
                <View style={[styles.lossBadge, { backgroundColor: `${theme.error}15`, borderColor: `${theme.error}25` }]}>
                  <Text style={[styles.lossText, { color: theme.error }]}>{loss}% loss</Text>
                </View>
              )}
            </LinearGradient>

            {/* Stats */}
            <View style={styles.statsRow}>
              {[
                { label: 'Avg', value: avg !== null ? `${avg}ms` : '—', icon: <ActivityIcon size={16} color={theme.primary} />, color: theme.primary },
                { label: 'Min', value: min !== null ? `${min}ms` : '—', icon: <ZapIcon size={16} color={theme.success} />, color: theme.success },
                { label: 'Max', value: maxMs !== null ? `${maxMs}ms` : '—', icon: <ClockIcon size={16} color={theme.warning} />, color: theme.warning },
                { label: 'Loss', value: `${loss}%`, icon: <ActivityIcon size={16} color={loss > 0 ? theme.error : theme.success} />, color: loss > 0 ? theme.error : theme.success },
              ].map(s => (
                <View key={s.label} style={[styles.statChip, { backgroundColor: theme.bgSurface, borderColor: `${s.color}25` }]}>
                  {s.icon}
                  <Text style={[styles.statChipValue, { color: theme.textPrimary }]}>{s.value}</Text>
                  <Text style={[styles.statChipLabel, { color: theme.textMuted }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.resultsCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
              {results.map(r => <PingBar key={r.seq} result={r} max={barMax} />)}
            </View>
          </>
        )}

        <TouchableOpacity onPress={run} disabled={running} activeOpacity={0.85}>
          <LinearGradient
            colors={!running ? [theme.primary, theme.accent] as [string, string] : ['#333', '#555'] as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.runBtn}
          >
            <ZapIcon size={18} color="#FFFFFF" />
            <Text style={styles.runBtnText}>{running ? `Pinging... ${results.length}/${count}` : 'Run Ping'}</Text>
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
  configCard: { borderRadius: radius.xl, borderWidth: 1, padding: spacing.md, gap: spacing.sm },
  configLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  hostInput: { borderRadius: radius.md, borderWidth: 1, padding: 12, fontSize: typography.base },
  countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  countBtns: { flexDirection: 'row', gap: spacing.sm },
  countBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1 },
  countBtnText: { fontSize: typography.sm, fontWeight: typography.semibold },
  ratingBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  ratingDot: { width: 10, height: 10, borderRadius: 5, shadowOpacity: 0.7, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  ratingLabel: { fontSize: typography.base, fontWeight: typography.black },
  ratingSub: { fontSize: 11, marginTop: 2 },
  lossBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.full, borderWidth: 1 },
  lossText: { fontSize: 11, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statChip: { flex: 1, alignItems: 'center', gap: 4, padding: spacing.sm, borderRadius: radius.lg, borderWidth: 1 },
  statChipValue: { fontSize: typography.sm, fontWeight: typography.bold },
  statChipLabel: { fontSize: 10, fontWeight: '600' },
  resultsCard: { borderRadius: radius.xl, borderWidth: 1, overflow: 'hidden' },
  pingBarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  pingSeq: { width: 28, fontSize: 11, fontWeight: '600' },
  pingBarTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  pingBarFill: { height: '100%', borderRadius: 3 },
  pingMs: { width: 60, textAlign: 'right', fontSize: 12, fontWeight: '700' },
  runBtn: { height: 54, borderRadius: radius.full, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  runBtnText: { color: '#FFFFFF', fontSize: typography.base, fontWeight: typography.bold },
});
