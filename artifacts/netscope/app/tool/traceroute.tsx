import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useActivity } from '@/contexts/ActivityContext';
import { typography, spacing, radius } from '@/constants/theme';
import { ArrowLeftIcon, GlobeIcon, ZapIcon, ClockIcon, ServerIcon } from '@/components/icons/Icons';
import ToolLearnCard from '@/components/ui/ToolLearnCard';
import ToolExportButton from '@/components/ui/ToolExportButton';

interface Hop {
  num: number;
  host: string;
  ip: string;
  ms1: number | null;
  ms2: number | null;
  ms3: number | null;
  loss: number;
  isCurrent?: boolean;
}

async function runTraceroute(host: string, onHop: (hop: Hop) => void): Promise<void> {
  const cleanHost = host.replace(/^https?:\/\//, '').split('/')[0];
  try {
    const res = await fetch(`https://api.hackertarget.com/mtr/?q=${encodeURIComponent(cleanHost)}`, {
      headers: { Accept: 'text/plain' },
    });
    if (!res.ok) throw new Error('API error');
    const text = await res.text();
    if (text.includes('error') || text.includes('API count exceeded')) {
      throw new Error(text.includes('API count exceeded')
        ? 'Free API limit reached. Try again later or visit hackertarget.com.'
        : 'Traceroute failed. Check the host and try again.');
    }
    const lines = text.split('\n').filter(l => l.trim());
    for (const line of lines) {
      const m = line.match(/^\s*(\d+)\.\|\-\-\s+(\S+)\s+(\d+\.\d+)%\s+\d+\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)/);
      if (m) {
        const hop: Hop = {
          num: parseInt(m[1], 10),
          host: m[2].includes('???') ? '* * *' : m[2],
          ip: m[2].includes('???') ? '' : m[2],
          loss: parseFloat(m[3]),
          ms1: parseFloat(m[4]),
          ms2: parseFloat(m[5]),
          ms3: parseFloat(m[6]),
        };
        onHop(hop);
      }
    }
  } catch (e: any) {
    throw e;
  }
}

function HopRow({ hop, index }: { hop: Hop; index: number }) {
  const { theme } = useTheme();
  const avg = [hop.ms1, hop.ms2, hop.ms3].filter(v => v !== null) as number[];
  const avgMs = avg.length ? Math.round(avg.reduce((a, b) => a + b) / avg.length) : null;
  const color = hop.host === '* * *' ? theme.textMuted
    : avgMs === null ? theme.textMuted
    : avgMs < 30 ? theme.success
    : avgMs < 80 ? '#4F87FF'
    : avgMs < 150 ? theme.warning
    : theme.error;

  return (
    <View style={[styles.hopRow, { borderBottomColor: theme.border }]}>
      <View style={[styles.hopNum, { backgroundColor: `${color}15` }]}>
        <Text style={[styles.hopNumText, { color }]}>{hop.num}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.hopHost, { color: hop.host === '* * *' ? theme.textMuted : theme.textPrimary }]} numberOfLines={1}>
          {hop.host === '* * *' ? 'Unreachable hop' : hop.host}
        </Text>
        {hop.loss > 0 && (
          <Text style={[styles.hopLoss, { color: theme.warning }]}>{hop.loss}% loss</Text>
        )}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        {avgMs !== null ? (
          <Text style={[styles.hopMs, { color }]}>{avgMs}ms</Text>
        ) : (
          <Text style={[styles.hopMs, { color: theme.textMuted }]}>—</Text>
        )}
        {hop.ms1 !== null && hop.ms2 !== null && hop.ms3 !== null && (
          <Text style={[styles.hopTriple, { color: theme.textMuted }]}>
            {hop.ms1}/{hop.ms2}/{hop.ms3}ms
          </Text>
        )}
      </View>
    </View>
  );
}

const LEARN_SECTIONS = [
  {
    title: 'How Traceroute Works',
    color: '#A855F7',
    items: [
      'Sends packets with incrementing TTL (Time To Live) values starting at 1',
      'Each router that drops a packet (TTL=0) sends back an ICMP "time exceeded" message',
      'NetScope uses HackerTarget MTR API — returns real hop data from a remote probe',
      'MTR combines ping + traceroute — shows loss and latency at each hop',
      '* * * means the router is blocking ICMP replies (firewall) — not unreachable',
    ],
  },
  {
    title: 'Reading the Results',
    color: '#4F87FF',
    items: [
      'Hop 1: usually your gateway/router (192.168.x.1)',
      'Hops 2-3: your ISP\'s local infrastructure (DSLAM, CMTS)',
      'Hops 4-8: ISP backbone and peering points',
      'Final hop: destination server',
      'High latency at a single hop then drops = that router has low-priority ICMP handling',
    ],
  },
  {
    title: 'Diagnosing Problems',
    color: '#00E5A0',
    items: [
      'Sudden latency spike at one hop: congestion or routing issue at that node',
      'All hops after a point show * * *: firewall blocking ICMP, not a real break',
      'High loss at the last hop: server issue or ISP problem to that destination',
      'High loss mid-route: congested peering link between ISPs',
      'Compare traces from different times to identify intermittent issues',
    ],
  },
];

