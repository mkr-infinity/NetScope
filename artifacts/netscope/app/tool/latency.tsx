import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { typography, spacing, radius } from '@/constants/theme';
import { ArrowLeftIcon, ZapIcon, TrendingUpIcon, ClockIcon, GlobeIcon, ServerIcon } from '@/components/icons/Icons';
import ToolLearnCard from '@/components/ui/ToolLearnCard';

const SERVERS = [
  { name: 'Cloudflare DNS', host: 'https://1.1.1.1', region: 'Anycast / Global', tag: 'CF' },
  { name: 'Google DNS', host: 'https://8.8.8.8', region: 'Anycast / Global', tag: 'G' },
  { name: 'Quad9 DNS', host: 'https://9.9.9.9', region: 'Anycast / Global', tag: 'Q9' },
  { name: 'Google Search', host: 'https://www.google.com', region: 'US / Global CDN', tag: 'G' },
  { name: 'GitHub', host: 'https://github.com', region: 'US / Fastly CDN', tag: 'GH' },
  { name: 'Cloudflare Web', host: 'https://www.cloudflare.com', region: 'US / CF CDN', tag: 'CF' },
  { name: 'Fastly CDN', host: 'https://www.fastly.com', region: 'US / Fastly', tag: 'FL' },
  { name: 'AWS', host: 'https://aws.amazon.com', region: 'US / CloudFront', tag: 'AW' },
];

const TAG_COLORS: Record<string, string> = {
  CF: '#F6821F', G: '#4285F4', Q9: '#A855F7', GH: '#4F87FF', FL: '#FF5C8A', AW: '#FF9900', AW2: '#FF9900',
};

async function pingServer(url: string, samples = 3): Promise<number | null> {
  const times: number[] = [];
  for (let i = 0; i < samples; i++) {
    const c = new AbortController();
    setTimeout(() => c.abort(), 4000);
    try {
      const t = Date.now();
      await fetch(url, { method: 'HEAD', mode: 'no-cors', cache: 'no-store', signal: c.signal });
      times.push(Date.now() - t);
    } catch {}
    if (i < samples - 1) await new Promise(r => setTimeout(r, 100));
  }
  if (times.length === 0) return null;
  return Math.round(times.reduce((a, b) => a + b) / times.length);
}

interface ServerResult { name: string; region: string; tag: string; ms: number | null; rank?: number; }

function getRatingColor(ms: number | null, theme: any) {
  if (ms === null) return theme.textMuted;
  if (ms < 50) return theme.success;
  if (ms < 150) return theme.primary;
  if (ms < 300) return theme.warning;
  return theme.error;
}

function getRating(ms: number | null) {
  if (ms === null) return 'Unreachable';
  if (ms < 50) return 'Excellent';
  if (ms < 150) return 'Good';
  if (ms < 300) return 'Fair';
  return 'Poor';
}

function TagBadge({ tag }: { tag: string }) {
  const color = TAG_COLORS[tag] ?? '#7C96CC';
  return (
    <View style={[styles.tagBadge, { backgroundColor: `${color}15`, borderColor: `${color}25` }]}>
      <Text style={[styles.tagText, { color }]}>{tag}</Text>
    </View>
  );
}

