import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/contexts/ThemeContext';
import { useActivity } from '@/contexts/ActivityContext';
import { typography, spacing, radius } from '@/constants/theme';
import { ArrowLeftIcon, ServerIcon, GlobeIcon, CopyIcon, ZapIcon, ShieldIcon } from '@/components/icons/Icons';
import ToolLearnCard from '@/components/ui/ToolLearnCard';
import ToolExportButton from '@/components/ui/ToolExportButton';

interface HeaderEntry { name: string; value: string; category: 'security' | 'caching' | 'server' | 'content' | 'other'; }

const SECURITY_HEADERS = new Set([
  'strict-transport-security', 'content-security-policy', 'x-frame-options',
  'x-content-type-options', 'referrer-policy', 'permissions-policy',
  'cross-origin-opener-policy', 'cross-origin-resource-policy',
  'cross-origin-embedder-policy', 'x-xss-protection',
]);
const CACHE_HEADERS = new Set([
  'cache-control', 'etag', 'last-modified', 'expires', 'age', 'vary',
]);
const SERVER_HEADERS = new Set([
  'server', 'x-powered-by', 'x-backend', 'via', 'x-served-by', 'x-request-id',
  'x-cache', 'cf-ray', 'x-amz-request-id', 'x-github-request-id',
]);
const CONTENT_HEADERS = new Set([
  'content-type', 'content-length', 'content-encoding', 'content-language',
  'transfer-encoding', 'connection', 'alt-svc',
]);

function categorize(name: string): HeaderEntry['category'] {
  const lc = name.toLowerCase();
  if (SECURITY_HEADERS.has(lc)) return 'security';
  if (CACHE_HEADERS.has(lc)) return 'caching';
  if (SERVER_HEADERS.has(lc)) return 'server';
  if (CONTENT_HEADERS.has(lc)) return 'content';
  return 'other';
}

const CATEGORY_COLORS: Record<HeaderEntry['category'], string> = {
  security: '#00E5A0',
  caching: '#FFBE5C',
  server: '#4F87FF',
  content: '#A855F7',
  other: '#94A3B8',
};
const CATEGORY_LABELS: Record<HeaderEntry['category'], string> = {
  security: 'Security', caching: 'Caching', server: 'Server', content: 'Content', other: 'Other',
};

async function fetchHeaders(url: string): Promise<{ headers: HeaderEntry[]; status: number; statusText: string } | { error: string }> {
  let fullUrl = url.trim();
  if (!fullUrl.startsWith('http')) fullUrl = `https://${fullUrl}`;
  try {
    const res = await fetch(fullUrl, { method: 'HEAD', cache: 'no-store' });
    const entries: HeaderEntry[] = [];
    res.headers.forEach((value, name) => {
      entries.push({ name, value, category: categorize(name) });
    });
    entries.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    return { headers: entries, status: res.status, statusText: res.statusText };
  } catch (e: any) {
    if (e?.message?.includes('CORS') || e?.message?.includes('Failed to fetch')) {
      try {
        await fetch(fullUrl, { method: 'GET', mode: 'no-cors', cache: 'no-store' });
        return { error: 'CORS policy blocked header inspection. Try a different domain or test on Android APK where CORS restrictions don\'t apply.' };
      } catch {}
    }
    return { error: `Could not reach ${fullUrl}. Check the URL and your connection.` };
  }
}

