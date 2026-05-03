import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/contexts/ThemeContext';
import { typography, spacing, radius } from '@/constants/theme';
import { ArrowLeftIcon, GlobeIcon, ServerIcon, WifiIcon, MapIcon, CopyIcon, RefreshIcon, ShieldIcon, ZapIcon } from '@/components/icons/Icons';
import ToolLearnCard from '@/components/ui/ToolLearnCard';

interface IpInfo {
  ip: string; org: string; city: string; region: string; country: string;
  loc: string; timezone: string; postal: string; hostname: string;
  asn?: string; isp?: string; vpn?: boolean;
}

async function fetchIpInfo(): Promise<IpInfo | null> {
  try {
    const res = await fetch('https://ipinfo.io/json', { headers: { Accept: 'application/json' } });
    const data = await res.json();
    const asnMatch = data.org?.match(/^(AS\d+)/);
    return {
      ...data,
      asn: asnMatch?.[1] ?? null,
      isp: data.org?.replace(/^AS\d+\s*/, '') ?? null,
    };
  } catch {
    try {
      const ip = await (await fetch('https://api.ipify.org?format=json')).json();
      const geo = await (await fetch(`https://ipapi.co/${ip.ip}/json/`)).json();
      return {
        ip: ip.ip, org: geo.org || geo.asn || '—', city: geo.city || '—', region: geo.region || '—',
        country: geo.country_name || '—', loc: `${geo.latitude},${geo.longitude}`,
        timezone: geo.timezone || '—', postal: geo.postal || '—', hostname: '—',
        asn: geo.asn, isp: geo.org,
      };
    } catch { return null; }
  }
}

