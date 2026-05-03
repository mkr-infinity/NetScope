import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { typography, spacing, radius } from '@/constants/theme';
import { ArrowLeftIcon, GlobeIcon, ServerIcon, ClockIcon, ShieldIcon, CopyIcon, ActivityIcon } from '@/components/icons/Icons';
import * as Clipboard from 'expo-clipboard';
import ToolLearnCard from '@/components/ui/ToolLearnCard';

async function fetchWhois(domain: string) {
  try {
    const res = await fetch(`https://rdap.verisign.com/com/v1/domain/${domain.replace(/^www\./, '')}`);
    if (!res.ok) throw new Error('not .com');
    const data = await res.json();
    const ns = data.nameservers?.map((n: any) => n.ldhName).join(', ') ?? '—';
    const events: Record<string, string> = {};
    (data.events ?? []).forEach((e: any) => { events[e.eventAction] = e.eventDate; });
    const status = (data.status ?? []).join(', ');
    const entities = data.entities ?? [];
    const registrar = entities.find((e: any) => e.roles?.includes('registrar'))?.vcardArray?.[1]
      ?.find((f: any) => f[0] === 'fn')?.[3] ?? '—';
    const expiry = events['expiration'] ?? null;
    return {
      domain: data.ldhName ?? domain, registrar, status, ns,
      registered: events.registration,
      updated: events['last changed'] ?? null,
      expiry,
    };
  } catch {
    try {
      const res2 = await fetch(`https://rdap.org/domain/${domain.replace(/^www\./, '')}`);
      const data = await res2.json();
      const ns = data.nameservers?.map((n: any) => n.ldhName).join(', ') ?? '—';
      const events: Record<string, string> = {};
      (data.events ?? []).forEach((e: any) => { events[e.eventAction] = e.eventDate; });
      const status = (data.status ?? []).join(', ');
      return {
        domain: data.ldhName ?? domain, registrar: '—', status, ns,
        registered: events.registration,
        updated: events['last changed'] ?? null,
        expiry: events.expiration ?? null,
      };
    } catch { return null; }
  }
}