const LEARN_SECTIONS = [
  {
    title: 'Understanding Latency',
    color: '#4F87FF',
    items: [
      'Latency = round-trip time (RTT) from your device to a server and back',
      '<20ms: LAN speeds — local network or same datacenter',
      '20–80ms: excellent — close ISP point-of-presence (PoP)',
      '80–150ms: good — regional routing, possibly cross-country',
      '150–300ms: fair — cross-continent or distant routing',
      '>300ms: satellite or severely congested link',
    ],
  },
  {
    title: 'Anycast Routing',
    color: '#00E5A0',
    items: [
      'Anycast: one IP address, many servers — traffic routes to the nearest node',
      'Explains why 1.1.1.1 and 8.8.8.8 are always ultra-fast',
      'Cloudflare has 300+ data centers — your DNS query hits the closest one',
      'CDNs (Fastly, CloudFront) use anycast for global content delivery',
      'Anycast is also used for DDoS mitigation — traffic is absorbed globally',
    ],
  },
  {
    title: 'BGP & Internet Routing',
    color: '#A855F7',
    items: [
      'BGP (Border Gateway Protocol): the routing protocol of the internet',
      'Routes aren\'t always shortest path — ISP peering agreements matter',
      'Cold potato routing: your ISP hands off traffic early (their preference)',
      'Hot potato routing: traffic stays on a single AS as long as possible',
      'Traceroute shows the actual hop-by-hop path packets take',
      'Submarine cables: transatlantic latency ~70ms, US to Australia ~170ms',
    ],
  },
  {
    title: 'Optimizing Latency',
    color: '#FFBE5C',
    items: [
      'Use wired Ethernet — eliminates Wi-Fi overhead and jitter',
      'Connect to 5GHz Wi-Fi band — less interference than 2.4GHz',
      'Use DNS resolvers close to you — 1.1.1.1 and 8.8.8.8 are anycast',
      'Enable QoS on router — prioritize gaming/VoIP over file downloads',
      'VPN adds 20-80ms — choose server geographically close to target',
      'Disable IPv6 if causing fallback delays on certain connections',
    ],
  },
];