function HeaderRow({ entry }: { entry: HeaderEntry }) {
  const { theme } = useTheme();
  const color = CATEGORY_COLORS[entry.category];
  return (
    <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
      <View style={[styles.nameBadge, { backgroundColor: `${color}12` }]}>
        <Text style={[styles.nameText, { color }]} numberOfLines={1}>{entry.name}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', flex: 1 }}>
        <Text style={[styles.valueText, { color: theme.textSecondary, flex: 1 }]} selectable numberOfLines={3}>{entry.value}</Text>
        <TouchableOpacity onPress={() => Clipboard.setStringAsync(entry.value)} style={{ paddingLeft: 6, paddingTop: 2 }}>
          <CopyIcon size={12} color={theme.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const LEARN_SECTIONS = [
  {
    title: 'What Headers Reveal',
    color: '#4F87FF',
    items: [
      'Server: nginx 1.24.0 — reveals web server software and version',
      'X-Powered-By: PHP/8.1 — exposes backend tech stack',
      'X-Backend: app-server-01 — internal hostname leak (security risk)',
      'Via: cloudflare — reveals CDN or proxy in the chain',
      'CF-Ray: Cloudflare request ID — useful for debugging',
    ],
  },
  {
    title: 'Security Headers Explained',
    color: '#00E5A0',
    items: [
      'HSTS: Strict-Transport-Security forces HTTPS for a set period',
      'CSP: limits which scripts/styles/images can load — prevents XSS',
      'X-Frame-Options: DENY or SAMEORIGIN — prevents clickjacking',
      'COEP/COOP: isolates document context — enables SharedArrayBuffer',
      'Permissions-Policy: disables features like camera/geolocation/USB',
    ],
  },
  {
    title: 'Caching Headers',
    color: '#FFBE5C',
    items: [
      'Cache-Control: max-age=86400 — cached for 1 day by browsers',
      'ETag: fingerprint of the resource — used for conditional requests',
      'Vary: Accept-Encoding — tells CDN to cache separate copies per encoding',
      'Age: seconds since the CDN fetched this from origin',
      'Expires: deprecated absolute expiry date (use Cache-Control instead)',
    ],
  },
  {
    title: 'Pentesting Uses',
    color: '#A855F7',
    items: [
      'Server + X-Powered-By reveal version info — cross-reference CVEs',
      'Missing security headers = easier XSS/clickjacking attacks',
      'X-Debug-* or X-Internal-* headers may leak backend IP ranges',
      'Access-Control-Allow-Origin: * = permissive CORS — can be exploited',
      'Set-Cookie without HttpOnly/Secure flags = session theft risk',
    ],
  },
];

export default function HttpHeaders() {
  const { theme } = useTheme();
  const { logActivity } = useActivity();
  const insets = useSafeAreaInsets();
  const [url, setUrl] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ headers: HeaderEntry[]; status: number; statusText: string } | null>(null);
  const [error, setError] = useState('');
  const paddingTop = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const run = useCallback(async () => {
    if (!url.trim() || running) return;
    setRunning(true); setError(''); setResult(null);
    const res = await fetchHeaders(url.trim());
    if ('error' in res) setError(res.error);
    else {
      setResult(res);
      await logActivity('security_audit', 'HTTP Headers', `Fetched headers for ${url.trim()}`, '/tool/headers');
    }
    setRunning(false);
  }, [url, running, logActivity]);

  const grouped = result ? (
    ['security', 'caching', 'server', 'content', 'other'] as HeaderEntry['category'][]
  ).map(cat => ({
    cat, items: result.headers.filter(h => h.category === cat),
  })).filter(g => g.items.length > 0) : [];

  const statusColor = result?.status
    ? result.status < 300 ? theme.success : result.status < 400 ? theme.warning : theme.error
    : theme.textMuted;

  const secCount = result?.headers.filter(h => h.category === 'security').length ?? 0;
  const cacheCount = result?.headers.filter(h => h.category === 'caching').length ?? 0;
  const serverCount = result?.headers.filter(h => h.category === 'server').length ?? 0;
  const contentCount = result?.headers.filter(h => h.category === 'content').length ?? 0;

  const exportData = result ? {
    headers: {
      url: url.trim(),
      status: result.status,
      statusText: result.statusText,
      count: result.headers.length,
      securityCount: secCount,
      cachingCount: cacheCount,
      serverCount: serverCount,
      contentCount: contentCount,
    },
  } : {};

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <LinearGradient colors={theme.gradientBg as [string, string, string]} style={StyleSheet.absoluteFill} />
      <View style={[styles.header, { paddingTop: paddingTop + spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <ArrowLeftIcon size={18} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>HTTP Headers</Text>
          <Text style={[styles.pageSub, { color: theme.textMuted }]}>Inspect server response headers</Text>
        </View>
        <ToolLearnCard tool="HTTP Headers" tagline="Server headers · security analysis · caching info" sections={LEARN_SECTIONS} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]} showsVerticalScrollIndicator={false}>

        <View style={[styles.inputCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <GlobeIcon size={18} color={theme.primary} />
          <TextInput
            value={url} onChangeText={setUrl}
            placeholder="e.g. github.com or https://api.example.com"
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { color: theme.textPrimary }]}
            autoCapitalize="none" autoCorrect={false}
            onSubmitEditing={run} returnKeyType="search"
          />
        </View>

        <TouchableOpacity onPress={run} disabled={running || !url.trim()} activeOpacity={0.85}>
          <LinearGradient
            colors={url.trim() && !running ? [theme.primary, theme.accent] as [string, string] : ['#333', '#555'] as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.runBtn}
          >
            <ServerIcon size={18} color="#FFFFFF" />
            <Text style={styles.runBtnText}>{running ? 'Fetching headers…' : 'Fetch Headers'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {error ? (
          <View style={[styles.errorCard, { backgroundColor: `${theme.error}10`, borderColor: `${theme.error}30` }]}>
            <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
          </View>
        ) : null}

        {result && (
          <LinearGradient
            colors={[`${statusColor}15`, `${statusColor}05`] as [string, string]}
            style={[styles.statusBanner, { borderColor: `${statusColor}25` }]}
          >
            <View style={[styles.statusCodeBox, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.statusCode, { color: statusColor }]}>{result.status}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusText, { color: theme.textPrimary }]}>{result.statusText || 'OK'}</Text>
              <Text style={[styles.statusSub, { color: theme.textMuted }]}>{result.headers.length} headers returned</Text>
            </View>
          </LinearGradient>
        )}

        {grouped.map(({ cat, items }) => (
          <View key={cat} style={[styles.group, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <View style={[styles.groupHeader, { borderBottomColor: theme.border }]}>
              <View style={[styles.groupDot, { backgroundColor: CATEGORY_COLORS[cat] }]} />
              <Text style={[styles.groupTitle, { color: theme.textPrimary }]}>{CATEGORY_LABELS[cat]}</Text>
              <Text style={[styles.groupCount, { color: theme.textMuted }]}>{items.length}</Text>
            </View>
            {items.map((h, i) => <HeaderRow key={i} entry={h} />)}
          </View>
        ))}

        {!result && !error && !running && (
          <View style={[styles.emptyCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <ServerIcon size={36} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>HTTP Header Inspector</Text>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              Fetch any URL to inspect its full response headers — categorized into Security, Caching, Server info, and Content headers.
            </Text>
          </View>
        )}

        {result && !running && (
          <ToolExportButton data={exportData} label="Export Headers Report (PDF)" />
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
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  statusCodeBox: { width: 56, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusCode: { fontSize: 22, fontWeight: '900' },
  statusText: { fontSize: typography.base, fontWeight: typography.bold },
  statusSub: { fontSize: typography.xs, marginTop: 2 },
  group: { borderRadius: radius.xl, borderWidth: 1, overflow: 'hidden' },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  groupDot: { width: 8, height: 8, borderRadius: 4 },
  groupTitle: { flex: 1, fontSize: typography.sm, fontWeight: typography.bold },
  groupCount: { fontSize: typography.xs },
  headerRow: { borderBottomWidth: StyleSheet.hairlineWidth, padding: spacing.md, gap: spacing.sm },
  nameBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 4, alignSelf: 'flex-start' },
  nameText: { fontSize: 11, fontWeight: '700', fontFamily: Platform.OS !== 'web' ? undefined : 'monospace' },
  valueText: { fontSize: 11, lineHeight: 16, fontFamily: Platform.OS !== 'web' ? undefined : 'monospace' },
  emptyCard: { borderRadius: radius.xl, borderWidth: 1, padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  emptyTitle: { fontSize: typography.md, fontWeight: typography.bold },
  emptyText: { fontSize: typography.sm, textAlign: 'center', lineHeight: 20 },
});
