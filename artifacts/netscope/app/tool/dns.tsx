import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { typography, spacing, radius } from '@/constants/theme';
import { ArrowLeftIcon, GlobeIcon, ServerIcon, CopyIcon } from '@/components/icons/Icons';
import * as Clipboard from 'expo-clipboard';
import ToolLearnCard from '@/components/ui/ToolLearnCard';

interface DnsRecord { type: string; value: string; ttl?: number; }

async function dnsLookup(domain: string) {
  const types = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME'];
  const results: Record<string, DnsRecord[]> = {};
  await Promise.all(types.map(async type => {
    try {
      const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`, { headers: { Accept: 'application/json' } });
      const data = await res.json();
      if (data.Answer?.length) results[type] = data.Answer.map((r: any) => ({ type, value: r.data, ttl: r.TTL }));
    } catch {}
  }));
  return results;
}

const TYPE_COLORS: Record<string, string> = {
  A: '#4F87FF', AAAA: '#00D4FF', MX: '#A855F7', NS: '#00E5A0', TXT: '#FFBE5C', CNAME: '#FF5C8A',
};

const TYPE_DESCRIPTIONS: Record<string, string> = {
  A: 'Maps domain to IPv4 address',
  AAAA: 'Maps domain to IPv6 address',
  MX: 'Mail server routing priority',
  NS: 'Authoritative nameserver delegation',
  TXT: 'SPF, DKIM, DMARC verification data',
  CNAME: 'Canonical name alias to another domain',
};

const LEARN_SECTIONS = [
  {
    title: 'DNS Fundamentals',
    color: '#4F87FF',
    items: [
      'DNS (Domain Name System) converts human names to IP addresses',
      'Hierarchy: Root (.) → TLD (.com) → Authoritative (example.com)',
      'Recursive resolver: your ISP or 1.1.1.1 queries on your behalf',
      'TTL (Time To Live): how long records are cached in seconds',
      'This tool uses Google DNS over HTTPS (DoH) — encrypted queries',
    ],
  },
  {
    title: 'Record Types Explained',
    color: '#00E5A0',
    items: [
      'A record: domain → IPv4 (e.g., 93.184.216.34)',
      'AAAA record: domain → IPv6 (e.g., 2606:2800:220:1::93)',
      'MX record: priority + mail server hostname for email routing',
      'NS record: which servers hold the zone file (authoritative DNS)',
      'TXT record: SPF (spam prevention), DKIM (email signing), DMARC policy',
      'CNAME: alias — www.example.com → example.com',
    ],
  },
  {
    title: 'Security & Privacy',
    color: '#A855F7',
    items: [
      'DNS Spoofing: attacker poisons cache to redirect traffic to fake site',
      'DNSSEC: cryptographic signing to prevent spoofing (check for DS/DNSKEY records)',
      'DNS over HTTPS (DoH): encrypts queries — ISP cannot see what you lookup',
      'DNS over TLS (DoT): similar protection, port 853',
      'Exfiltration: malware can tunnel data through TXT/CNAME records',
    ],
  },
  {
    title: 'Pentesting & OSINT',
    color: '#FFBE5C',
    items: [
      'Subdomain enumeration: discover assets (dev.example.com, staging.example.com)',
      'MX records reveal mail providers — useful for phishing research',
      'NS records show hosting provider and may reveal cloud platform',
      'TXT SPF records show authorized mail sending IPs',
      'Zone transfer (AXFR): if misconfigured, reveals all DNS records at once',
    ],
  },
];

export default function DnsLookup() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [domain, setDomain] = useState('');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Record<string, DnsRecord[]> | null>(null);
  const [error, setError] = useState('');
  const paddingTop = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const run = useCallback(async () => {
    if (!domain.trim() || running) return;
    setRunning(true); setError(''); setResults(null);
    try {
      const data = await dnsLookup(domain.trim());
      if (Object.keys(data).length === 0) setError('No DNS records found for this domain.');
      else setResults(data);
    } catch { setError('DNS lookup failed. Check the domain and try again.'); }
    setRunning(false);
  }, [domain, running]);

  const totalRecords = results ? Object.values(results).reduce((a, b) => a + b.length, 0) : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <LinearGradient colors={theme.gradientBg as [string, string, string]} style={StyleSheet.absoluteFill} />
      <View style={[styles.header, { paddingTop: paddingTop + spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <ArrowLeftIcon size={18} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>DNS Lookup</Text>
          <Text style={[styles.pageSub, { color: theme.textMuted }]}>Resolve domain records via Google DoH</Text>
        </View>
        <ToolLearnCard tool="DNS Lookup" tagline="Domain Name System · record types · security context" sections={LEARN_SECTIONS} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]} showsVerticalScrollIndicator={false}>

        <View style={[styles.inputCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <GlobeIcon size={18} color={theme.primary} />
          <TextInput
            value={domain} onChangeText={setDomain}
            placeholder="e.g. github.com"
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { color: theme.textPrimary }]}
            autoCapitalize="none" autoCorrect={false}
            onSubmitEditing={run} returnKeyType="search"
          />
        </View>

        <TouchableOpacity onPress={run} disabled={running || !domain.trim()} activeOpacity={0.85}>
          <LinearGradient
            colors={domain.trim() && !running ? [theme.primary, theme.accent] as [string, string] : ['#333', '#555'] as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.runBtn}
          >
            <GlobeIcon size={18} color="#FFFFFF" />
            <Text style={styles.runBtnText}>{running ? 'Looking up...' : 'Lookup DNS'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {error ? (
          <View style={[styles.errorCard, { backgroundColor: `${theme.error}10`, borderColor: `${theme.error}30` }]}>
            <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
          </View>
        ) : null}

        {results && (
          <View style={[styles.summaryBanner, { backgroundColor: `${theme.primary}10`, borderColor: `${theme.primary}20` }]}>
            <GlobeIcon size={14} color={theme.primary} />
            <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
              Found <Text style={{ color: theme.primary, fontWeight: '800' }}>{totalRecords}</Text> records across <Text style={{ color: theme.primary, fontWeight: '800' }}>{Object.keys(results).length}</Text> types for <Text style={{ color: theme.textPrimary }}>{domain}</Text>
            </Text>
          </View>
        )}

        {results && Object.entries(results).map(([type, records]) => (
          <View key={type} style={[styles.recordGroup, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <View style={styles.recordHeader}>
              <View style={[styles.typeBadge, { backgroundColor: `${TYPE_COLORS[type] || theme.primary}20` }]}>
                <Text style={[styles.typeText, { color: TYPE_COLORS[type] || theme.primary }]}>{type}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.typeDesc, { color: theme.textSecondary }]}>{TYPE_DESCRIPTIONS[type] || 'DNS record'}</Text>
              </View>
              <Text style={[styles.recordCount, { color: theme.textMuted }]}>{records.length} record{records.length > 1 ? 's' : ''}</Text>
            </View>
            {records.map((r, i) => (
              <View key={i} style={[styles.recordRow, { borderTopColor: theme.border }]}>
                <ServerIcon size={14} color={theme.textMuted} />
                <Text style={[styles.recordValue, { color: theme.textPrimary }]} selectable numberOfLines={2}>{r.value}</Text>
                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  {r.ttl !== undefined && (
                    <Text style={[styles.ttl, { color: theme.textMuted }]}>TTL {r.ttl}s</Text>
                  )}
                  <TouchableOpacity onPress={() => Clipboard.setStringAsync(r.value)}>
                    <CopyIcon size={14} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ))}

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
  errorText: { fontSize: typography.sm },
  summaryBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.lg, borderWidth: 1 },
  summaryText: { flex: 1, fontSize: 12, lineHeight: 18 },
  recordGroup: { borderRadius: radius.xl, borderWidth: 1, overflow: 'hidden' },
  recordHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  typeText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  typeDesc: { fontSize: 11 },
  recordCount: { fontSize: typography.xs },
  recordRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  recordValue: { flex: 1, fontSize: typography.sm, fontFamily: Platform.OS !== 'web' ? undefined : 'monospace' },
  ttl: { fontSize: 10 },
});
