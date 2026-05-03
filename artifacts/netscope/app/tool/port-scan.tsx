import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { typography, spacing, radius } from '@/constants/theme';
import { ArrowLeftIcon, SearchIcon, ShieldIcon, ServerIcon } from '@/components/icons/Icons';
import { scanPorts, PortResult } from '@/services/portService';
import ToolLearnCard from '@/components/ui/ToolLearnCard';

const PRESETS = [
  { label: 'Common', ports: [21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 8080, 8443] },
  { label: 'Web', ports: [80, 443, 8080, 8443, 3000, 5000, 8000, 8888] },
  { label: 'Database', ports: [1433, 1521, 3306, 5432, 5984, 6379, 27017] },
];

const STATUS_COLORS: Record<string, string> = {
  open: '#00E5A0',
  closed: '#354770',
  filtered: '#FFBE5C',
};

const SERVICE_RISK: Record<number, { risk: 'HIGH' | 'MED' | 'LOW'; note: string }> = {
  21: { risk: 'HIGH', note: 'FTP — sends credentials in plaintext' },
  22: { risk: 'MED', note: 'SSH — secure but brute-force target' },
  23: { risk: 'HIGH', note: 'Telnet — unencrypted remote access' },
  25: { risk: 'HIGH', note: 'SMTP — can be abused for spam relay' },
  3389: { risk: 'HIGH', note: 'RDP — frequent ransomware attack vector' },
  445: { risk: 'HIGH', note: 'SMB — EternalBlue/WannaCry vector' },
  3306: { risk: 'MED', note: 'MySQL — should never be internet-facing' },
  5432: { risk: 'MED', note: 'PostgreSQL — restrict to localhost' },
  80: { risk: 'LOW', note: 'HTTP — unencrypted web traffic' },
  443: { risk: 'LOW', note: 'HTTPS — standard encrypted web' },
};

function PortRow({ result }: { result: PortResult }) {
  const { theme } = useTheme();
  const color = STATUS_COLORS[result.status] ?? theme.textMuted;
  const risk = SERVICE_RISK[result.port];
  const riskColor = risk?.risk === 'HIGH' ? '#FF5C5C' : risk?.risk === 'MED' ? '#FFBE5C' : '#00E5A0';
  return (
    <View style={[styles.portRow, { borderBottomColor: theme.border }]}>
      <View style={[styles.portBadge, { backgroundColor: `${color}15`, borderColor: `${color}25` }]}>
        <Text style={[styles.portNum, { color }]}>{result.port}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.serviceName, { color: theme.textPrimary }]}>{result.service || 'Unknown'}</Text>
        <Text style={[styles.portProto, { color: theme.textMuted }]}>
          TCP{risk ? ` · ${risk.note}` : ''}
        </Text>
      </View>
      {risk && result.status === 'open' && (
        <View style={[styles.riskBadge, { backgroundColor: `${riskColor}15`, borderColor: `${riskColor}25` }]}>
          <Text style={[styles.riskText, { color: riskColor }]}>{risk.risk}</Text>
        </View>
      )}
      <View style={[styles.statusDot, { backgroundColor: color, shadowColor: color }]} />
      <Text style={[styles.statusText, { color }]}>{result.status.toUpperCase()}</Text>
    </View>
  );
}

const LEARN_SECTIONS = [
  {
    title: 'What is a Port?',
    color: '#4F87FF',
    items: [
      'Ports are virtual endpoints for network communication (0–65535 total)',
      'Well-known ports 0–1023: reserved for standard services (SSH=22, HTTP=80)',
      'Registered ports 1024–49151: application services (MySQL=3306, Redis=6379)',
      'Dynamic/ephemeral ports 49152–65535: temporary client connections',
      'TCP ports require a 3-way handshake; UDP ports are connectionless',
    ],
  },
  {
    title: 'TCP Probe Responses',
    color: '#00E5A0',
    items: [
      'OPEN: SYN sent → SYN-ACK received (service is actively listening)',
      'CLOSED: SYN sent → RST-ACK received (port reachable but no service)',
      'FILTERED: No response / ICMP error (firewall dropping packets)',
      'This tool uses TCP connect probes — no raw socket access needed',
      'Nmap uses SYN scans (stealth); this uses full connect (detectable)',
    ],
  },
  {
    title: 'Dangerous Open Ports',
    color: '#FF5C5C',
    items: [
      'Port 23 (Telnet): plaintext credentials — always disable if found open',
      'Port 3389 (RDP): #1 ransomware entry point — restrict to VPN only',
      'Port 445 (SMB): EternalBlue/WannaCry — keep patched, block externally',
      'Port 21 (FTP): use SFTP (port 22) or FTPS instead',
      'Port 25 (SMTP): open relays allow spammers — restrict to authenticated use',
    ],
  },
  {
    title: 'Ethical Hacking Context',
    color: '#A855F7',
    items: [
      'Port scanning is Phase 1 (Reconnaissance) in pentesting methodology',
      'Used in CTF competitions to identify services and attack surface',
      'CVE databases cross-reference open services with known vulnerabilities',
      'Combine with service banner grabbing (netcat) to fingerprint versions',
      'Tools: Nmap, Masscan, Shodan (internet-wide scans)',
    ],
  },
];