function InfoRow({ label, value, icon, color, onCopy }: {
  label: string; value: string; icon: React.ReactNode; color?: string; onCopy?: () => void;
}) {
  const { theme } = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: `${color || theme.primary}18` }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: theme.textMuted }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: theme.textPrimary }]} selectable>{value}</Text>
      </View>
      {onCopy && (
        <TouchableOpacity onPress={onCopy} style={styles.copyBtn}>
          <CopyIcon size={14} color={theme.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const LEARN_SECTIONS = [
  {
    title: 'IPv4 vs IPv6',
    color: '#4F87FF',
    items: [
      'IPv4: 32-bit address space = 4.3 billion addresses (e.g., 93.184.216.34)',
      'IPv6: 128-bit = 340 undecillion addresses (e.g., 2606:2800:220:1::93)',
      'IPv4 exhausted in 2011 — world migrating to IPv6 via dual-stack',
      'Private IPv4 ranges: 10.x, 172.16-31.x, 192.168.x (RFC 1918)',
      'NAT: your router translates many private IPs to one public IP',
    ],
  },
  {
    title: 'ASN & ISP Infrastructure',
    color: '#00D4FF',
    items: [
      'ASN (Autonomous System Number): unique identifier for each network on the internet',
      'ISPs, cloud providers (AWS/Google/Azure) and CDNs each have their own ASN',
      'BGP (Border Gateway Protocol) routes between ASNs — the glue of the internet',
      'Format: AS15169 = Google, AS16509 = Amazon, AS13335 = Cloudflare',
      'Shodan and Censys scan by ASN to find exposed services per organization',
    ],
  },
  {
    title: 'Geolocation Accuracy',
    color: '#A855F7',
    items: [
      'IP geolocation is based on ASN registration data and routing information',
      'Accuracy: country ~99%, city ~60-80% (especially wrong for mobile/VPN)',
      'CGNAT (Carrier-Grade NAT): ISP shares one IP among hundreds of users',
      'VPN exit node shows VPN provider\'s datacenter location, not yours',
      'TOR exit nodes often flagged in threat intelligence databases',
    ],
  },
  {
    title: 'Privacy & Security',
    color: '#00E5A0',
    items: [
      'Your public IP is visible to every server you connect to',
      'Dynamic IPs change periodically — residential users rotate on reconnect',
      'Static IPs: servers, businesses, some premium ISP plans',
      'IP can be subpoenaed from ISP — not private without VPN/TOR',
      'Dual-stack: your device may have both IPv4 and IPv6 simultaneously',
    ],
  },
];

export default function IpInfoScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [info, setInfo] = useState<IpInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const paddingTop = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const load = async () => {
    setLoading(true);
    const data = await fetchIpInfo();
    setInfo(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const isPrivateRange = (ip: string) => {
    return ip.startsWith('10.') || ip.startsWith('192.168.') || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <LinearGradient colors={theme.gradientBg as [string, string, string]} style={StyleSheet.absoluteFill} />
      <View style={[styles.header, { paddingTop: paddingTop + spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <ArrowLeftIcon size={18} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>IP Info</Text>
          <Text style={[styles.pageSub, { color: theme.textMuted }]}>Public IP · Geolocation · ASN · ISP</Text>
        </View>
        <TouchableOpacity onPress={load} style={[styles.refreshBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <RefreshIcon size={16} color={theme.primary} />
        </TouchableOpacity>
        <ToolLearnCard tool="IP Info" tagline="Public IP · ASN · geolocation · privacy context" sections={LEARN_SECTIONS} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={[styles.loadCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <Text style={[styles.loadText, { color: theme.textMuted }]}>Fetching IP information...</Text>
          </View>
        ) : !info ? (
          <View style={[styles.loadCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <Text style={{ color: theme.error, fontSize: typography.base }}>Failed to fetch IP info. Check your connection.</Text>
          </View>
        ) : (
          <>
            {/* Hero IP card */}
            <LinearGradient
              colors={[`${theme.primary}25`, `${theme.accent}15`] as [string, string]}
              style={[styles.heroCard, { borderColor: `${theme.primary}30` }]}
            >
              <Text style={[styles.heroLabel, { color: theme.primary }]}>YOUR PUBLIC IP</Text>
              <Text style={[styles.heroIp, { color: theme.textPrimary }]}>{info.ip}</Text>
              <View style={styles.heroBadgeRow}>
                <TouchableOpacity onPress={() => Clipboard.setStringAsync(info.ip)} style={[styles.heroCopy, { backgroundColor: `${theme.primary}20`, borderColor: `${theme.primary}30` }]}>
                  <CopyIcon size={14} color={theme.primary} />
                  <Text style={[styles.heroCopyText, { color: theme.primary }]}>Copy IP</Text>
                </TouchableOpacity>
                {info.ip.includes(':') ? (
                  <View style={[styles.versionBadge, { backgroundColor: `${theme.accent}15`, borderColor: `${theme.accent}30` }]}>
                    <Text style={[styles.versionText, { color: theme.accent }]}>IPv6</Text>
                  </View>
                ) : (
                  <View style={[styles.versionBadge, { backgroundColor: `${theme.primary}15`, borderColor: `${theme.primary}30` }]}>
                    <Text style={[styles.versionText, { color: theme.primary }]}>IPv4</Text>
                  </View>
                )}
                {isPrivateRange(info.ip) && (
                  <View style={[styles.versionBadge, { backgroundColor: `${theme.warning}15`, borderColor: `${theme.warning}30` }]}>
                    <Text style={[styles.versionText, { color: theme.warning }]}>PRIVATE</Text>
                  </View>
                )}
              </View>
            </LinearGradient>

            {/* ISP & Network */}
            {(info.asn || info.isp) && (
              <View style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
                <View style={[styles.cardSectionHeader, { borderBottomColor: theme.border }]}>
                  <ServerIcon size={13} color={theme.primary} />
                  <Text style={[styles.cardSectionTitle, { color: theme.textPrimary }]}>Network Provider</Text>
                </View>
                {info.asn && <InfoRow label="ASN" value={info.asn} icon={<ZapIcon size={14} color="#00D4FF" />} color="#00D4FF" onCopy={() => Clipboard.setStringAsync(info.asn!)} />}
                {info.isp && <InfoRow label="ISP / Organization" value={info.isp} icon={<ServerIcon size={14} color={theme.primary} />} color={theme.primary} onCopy={() => Clipboard.setStringAsync(info.isp!)} />}
                {info.hostname && info.hostname !== '—' && <InfoRow label="Hostname" value={info.hostname} icon={<GlobeIcon size={14} color="#4F87FF" />} color="#4F87FF" />}
              </View>
            )}

            {/* Location */}
            <View style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
              <View style={[styles.cardSectionHeader, { borderBottomColor: theme.border }]}>
                <MapIcon size={13} color="#00E5A0" />
                <Text style={[styles.cardSectionTitle, { color: theme.textPrimary }]}>Geolocation</Text>
                <Text style={[styles.cardSectionNote, { color: theme.textMuted }]}>approx. accuracy</Text>
              </View>
              <InfoRow label="City" value={info.city || '—'} icon={<MapIcon size={14} color="#00E5A0" />} color="#00E5A0" />
              <InfoRow label="Region / State" value={info.region || '—'} icon={<MapIcon size={14} color="#00D4FF" />} color="#00D4FF" />
              <InfoRow label="Country" value={info.country || '—'} icon={<GlobeIcon size={14} color="#A855F7" />} color="#A855F7" />
              <InfoRow label="Coordinates" value={info.loc || '—'} icon={<MapIcon size={14} color="#FFBE5C" />} color="#FFBE5C" onCopy={() => info.loc && Clipboard.setStringAsync(info.loc)} />
              <InfoRow label="Postal Code" value={info.postal || '—'} icon={<GlobeIcon size={14} color={theme.textMuted} />} />
              <InfoRow label="Timezone" value={info.timezone || '—'} icon={<WifiIcon size={14} color="#FF5C8A" />} color="#FF5C8A" />
            </View>

            {/* Privacy alert for public facing */}
            {!isPrivateRange(info.ip) && (
              <LinearGradient
                colors={[`${theme.warning}10`, 'transparent'] as [string, string]}
                style={[styles.noteCard, { borderColor: `${theme.warning}25` }]}
              >
                <ShieldIcon size={14} color={theme.warning} />
                <Text style={[styles.noteText, { color: theme.textSecondary }]}>
                  This IP is publicly visible to every server you connect to. Use a VPN to mask your location and ISP.
                </Text>
              </LinearGradient>
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
  refreshBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  pageTitle: { fontSize: typography.lg, fontWeight: typography.bold },
  pageSub: { fontSize: typography.xs, marginTop: 1 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  loadCard: { padding: spacing.xl, borderRadius: radius.xl, borderWidth: 1, alignItems: 'center' },
  loadText: { fontSize: typography.base },
  heroCard: { borderRadius: radius.xl, borderWidth: 1, padding: spacing.xl, alignItems: 'center', gap: spacing.sm },
  heroLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  heroIp: { fontSize: 32, fontWeight: '900', letterSpacing: -1, fontVariant: ['tabular-nums'], textAlign: 'center' },
  heroBadgeRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 },
  heroCopy: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1 },
  heroCopyText: { fontSize: typography.xs, fontWeight: typography.semibold },
  versionBadge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1, justifyContent: 'center' },
  versionText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  card: { borderRadius: radius.xl, borderWidth: 1, overflow: 'hidden' },
  cardSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  cardSectionTitle: { flex: 1, fontSize: typography.sm, fontWeight: typography.bold },
  cardSectionNote: { fontSize: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 2 },
  rowValue: { fontSize: typography.sm, fontWeight: typography.semibold },
  copyBtn: { padding: 6 },
  noteCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.lg, borderWidth: 1 },
  noteText: { flex: 1, fontSize: 11, lineHeight: 16 },
});