export default function LatencyBoard() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ServerResult[]>([]);
  const [testing, setTesting] = useState('');
  const paddingTop = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const run = useCallback(async () => {
    if (running) return;
    setRunning(true); setResults([]); setTesting('');
    const raw: ServerResult[] = [];
    for (const s of SERVERS) {
      setTesting(s.name);
      const ms = await pingServer(s.host);
      raw.push({ name: s.name, region: s.region, tag: s.tag, ms });
      const sorted = [...raw].sort((a, b) => {
        if (a.ms === null) return 1;
        if (b.ms === null) return -1;
        return a.ms - b.ms;
      }).map((r, i) => ({ ...r, rank: i + 1 }));
      setResults(sorted);
    }
    setTesting('');
    setRunning(false);
  }, [running]);

  const best = results.find(r => r.ms !== null);
  const avg = results.filter(r => r.ms !== null).length > 0
    ? Math.round(results.filter(r => r.ms !== null).reduce((a, b) => a + (b.ms ?? 0), 0) / results.filter(r => r.ms !== null).length)
    : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <LinearGradient colors={theme.gradientBg as [string, string, string]} style={StyleSheet.absoluteFill} />
      <View style={[styles.header, { paddingTop: paddingTop + spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <ArrowLeftIcon size={18} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Latency Board</Text>
          <Text style={[styles.pageSub, { color: theme.textMuted }]}>Ping leaderboard · 8 global servers</Text>
        </View>
        <ToolLearnCard tool="Latency Board" tagline="RTT leaderboard · anycast routing · BGP hops" sections={LEARN_SECTIONS} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]} showsVerticalScrollIndicator={false}>

        {best && (
          <LinearGradient
            colors={[`${theme.success}20`, `${theme.primary}10`] as [string, string]}
            style={[styles.bestCard, { borderColor: `${theme.success}30` }]}
          >
            <Text style={[styles.bestLabel, { color: theme.success }]}>FASTEST SERVER</Text>
            <View style={styles.bestRow}>
              <TagBadge tag={best.tag} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.bestName, { color: theme.textPrimary }]}>{best.name}</Text>
                <Text style={[styles.bestRegion, { color: theme.textMuted }]}>{best.region}</Text>
              </View>
              <View style={styles.bestPing}>
                <Text style={[styles.bestMs, { color: theme.success }]}>{best.ms}</Text>
                <Text style={[styles.bestMsUnit, { color: theme.success }]}>ms</Text>
              </View>
            </View>
            {avg !== null && (
              <View style={[styles.avgRow, { borderTopColor: `${theme.success}20` }]}>
                <ZapIcon size={12} color={theme.textMuted} />
                <Text style={[styles.avgText, { color: theme.textMuted }]}>Average across all reachable servers: <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>{avg}ms</Text></Text>
              </View>
            )}
          </LinearGradient>
        )}

        {running && testing && (
          <View style={[styles.testingCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <ClockIcon size={14} color={theme.primary} />
            <Text style={[styles.testingText, { color: theme.textMuted }]}>Testing: <Text style={{ color: theme.textPrimary }}>{testing}</Text></Text>
          </View>
        )}

        {results.length > 0 && (
          <View style={[styles.leaderboard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <View style={[styles.lbHeader, { borderBottomColor: theme.border }]}>
              <TrendingUpIcon size={14} color={theme.primary} />
              <Text style={[styles.lbHeaderText, { color: theme.textPrimary }]}>Latency Leaderboard</Text>
              <Text style={[styles.lbCount, { color: theme.textMuted }]}>{results.filter(r => r.ms !== null).length}/{results.length} reachable</Text>
            </View>
            {results.map((r, i) => {
              const color = getRatingColor(r.ms, theme);
              const bestMs = results.find(x => x.ms !== null)?.ms ?? 50;
              const barW = r.ms !== null ? Math.min(bestMs / r.ms, 1) : 0;
              return (
                <View key={r.name} style={[styles.lbRow, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.lbRank, { color: i < 3 ? theme.primary : theme.textMuted }]}>#{r.rank ?? i + 1}</Text>
                  <TagBadge tag={r.tag} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[styles.lbName, { color: theme.textPrimary }]}>{r.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <View style={[styles.lbBar, { backgroundColor: theme.bgInput, flex: 1 }]}>
                        <LinearGradient colors={[color, `${color}60`] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.lbBarFill, { width: `${barW * 100}%` as any }]} />
                      </View>
                    </View>
                    <Text style={[styles.lbRegion, { color: theme.textMuted }]}>{r.region}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.lbMs, { color }]}>{r.ms !== null ? `${r.ms}ms` : '—'}</Text>
                    <Text style={[styles.lbRating, { color: `${color}80` }]}>{getRating(r.ms)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <TouchableOpacity onPress={run} disabled={running} activeOpacity={0.85}>
          <LinearGradient
            colors={!running ? [theme.primary, theme.accent] as [string, string] : ['#333', '#555'] as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.runBtn}
          >
            <ZapIcon size={18} color="#FFFFFF" />
            <Text style={styles.runBtnText}>{running ? 'Testing servers...' : results.length > 0 ? 'Re-run Test' : 'Start Latency Test'}</Text>
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
  bestCard: { borderRadius: radius.xl, borderWidth: 1, padding: spacing.md, gap: spacing.sm },
  bestLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  bestRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, borderWidth: 1, minWidth: 32, alignItems: 'center' },
  tagText: { fontSize: 10, fontWeight: '800' },
  bestName: { fontSize: typography.md, fontWeight: typography.bold },
  bestRegion: { fontSize: typography.xs, marginTop: 2 },
  bestPing: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  bestMs: { fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  bestMsUnit: { fontSize: typography.sm, fontWeight: typography.bold },
  avgRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  avgText: { fontSize: 11, flex: 1 },
  testingCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  testingText: { fontSize: typography.sm },
  leaderboard: { borderRadius: radius.xl, borderWidth: 1, overflow: 'hidden' },
  lbHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  lbHeaderText: { flex: 1, fontSize: typography.sm, fontWeight: typography.bold },
  lbCount: { fontSize: 11 },
  lbRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  lbRank: { width: 26, fontSize: 12, fontWeight: '800' },
  lbName: { fontSize: typography.sm, fontWeight: typography.semibold },
  lbBar: { height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 2 },
  lbBarFill: { height: '100%', borderRadius: 2 },
  lbRegion: { fontSize: 9 },
  lbMs: { fontSize: typography.sm, fontWeight: typography.black },
  lbRating: { fontSize: 10, fontWeight: '600' },
  runBtn: { height: 54, borderRadius: radius.full, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  runBtnText: { color: '#FFFFFF', fontSize: typography.base, fontWeight: typography.bold },
});