export default function Traceroute() {
  const { theme } = useTheme();
  const { logActivity } = useActivity();
  const insets = useSafeAreaInsets();
  const [host, setHost] = useState('google.com');
  const [running, setRunning] = useState(false);
  const [hops, setHops] = useState<Hop[]>([]);
  const [error, setError] = useState('');
  const paddingTop = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const run = useCallback(async () => {
    if (!host.trim() || running) return;
    setRunning(true); setError(''); setHops([]);
    try {
      await runTraceroute(host.trim(), hop => {
        setHops(prev => [...prev, hop]);
      });
      await logActivity('network_scan', 'Traceroute', `Traced route to ${host.trim()}`, '/tool/traceroute');
    } catch (e: any) {
      setError(e?.message || 'Traceroute failed. Check host and try again.');
    }
    setRunning(false);
  }, [host, running, logActivity]);

  const maxHops = hops.length;
  const reachable = hops.filter(h => h.host !== '* * *').length;

  const exportData = {
    traceroute: { host: host.trim(), hops: maxHops, responding: reachable },
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <LinearGradient colors={theme.gradientBg as [string, string, string]} style={StyleSheet.absoluteFill} />
      <View style={[styles.header, { paddingTop: paddingTop + spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <ArrowLeftIcon size={18} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Traceroute</Text>
          <Text style={[styles.pageSub, { color: theme.textMuted }]}>Trace every hop to destination via MTR</Text>
        </View>
        <ToolLearnCard tool="Traceroute" tagline="Network path · hop analysis · routing diagnosis" sections={LEARN_SECTIONS} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]} showsVerticalScrollIndicator={false}>

        <View style={[styles.inputCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <GlobeIcon size={18} color={theme.primary} />
          <TextInput
            value={host} onChangeText={setHost}
            placeholder="e.g. google.com or 1.1.1.1"
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { color: theme.textPrimary }]}
            autoCapitalize="none" autoCorrect={false}
            onSubmitEditing={run} returnKeyType="search"
          />
        </View>

        <TouchableOpacity onPress={run} disabled={running || !host.trim()} activeOpacity={0.85}>
          <LinearGradient
            colors={host.trim() && !running ? [theme.primary, theme.accent] as [string, string] : ['#333', '#555'] as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.runBtn}
          >
            <ZapIcon size={18} color="#FFFFFF" />
            <Text style={styles.runBtnText}>{running ? 'Tracing route…' : 'Trace Route'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {error ? (
          <View style={[styles.errorCard, { backgroundColor: `${theme.error}10`, borderColor: `${theme.error}30` }]}>
            <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
          </View>
        ) : null}

        {hops.length > 0 && !running && (
          <LinearGradient
            colors={[`${theme.success}15`, `${theme.primary}08`] as [string, string]}
            style={[styles.summaryCard, { borderColor: `${theme.success}25` }]}
          >
            <ClockIcon size={16} color={theme.success} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.summaryTitle, { color: theme.textPrimary }]}>
                {maxHops} hops · {reachable} responding
              </Text>
              <Text style={[styles.summarySub, { color: theme.textMuted }]}>
                Route to <Text style={{ color: theme.textPrimary }}>{host}</Text>
              </Text>
            </View>
          </LinearGradient>
        )}

        {hops.length > 0 && (
          <View style={[styles.hopsCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <View style={[styles.hopsHeader, { borderBottomColor: theme.border }]}>
              <ServerIcon size={14} color={theme.primary} />
              <Text style={[styles.hopsHeaderText, { color: theme.textPrimary }]}>Network Path</Text>
              <Text style={[styles.hopsMeta, { color: theme.textMuted }]}>avg · ms1/ms2/ms3</Text>
            </View>
            {hops.map((hop, i) => <HopRow key={i} hop={hop} index={i} />)}
          </View>
        )}

        {running && (
          <View style={[styles.progressCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <ClockIcon size={14} color={theme.primary} />
            <Text style={[styles.progressText, { color: theme.textMuted }]}>
              Probing route… <Text style={{ color: theme.textPrimary }}>{hops.length} hops</Text> found
            </Text>
          </View>
        )}

        {hops.length === 0 && !running && !error && (
          <View style={[styles.emptyCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <GlobeIcon size={36} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Route Tracer</Text>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              Maps the network path from origin to destination, showing each router hop with real latency and packet loss data.
            </Text>
          </View>
        )}

        {hops.length > 0 && !running && (
          <ToolExportButton data={exportData} label="Export Traceroute Report (PDF)" />
        )}

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
  inputCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.xl, borderWidth: 1 },
  input: { flex: 1, fontSize: typography.base, padding: 0 },
  runBtn: { height: 54, borderRadius: radius.full, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  runBtnText: { color: '#FFFFFF', fontSize: typography.base, fontWeight: typography.bold },
  errorCard: { padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  errorText: { fontSize: typography.sm, lineHeight: 20 },
  summaryCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  summaryTitle: { fontSize: typography.sm, fontWeight: typography.bold },
  summarySub: { fontSize: typography.xs, marginTop: 2 },
  hopsCard: { borderRadius: radius.xl, borderWidth: 1, overflow: 'hidden' },
  hopsHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  hopsHeaderText: { flex: 1, fontSize: typography.sm, fontWeight: typography.bold },
  hopsMeta: { fontSize: 10 },
  hopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth },
  hopNum: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  hopNumText: { fontSize: 12, fontWeight: '800' },
  hopHost: { fontSize: typography.sm, fontWeight: typography.medium },
  hopLoss: { fontSize: 10, marginTop: 1 },
  hopMs: { fontSize: typography.sm, fontWeight: typography.bold },
  hopTriple: { fontSize: 9, marginTop: 1 },
  progressCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  progressText: { fontSize: typography.sm },
  emptyCard: { borderRadius: radius.xl, borderWidth: 1, padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  emptyTitle: { fontSize: typography.md, fontWeight: typography.bold },
  emptyText: { fontSize: typography.sm, textAlign: 'center', lineHeight: 20 },
});