function WhoisRow({ label, value, icon, color, copyable, highlight }: {
  label: string; value: string; icon: React.ReactNode; color?: string; copyable?: boolean; highlight?: boolean;
}) {
  const { theme } = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: `${color || theme.primary}15` }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: theme.textMuted }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: highlight ? (color || theme.primary) : theme.textPrimary }]} selectable numberOfLines={3}>{value}</Text>
      </View>
      {copyable && (
        <TouchableOpacity onPress={() => Clipboard.setStringAsync(value)}>
          <CopyIcon size={14} color={theme.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function DomainStatusBadge({ status }: { status: string }) {
  const { theme } = useTheme();
  const statuses = status.split(', ').filter(Boolean);
  const isLocked = statuses.some(s => s.includes('clientTransferProhibited'));
  const isActive = statuses.some(s => s === 'ok' || s.includes('active'));
  const isHeld = statuses.some(s => s.includes('Hold') || s.includes('Suspended'));

  return (
    <View style={styles.statusBadgeRow}>
      {statuses.slice(0, 3).map(s => {
        const color = s.includes('Prohibited') || s.includes('Lock') ? '#FFBE5C'
          : s === 'ok' || s.includes('active') ? '#00E5A0'
          : s.includes('Hold') ? '#FF5C5C' : theme.textMuted;
        return (
          <View key={s} style={[styles.statusBadge, { backgroundColor: `${color}12`, borderColor: `${color}25` }]}>
            <Text style={[styles.statusBadgeText, { color }]}>{s.replace('client', '').replace('server', '')}</Text>
          </View>
        );
      })}
    </View>
  );
}

const LEARN_SECTIONS = [
  {
    title: 'WHOIS & RDAP',
    color: '#4F87FF',
    items: [
      'WHOIS (port 43): legacy plain-text protocol for domain registration queries',
      'RDAP: Registration Data Access Protocol — modern JSON-based successor',
      'NetScope uses RDAP for structured, reliable domain registration data',
      'Data comes from registrar + registry (Verisign for .com, .net)',
      'Not all TLDs support RDAP — .com/.net/.org have best coverage',
    ],
  },
  {
    title: 'Reading Domain Records',
    color: '#00D4FF',
    items: [
      'Registrar: company where domain was registered (GoDaddy, Namecheap, etc.)',
      'Nameservers (NS): where DNS zone file is hosted — reveals CDN/host',
      'Registration date: when domain was first registered',
      'Updated date: last change to registration record',
      'Expiry date: when domain expires — expired = available for takeover',
    ],
  },
  {
    title: 'Domain Status Codes',
    color: '#A855F7',
    items: [
      'ok: normal operational state, no restrictions',
      'clientTransferProhibited: locked against registrar transfer (standard security)',
      'clientUpdateProhibited: changes to registration data are blocked',
      'clientHold: domain suspended — often unpaid or legal dispute',
      'serverHold: registry-level hold — domain resolves to nothing',
      'pendingDelete: domain expiring and in grace period before release',
    ],
  },
  {
    title: 'OSINT & Recon',
    color: '#FFBE5C',
    items: [
      'Registrar reveals infrastructure relationships and vendor patterns',
      'NS records show hosting provider — route to CDN/cloud provider',
      'Creation date helps identify phishing domains (newly registered = suspicious)',
      'Expiry dates: attackers monitor soon-to-expire domains for takeover',
      'Privacy/GDPR redaction: registrant data may be hidden since 2018',
      'Tools: Maltego, SpiderFoot, DomainTools for automated WHOIS OSINT',
    ],
  },
];

export default function Whois() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [domain, setDomain] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const paddingTop = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const run = useCallback(async () => {
    if (!domain.trim() || running) return;
    setRunning(true); setError(''); setResult(null);
    const data = await fetchWhois(domain.trim());
    if (!data) setError('WHOIS lookup failed. Try a .com, .net, or .org domain.');
    else setResult(data);
    setRunning(false);
  }, [domain, running]);

  const formatDate = (d?: string) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); } catch { return d; }
  };

  const getDaysUntilExpiry = (expiry?: string) => {
    if (!expiry) return null;
    try {
      const diff = new Date(expiry).getTime() - Date.now();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    } catch { return null; }
  };

  const expiryDays = result?.expiry ? getDaysUntilExpiry(result.expiry) : null;
  const expiryColor = expiryDays === null ? theme.textMuted : expiryDays < 30 ? theme.error : expiryDays < 90 ? theme.warning : theme.success;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <LinearGradient colors={theme.gradientBg as [string, string, string]} style={StyleSheet.absoluteFill} />
      <View style={[styles.header, { paddingTop: paddingTop + spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <ArrowLeftIcon size={18} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>WHOIS Lookup</Text>
          <Text style={[styles.pageSub, { color: theme.textMuted }]}>Domain registration info via RDAP</Text>
        </View>
        <ToolLearnCard tool="WHOIS Lookup" tagline="Domain registration · RDAP · OSINT reconnaissance" sections={LEARN_SECTIONS} />
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
            <ServerIcon size={18} color="#FFFFFF" />
            <Text style={styles.runBtnText}>{running ? 'Looking up...' : 'WHOIS Lookup'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {error ? (
          <View style={[styles.errorCard, { backgroundColor: `${theme.error}10`, borderColor: `${theme.error}30` }]}>
            <Text style={[{ color: theme.error, fontSize: typography.sm }]}>{error}</Text>
          </View>
        ) : null}

        {result && (
          <>
            {/* Domain header card */}
            <View style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
              <View style={styles.cardHeader}>
                <LinearGradient colors={[theme.primary, theme.accent] as [string, string]} style={styles.domainIcon}>
                  <GlobeIcon size={18} color="#FFFFFF" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.domainName, { color: theme.textPrimary }]}>{result.domain?.toUpperCase()}</Text>
                  <Text style={[styles.domainSub, { color: theme.textMuted }]}>Domain Registration Record</Text>
                </View>
                {expiryDays !== null && (
                  <View style={[styles.expiryChip, { backgroundColor: `${expiryColor}15`, borderColor: `${expiryColor}25` }]}>
                    <Text style={[styles.expiryText, { color: expiryColor }]}>
                      {expiryDays > 0 ? `${expiryDays}d left` : 'EXPIRED'}
                    </Text>
                  </View>
                )}
              </View>

              <WhoisRow label="Registrar" value={result.registrar} icon={<ServerIcon size={13} color="#4F87FF" />} color="#4F87FF" />
              <WhoisRow label="Nameservers" value={result.ns} icon={<GlobeIcon size={13} color="#00D4FF" />} color="#00D4FF" copyable />
              <WhoisRow label="Registered" value={formatDate(result.registered)} icon={<ClockIcon size={13} color="#A855F7" />} color="#A855F7" />
              <WhoisRow label="Last Updated" value={formatDate(result.updated)} icon={<ClockIcon size={13} color="#FFBE5C" />} color="#FFBE5C" />
              {result.expiry && (
                <WhoisRow label="Expires" value={`${formatDate(result.expiry)}${expiryDays !== null ? ` (${expiryDays > 0 ? expiryDays + ' days)' : 'EXPIRED)'}` : ''}`}
                  icon={<ActivityIcon size={13} color={expiryColor} />} color={expiryColor} highlight={expiryDays !== null && expiryDays < 60} />
              )}
            </View>

            {/* Status card */}
            {result.status && (
              <View style={[styles.statusCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                <View style={[styles.statusHeader, { borderBottomColor: theme.border }]}>
                  <ShieldIcon size={13} color="#00E5A0" />
                  <Text style={[styles.statusTitle, { color: theme.textPrimary }]}>Domain Status</Text>
                </View>
                <View style={{ padding: spacing.md }}>
                  <DomainStatusBadge status={result.status} />
                </View>
              </View>
            )}
          </>
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
  card: { borderRadius: radius.xl, borderWidth: 1, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  domainIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  domainName: { fontSize: typography.md, fontWeight: typography.black, letterSpacing: 0.5 },
  domainSub: { fontSize: typography.xs, marginTop: 2 },
  expiryChip: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.full, borderWidth: 1 },
  expiryText: { fontSize: 11, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  rowIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  rowLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 2 },
  rowValue: { fontSize: typography.sm, fontWeight: typography.medium, lineHeight: 18 },
  statusCard: { borderRadius: radius.xl, borderWidth: 1, overflow: 'hidden' },
  statusHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  statusTitle: { fontSize: typography.sm, fontWeight: typography.bold },
  statusBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full, borderWidth: 1 },
  statusBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
});