export default function PortScan() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [host, setHost] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<PortResult[]>([]);
  const [progress, setProgress] = useState(0);
  const paddingTop = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const run = useCallback(async () => {
    if (!host.trim() || running) return;
    setRunning(true); setResults([]); setProgress(0);
    const ports = PRESETS[selectedPreset].ports;
    try {
      const res = await scanPorts(host.trim(), ports, (done) => setProgress(done / ports.length));
      setResults(res);
    } catch { setResults([]); }
    setRunning(false); setProgress(1);
  }, [host, selectedPreset, running]);

  const open = results.filter(r => r.status === 'open');
  const filtered = results.filter(r => r.status === 'filtered');
  const highRisk = open.filter(r => SERVICE_RISK[r.port]?.risk === 'HIGH');

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <LinearGradient colors={theme.gradientBg as [string, string, string]} style={StyleSheet.absoluteFill} />
      <View style={[styles.header, { paddingTop: paddingTop + spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <ArrowLeftIcon size={18} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Port Scanner</Text>
          <Text style={[styles.pageSub, { color: theme.textMuted }]}>TCP port probe · Service risk analysis</Text>
        </View>
        <ToolLearnCard tool="Port Scanner" tagline="TCP probe · reconnaissance · service risk analysis" sections={LEARN_SECTIONS} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]} showsVerticalScrollIndicator={false}>

        <View style={[styles.configCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <Text style={[styles.configLabel, { color: theme.textMuted }]}>TARGET HOST / IP</Text>
          <View style={[styles.inputRow, { backgroundColor: theme.bgInput, borderColor: theme.border }]}>
            <ServerIcon size={16} color={theme.textMuted} />
            <TextInput
              value={host}
              onChangeText={setHost}
              placeholder="192.168.1.1 or hostname"
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { color: theme.textPrimary }]}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <Text style={[styles.configLabel, { color: theme.textMuted, marginTop: 4 }]}>PORT PRESET</Text>
          <View style={styles.presetRow}>
            {PRESETS.map((p, i) => (
              <TouchableOpacity
                key={p.label} onPress={() => setSelectedPreset(i)}
                style={[styles.presetBtn, { borderColor: selectedPreset === i ? theme.primary : theme.border, backgroundColor: selectedPreset === i ? `${theme.primary}18` : 'transparent' }]}
              >
                <Text style={[styles.presetLabel, { color: selectedPreset === i ? theme.primary : theme.textMuted }]}>{p.label}</Text>
                <Text style={[styles.presetCount, { color: selectedPreset === i ? `${theme.primary}90` : theme.textMuted }]}>{p.ports.length}p</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {running && (
          <View style={[styles.progressCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[styles.configLabel, { color: theme.textMuted }]}>SCANNING...</Text>
              <Text style={[styles.configLabel, { color: theme.primary }]}>{Math.round(progress * 100)}%</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: theme.bgInput }]}>
              <LinearGradient colors={[theme.primary, theme.accent] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
            </View>
          </View>
        )}

        {highRisk.length > 0 && (
          <LinearGradient colors={['rgba(255,92,92,0.12)', 'rgba(255,92,92,0.05)'] as [string, string]} style={[styles.alertCard, { borderColor: 'rgba(255,92,92,0.3)' }]}>
            <ShieldIcon size={16} color="#FF5C5C" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertTitle, { color: '#FF5C5C' }]}>High-Risk Ports Detected</Text>
              <Text style={[styles.alertSub, { color: theme.textSecondary }]}>
                {highRisk.map(r => `${r.port} (${r.service})`).join(', ')} — review access immediately
              </Text>
            </View>
          </LinearGradient>
        )}

        {results.length > 0 && (
          <View style={styles.summaryRow}>
            {[
              { label: 'Open', count: open.length, color: '#00E5A0' },
              { label: 'Filtered', count: filtered.length, color: '#FFBE5C' },
              { label: 'Closed', count: results.length - open.length - filtered.length, color: '#354770' },
              { label: 'Total', count: results.length, color: theme.primary },
            ].map(s => (
              <View key={s.label} style={[styles.summaryChip, { backgroundColor: theme.bgSurface, borderColor: `${s.color}25` }]}>
                <Text style={[styles.summaryCount, { color: s.color }]}>{s.count}</Text>
                <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {results.length > 0 && (
          <View style={[styles.resultsCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <View style={[styles.resultsHeader, { borderBottomColor: theme.border }]}>
              <ShieldIcon size={14} color={theme.primary} />
              <Text style={[styles.resultsHeaderText, { color: theme.textPrimary }]}>Scan Results</Text>
              <Text style={[styles.resultsHeaderText, { color: theme.textMuted, fontWeight: '400', marginLeft: 'auto' as any }]}>
                {open.length} open
              </Text>
            </View>
            {results.filter(r => r.status === 'open').map((r) => <PortRow key={r.port} result={r} />)}
            {results.filter(r => r.status === 'filtered').map((r) => <PortRow key={r.port} result={r} />)}
            {results.filter(r => r.status === 'closed').slice(0, 5).map((r) => <PortRow key={r.port} result={r} />)}
            {results.filter(r => r.status === 'closed').length > 5 && (
              <Text style={[styles.moreText, { color: theme.textMuted }]}>+{results.filter(r => r.status === 'closed').length - 5} closed ports</Text>
            )}
          </View>
        )}

        <TouchableOpacity onPress={run} disabled={running || !host.trim()} activeOpacity={0.85}>
          <LinearGradient
            colors={host.trim() && !running ? [theme.primary, theme.accent] as [string, string] : ['#333', '#555'] as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.runBtn}
          >
            <SearchIcon size={18} color="#FFFFFF" />
            <Text style={styles.runBtnText}>{running ? 'Scanning...' : 'Start Scan'}</Text>
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
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: 12, borderRadius: radius.md, borderWidth: 1 },
  input: { flex: 1, fontSize: typography.base, padding: 0 },
  presetRow: { flexDirection: 'row', gap: spacing.sm },
  presetBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, alignItems: 'center' },
  presetLabel: { fontSize: typography.sm, fontWeight: typography.bold },
  presetCount: { fontSize: 10, marginTop: 2 },
  progressCard: { borderRadius: radius.xl, borderWidth: 1, padding: spacing.md, gap: spacing.sm },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  alertCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  alertTitle: { fontSize: typography.sm, fontWeight: typography.bold },
  alertSub: { fontSize: 11, marginTop: 2, lineHeight: 16 },
  summaryRow: { flexDirection: 'row', gap: spacing.sm },
  summaryChip: { flex: 1, alignItems: 'center', padding: spacing.sm, borderRadius: radius.lg, borderWidth: 1, gap: 3 },
  summaryCount: { fontSize: typography.md, fontWeight: typography.black },
  summaryLabel: { fontSize: 10, fontWeight: '600' },
  resultsCard: { borderRadius: radius.xl, borderWidth: 1, overflow: 'hidden' },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  resultsHeaderText: { fontSize: typography.sm, fontWeight: typography.bold },
  portRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  portBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.md, borderWidth: 1, minWidth: 52, alignItems: 'center' },
  portNum: { fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
  serviceName: { fontSize: typography.sm, fontWeight: typography.semibold },
  portProto: { fontSize: 10, marginTop: 1 },
  riskBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, borderWidth: 1 },
  riskText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5, shadowOpacity: 0.7, shadowRadius: 4, shadowOffset: { width: 0, height: 0 }, elevation: 2 },
  statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, width: 52, textAlign: 'right' },
  moreText: { textAlign: 'center', padding: spacing.md, fontSize: typography.sm },
  runBtn: { height: 54, borderRadius: radius.full, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  runBtnText: { color: '#FFFFFF', fontSize: typography.base, fontWeight: typography.bold },
});
