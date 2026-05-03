import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/contexts/ThemeContext';
import { useActivity } from '@/contexts/ActivityContext';
import { typography, spacing, radius } from '@/constants/theme';
import { ArrowLeftIcon, ShieldIcon, GlobeIcon, CopyIcon, ZapIcon, ClockIcon } from '@/components/icons/Icons';
import ToolLearnCard from '@/components/ui/ToolLearnCard';
import ToolExportButton from '@/components/ui/ToolExportButton';

interface CertInfo {
  domain: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  daysLeft: number;
  serialNumber: string;
  subjectAltNames: string[];
  grade: 'A+' | 'A' | 'B' | 'C' | 'Expired' | 'Unknown';
}

interface HeaderInfo {
  hsts: boolean;
  hstsAge: string | null;
  csp: boolean;
  xfo: string | null;
  xcto: boolean;
  referrer: string | null;
}

async function checkSsl(domain: string): Promise<{ cert: CertInfo | null; headers: HeaderInfo | null; error?: string }> {
  const clean = domain.replace(/^https?:\/\//, '').split('/')[0].trim();

  let cert: CertInfo | null = null;
  try {
    const res = await fetch(`https://crt.sh/?q=${encodeURIComponent(clean)}&output=json`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data: any[] = await res.json();
      if (data.length > 0) {
        const latest = data.sort((a, b) => new Date(b.not_before).getTime() - new Date(a.not_before).getTime())[0];
        const validTo = new Date(latest.not_after);
        const daysLeft = Math.ceil((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const grade: CertInfo['grade'] = daysLeft <= 0 ? 'Expired'
          : daysLeft > 60 ? 'A+'
          : daysLeft > 30 ? 'A'
          : daysLeft > 14 ? 'B'
          : 'C';
        const sans = (latest.name_value || '').split('\n').filter((v: string) => v.trim() !== clean).slice(0, 8);
        cert = {
          domain: clean,
          issuer: latest.issuer_name?.match(/O=([^,]+)/)?.[1]?.trim() ?? (latest.issuer_name ?? '—'),
          validFrom: latest.not_before,
          validTo: latest.not_after,
          daysLeft,
          serialNumber: latest.serial_number ?? '—',
          subjectAltNames: sans,
          grade,
        };
      }
    }
  } catch {}

  let headers: HeaderInfo | null = null;
  try {
    const res = await fetch(`https://${clean}`, { method: 'HEAD', cache: 'no-store' });
    const h = res.headers;
    const hstsRaw = h.get('strict-transport-security') ?? h.get('Strict-Transport-Security');
    const maxAgeMatch = hstsRaw?.match(/max-age=(\d+)/);
    headers = {
      hsts: !!hstsRaw,
      hstsAge: maxAgeMatch ? `${Math.round(parseInt(maxAgeMatch[1], 10) / 86400)} days` : null,
      csp: !!(h.get('content-security-policy') ?? h.get('Content-Security-Policy')),
      xfo: h.get('x-frame-options') ?? h.get('X-Frame-Options'),
      xcto: !!(h.get('x-content-type-options') ?? h.get('X-Content-Type-Options')),
      referrer: h.get('referrer-policy') ?? h.get('Referrer-Policy'),
    };
  } catch {}

  if (!cert && !headers) {
    return { cert: null, headers: null, error: 'Could not connect to domain. Ensure it is a valid HTTPS domain.' };
  }
  return { cert, headers };
}

function GradeBox({ grade }: { grade: CertInfo['grade'] }) {
  const { theme } = useTheme();
  const color = grade === 'A+' || grade === 'A' ? theme.success : grade === 'B' ? '#4F87FF' : grade === 'C' ? theme.warning : theme.error;
  return (
    <View style={[styles.gradeBox, { backgroundColor: `${color}15`, borderColor: `${color}30` }]}>
      <Text style={[styles.gradeText, { color }]}>{grade}</Text>
    </View>
  );
}

function HeaderCheck({ label, ok, detail }: { label: string; ok: boolean; detail?: string | null }) {
  const { theme } = useTheme();
  const color = ok ? theme.success : theme.error;
  return (
    <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
      <View style={[styles.headerDot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.headerLabel, { color: theme.textPrimary }]}>{label}</Text>
        {detail && <Text style={[styles.headerDetail, { color: theme.textMuted }]}>{detail}</Text>}
      </View>
      <Text style={[styles.headerStatus, { color }]}>{ok ? 'Present' : 'Missing'}</Text>
    </View>
  );
}

const LEARN_SECTIONS = [
  {
    title: 'TLS/SSL Fundamentals',
    color: '#00E5A0',
    items: [
      'TLS (Transport Layer Security) encrypts all data between client and server',
      'SSL (deprecated) is the predecessor — modern sites use TLS 1.2 or 1.3',
      'Certificates prove identity: issued by a CA (Certificate Authority)',
      'Chain of trust: Root CA → Intermediate CA → Leaf certificate (your domain)',
      'Common CAs: DigiCert, Let\'s Encrypt (free), Sectigo, GlobalSign',
    ],
  },
  {
    title: 'Certificate Grades',
    color: '#4F87FF',
    items: [
      'A+: cert valid >60 days + HSTS + strong cipher suite',
      'A: valid >30 days, all security headers present',
      'B: cert valid but minor issues (missing HSTS or CSP)',
      'C: cert valid <14 days — renew immediately',
      'F/Expired: certificate is expired — browser will block access',
    ],
  },
  {
    title: 'Security Headers',
    color: '#A855F7',
    items: [
      'HSTS: tells browser to always use HTTPS — prevents downgrade attacks',
      'CSP: Content Security Policy — prevents XSS by allowlisting resources',
      'X-Frame-Options: prevents clickjacking by blocking iframe embedding',
      'X-Content-Type-Options: nosniff — stops MIME-type sniffing attacks',
      'Referrer-Policy: controls how much of the URL is sent in Referer header',
    ],
  },
  {
    title: 'Certificate Transparency',
    color: '#FFBE5C',
    items: [
      'CT Logs: public append-only logs of every issued certificate',
      'Prevents CAs from issuing secret/rogue certificates for your domain',
      'crt.sh: public search engine for CT log database',
      'Wildcard certs (*. domain) cover all first-level subdomains',
      'SAN (Subject Alternative Names): one cert can cover multiple domains',
    ],
  },
];

export default function SslChecker() {
  const { theme } = useTheme();
  const { logActivity } = useActivity();
  const insets = useSafeAreaInsets();
  const [domain, setDomain] = useState('');
  const [running, setRunning] = useState(false);
  const [cert, setCert] = useState<CertInfo | null>(null);
  const [headers, setHeaders] = useState<HeaderInfo | null>(null);
  const [error, setError] = useState('');
  const paddingTop = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const run = useCallback(async () => {
    if (!domain.trim() || running) return;
    setRunning(true); setError(''); setCert(null); setHeaders(null);
    const result = await checkSsl(domain.trim());
    if (result.error) setError(result.error);
    else {
      setCert(result.cert);
      setHeaders(result.headers);
      await logActivity('security_audit', 'SSL Check', `Checked ${domain.trim()}`, '/tool/ssl');
    }
    setRunning(false);
  }, [domain, running, logActivity]);

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return d; }
  };

  const exportData = cert ? {
    ssl: {
      domain: cert.domain,
      grade: cert.grade,
      issuer: cert.issuer,
      expiresInDays: cert.daysLeft,
      headers: headers ? {
        hsts: headers.hsts,
        csp: headers.csp,
        xfo: headers.xfo,
        xcto: headers.xcto,
        referrer: headers.referrer,
      } : undefined,
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
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>SSL Checker</Text>
          <Text style={[styles.pageSub, { color: theme.textMuted }]}>Certificate info · security headers · CT logs</Text>
        </View>
        <ToolLearnCard tool="SSL Checker" tagline="TLS certificates · security headers · cert transparency" sections={LEARN_SECTIONS} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]} showsVerticalScrollIndicator={false}>

        <View style={[styles.inputCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <ShieldIcon size={18} color={theme.primary} />
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
            <ShieldIcon size={18} color="#FFFFFF" />
            <Text style={styles.runBtnText}>{running ? 'Checking SSL…' : 'Check SSL'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {error ? (
          <View style={[styles.errorCard, { backgroundColor: `${theme.error}10`, borderColor: `${theme.error}30` }]}>
            <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
          </View>
        ) : null}

        {cert && (
          <View style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <View style={styles.certHeader}>
              <LinearGradient colors={[theme.primary, theme.accent] as [string, string]} style={styles.certIcon}>
                <ShieldIcon size={18} color="#FFF" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[styles.certDomain, { color: theme.textPrimary }]}>{cert.domain}</Text>
                <Text style={[styles.certIssuer, { color: theme.textMuted }]}>{cert.issuer}</Text>
              </View>
              <GradeBox grade={cert.grade} />
            </View>

            <View style={[styles.certRow, { borderTopColor: theme.border }]}>
              <ClockIcon size={13} color={cert.daysLeft > 30 ? theme.success : theme.error} />
              <Text style={[styles.certRowLabel, { color: theme.textMuted }]}>Valid until</Text>
              <Text style={[styles.certRowValue, { color: cert.daysLeft > 30 ? theme.success : theme.error }]}>
                {formatDate(cert.validTo)} ({cert.daysLeft > 0 ? `${cert.daysLeft} days` : 'EXPIRED'})
              </Text>
            </View>
            <View style={[styles.certRow, { borderTopColor: theme.border }]}>
              <ClockIcon size={13} color={theme.textMuted} />
              <Text style={[styles.certRowLabel, { color: theme.textMuted }]}>Issued</Text>
              <Text style={[styles.certRowValue, { color: theme.textSecondary }]}>{formatDate(cert.validFrom)}</Text>
            </View>
            <View style={[styles.certRow, { borderTopColor: theme.border }]}>
              <GlobeIcon size={13} color={theme.textMuted} />
              <Text style={[styles.certRowLabel, { color: theme.textMuted }]}>Serial</Text>
              <TouchableOpacity onPress={() => Clipboard.setStringAsync(cert.serialNumber)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[styles.certRowValue, { color: theme.textSecondary, fontFamily: 'monospace', flex: 1 }]} numberOfLines={1}>{cert.serialNumber}</Text>
                <CopyIcon size={12} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            {cert.subjectAltNames.length > 0 && (
              <View style={[styles.sansRow, { borderTopColor: theme.border }]}>
                <Text style={[styles.certRowLabel, { color: theme.textMuted }]}>Alt Names</Text>
                <View style={styles.sansList}>
                  {cert.subjectAltNames.map((s, i) => (
                    <View key={i} style={[styles.sanBadge, { backgroundColor: `${theme.primary}15`, borderColor: `${theme.primary}25` }]}>
                      <Text style={[styles.sanText, { color: theme.primary }]}>{s}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {headers && (
          <View style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <View style={[styles.cardSectionHeader, { borderBottomColor: theme.border }]}>
              <ZapIcon size={14} color={theme.primary} />
              <Text style={[styles.cardSectionTitle, { color: theme.textPrimary }]}>Security Headers</Text>
            </View>
            <HeaderCheck label="HSTS" ok={headers.hsts} detail={headers.hstsAge ? `max-age=${headers.hstsAge}` : undefined} />
            <HeaderCheck label="Content Security Policy" ok={headers.csp} />
            <HeaderCheck label="X-Frame-Options" ok={!!headers.xfo} detail={headers.xfo ?? undefined} />
            <HeaderCheck label="X-Content-Type-Options" ok={headers.xcto} detail={headers.xcto ? 'nosniff' : undefined} />
            <HeaderCheck label="Referrer-Policy" ok={!!headers.referrer} detail={headers.referrer ?? undefined} />
          </View>
        )}

        {!cert && !headers && !error && !running && (
          <View style={[styles.emptyCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <ShieldIcon size={36} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>SSL Certificate Inspector</Text>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              Checks TLS certificate validity, issuer, expiry, Subject Alternative Names, and security headers for any HTTPS domain.
            </Text>
          </View>
        )}

        {(cert || headers) && !running && (
          <ToolExportButton data={exportData} label="Export SSL Report (PDF)" />
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
  card: { borderRadius: radius.xl, borderWidth: 1, overflow: 'hidden' },
  certHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  certIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  certDomain: { fontSize: typography.base, fontWeight: typography.bold },
  certIssuer: { fontSize: typography.xs, marginTop: 2 },
  gradeBox: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  gradeText: { fontSize: typography.md, fontWeight: '900', letterSpacing: -0.5 },
  certRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  certRowLabel: { fontSize: typography.xs, width: 56, fontWeight: '600' },
  certRowValue: { flex: 1, fontSize: typography.sm, fontWeight: typography.medium },
  sansRow: { padding: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, gap: spacing.sm },
  sansList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: 4 },
  sanBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  sanText: { fontSize: 10, fontWeight: '600' },
  cardSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  cardSectionTitle: { fontSize: typography.sm, fontWeight: typography.bold },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  headerDot: { width: 8, height: 8, borderRadius: 4 },
  headerLabel: { fontSize: typography.sm, fontWeight: typography.medium },
  headerDetail: { fontSize: 10, marginTop: 2 },
  headerStatus: { fontSize: 11, fontWeight: '700' },
  emptyCard: { borderRadius: radius.xl, borderWidth: 1, padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  emptyTitle: { fontSize: typography.md, fontWeight: typography.bold },
  emptyText: { fontSize: typography.sm, textAlign: 'center', lineHeight: 20 },
});
