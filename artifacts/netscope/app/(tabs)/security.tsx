import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/contexts/ThemeContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { typography, spacing, radius } from '@/constants/theme';

import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import Badge from '@/components/ui/Badge';
import ProgressRing from '@/components/ui/ProgressRing';
import ISPOutageDetector from '@/components/security/ISPOutageDetector';
import { AlertTriangleIcon, CheckCircleIcon, ShieldIcon, ZapIcon, ServerIcon } from '@/components/icons/Icons';
import { runSecurityAudit } from '@/services/securityService';
import { SecurityAuditResult, SecurityFinding } from '@/types';

function ThreatCard({ finding }: { finding: SecurityFinding }) {
  const { theme } = useTheme();
  const [showFix, setShowFix] = useState(false);
  const variant = finding.severity === 'critical' ? 'error' : finding.severity === 'warning' ? 'warning' : 'info';
  const Icon = finding.severity === 'critical' ? AlertTriangleIcon : finding.severity === 'warning' ? AlertTriangleIcon : CheckCircleIcon;
  const color = finding.severity === 'critical' ? theme.error : finding.severity === 'warning' ? theme.warning : theme.info;

  return (
    <GlassCard padded={false}>
      <View style={styles.threatHeader}>
        <Icon size={18} color={color} />
        <View style={{ flex: 1 }}>
          <View style={styles.threatTitleRow}>
            <Text style={[styles.threatTitle, { color: theme.textPrimary }]}>{finding.title}</Text>
            <Badge label={finding.severity.toUpperCase()} variant={variant} />
          </View>
          <Text style={[styles.threatDesc, { color: theme.textMuted }]}>{finding.description}</Text>
        </View>
      </View>
      {showFix && (
        <View style={[styles.remediation, { backgroundColor: theme.bgInput, borderTopColor: theme.border }]}>
          <Text style={[styles.remTitle, { color: theme.textSecondary }]}>How to fix</Text>
          <Text style={[styles.remText, { color: theme.textMuted }]}>{finding.remediation}</Text>
        </View>
      )}
      <TouchableOpacity
        style={[styles.fixBtn, { borderTopColor: theme.border }]}
        onPress={() => setShowFix(s => !s)}
      >
        <Text style={[styles.fixBtnText, { color: theme.primary }]}>
          {showFix ? 'Hide fix' : 'How to fix →'}
        </Text>
      </TouchableOpacity>
    </GlassCard>
  );
}

const COMMON_OUIS: Record<string, string> = {
  'D8:07:B6': 'TP-Link', 'EC:08:6B': 'TP-Link', '50:C7:BF': 'TP-Link',
  'B0:4E:26': 'Netgear', 'A0:04:60': 'Netgear', 'C4:04:15': 'Netgear',
  '00:1A:2B': 'Netgear', '28:C6:8E': 'Netgear',
  '00:18:E7': 'Asus', '10:BF:48': 'Asus', '2C:FD:A1': 'Asus',
  '00:26:BB': 'Apple', 'A8:20:66': 'Apple', 'F0:18:98': 'Apple',
  '00:1F:33': 'Linksys', '00:14:BF': 'Linksys', 'C0:56:27': 'Cisco',
  '00:50:F2': 'Microsoft', '28:18:78': 'D-Link', '14:D6:4D': 'D-Link',
  '00:1E:E5': 'D-Link',  'CC:2D:E0': 'Huawei', 'F8:01:13': 'Huawei',
  '00:90:A9': 'Ubiquiti', 'F4:92:BF': 'Ubiquiti', 'FC:EC:DA': 'Ubiquiti',
};

function getVendor(mac?: string): string {
  if (!mac) return 'Unknown Vendor';
  const oui = mac.substring(0, 8).toUpperCase();
  return COMMON_OUIS[oui] ?? 'Unknown Vendor';
}

interface ArpSpoofResult {
  status: 'clean' | 'warning' | 'danger';
  summary: string;
  findings: string[];
}

interface RouterAuditResult {
  ip: string;
  vendor: string;
  mac: string;
  openAdminPorts: { port: number; url: string; label: string }[];
  riskyServices: { port: number; name: string; severity: 'high' | 'medium' }[];
  exposedAdmin: boolean;
}

async function probeHttp(ip: string, port: number): Promise<boolean> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 2500);
  try {
    const proto = port === 443 || port === 8443 ? 'https' : 'http';
    await fetch(`${proto}://${ip}:${port}`, { method: 'HEAD', signal: controller.signal, cache: 'no-store' });
    clearTimeout(tid);
    return true;
  } catch (e: any) {
    clearTimeout(tid);
    if (e?.name === 'AbortError') return false;
    const msg = e?.message ?? '';
    if (msg.includes('Network request failed') || msg.includes('Failed to fetch')) return true;
    return false;
  }
}

function detectArpSpoofing(devices: any[], gatewayIP: string): ArpSpoofResult {
  if (devices.length === 0) {
    return {
      status: 'warning',
      summary: 'No LAN scan data. Run a LAN scan in the Scanner tab first.',
      findings: [],
    };
  }

  const findings: string[] = [];

  const macToIPs: Record<string, string[]> = {};
  for (const d of devices) {
    const mac = d.mac?.trim();
    if (!mac || mac === '—' || mac === 'Unknown') continue;
    if (!macToIPs[mac]) macToIPs[mac] = [];
    macToIPs[mac].push(d.ip);
  }

  for (const [mac, ips] of Object.entries(macToIPs)) {
    if (ips.length > 1) {
      findings.push(`MAC ${mac} claimed by ${ips.length} IPs: ${ips.join(', ')} — possible ARP poisoning`);
    }
  }

  const gatewayClaimants = devices.filter(d => d.ip === gatewayIP);
  if (gatewayClaimants.length > 1) {
    findings.push(`${gatewayClaimants.length} devices responding as gateway (${gatewayIP}) — suspicious`);
  }

  if (findings.length === 0) {
    return { status: 'clean', summary: `Scanned ${devices.length} device${devices.length !== 1 ? 's' : ''} — no ARP anomalies detected`, findings: [] };
  }
  return {
    status: findings.length >= 2 ? 'danger' : 'warning',
    summary: `Found ${findings.length} ARP anomal${findings.length !== 1 ? 'ies' : 'y'}`,
    findings,
  };
}

async function auditRouter(gatewayIP: string, gatewayMAC?: string): Promise<RouterAuditResult> {
  const HTTP_PORTS = [
    { port: 80, label: 'HTTP Admin' },
    { port: 443, label: 'HTTPS Admin' },
    { port: 8080, label: 'Alt HTTP' },
    { port: 8443, label: 'Alt HTTPS' },
  ];

  const openAdminPorts: RouterAuditResult['openAdminPorts'] = [];
  const riskyServices: RouterAuditResult['riskyServices'] = [];

  await Promise.all(HTTP_PORTS.map(async ({ port, label }) => {
    const open = await probeHttp(gatewayIP, port);
    if (open) {
      const proto = port === 443 || port === 8443 ? 'https' : 'http';
      openAdminPorts.push({ port, label, url: `${proto}://${gatewayIP}:${port}` });
    }
  }));

  return {
    ip: gatewayIP,
    vendor: getVendor(gatewayMAC),
    mac: gatewayMAC ?? '—',
    openAdminPorts,
    riskyServices,
    exposedAdmin: openAdminPorts.length > 0,
  };
}

export default function Security() {
  const { theme } = useTheme();
  const { networkInfo, devices, wifiNetworks } = useNetwork();
  const insets = useSafeAreaInsets();
  const [auditResult, setAuditResult] = useState<SecurityAuditResult | null>(null);
  const [running, setRunning] = useState(false);

  const [arpResult, setArpResult] = useState<ArpSpoofResult | null>(null);
  const [arpRunning, setArpRunning] = useState(false);

  const [routerResult, setRouterResult] = useState<RouterAuditResult | null>(null);
  const [routerRunning, setRouterRunning] = useState(false);

  const paddingTop = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const runAudit = useCallback(async () => {
    setRunning(true);
    const result = runSecurityAudit(wifiNetworks, devices, networkInfo?.ssid || '');
    setAuditResult(result);
    setRunning(false);
  }, [wifiNetworks, devices, networkInfo]);

  const runArpScan = useCallback(async () => {
    setArpRunning(true);
    const gatewayIP = networkInfo?.gateway || networkInfo?.localIP?.split('.').slice(0, 3).join('.') + '.1' || '192.168.1.1';
    const result = detectArpSpoofing(devices, gatewayIP);
    setArpResult(result);
    setArpRunning(false);
  }, [devices, networkInfo]);

  const runRouterAudit = useCallback(async () => {
    setRouterRunning(true);
    const gatewayIP = networkInfo?.gateway || (networkInfo?.localIP?.split('.').slice(0, 3).join('.') + '.1') || '192.168.1.1';
    const gatewayDevice = devices.find(d => d.ip === gatewayIP || d.type === 'router');
    const result = await auditRouter(gatewayIP, gatewayDevice?.mac);
    setRouterResult(result);
    setRouterRunning(false);
  }, [devices, networkInfo]);

  const gradeColor = !auditResult ? theme.textMuted
    : auditResult.grade === 'A' ? theme.success
    : auditResult.grade === 'B' ? theme.primary
    : auditResult.grade === 'C' ? theme.warning
    : theme.error;

  const arpColor = !arpResult ? theme.primary
    : arpResult.status === 'clean' ? theme.success
    : arpResult.status === 'warning' ? theme.warning
    : theme.error;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <LinearGradient colors={theme.gradientBg as [string, string, string]} style={StyleSheet.absoluteFill} />
      <View style={[styles.header, { paddingTop: paddingTop + spacing.md }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Security</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <GlassCard>
          {auditResult ? (
            <View style={styles.scoreRow}>
              <ProgressRing size={100} strokeWidth={8} progress={auditResult.score} color={gradeColor}>
                <View style={styles.scoreCenter}>
                  <Text style={[styles.scoreNum, { color: theme.textPrimary }]}>{auditResult.score}</Text>
                  <Text style={[styles.scoreGrade, { color: gradeColor }]}>{auditResult.grade}</Text>
                </View>
              </ProgressRing>
              <View style={{ flex: 1 }}>
                <Text style={[styles.scoreTitle, { color: theme.textPrimary }]}>Security Score</Text>
                <Text style={[styles.scoreFindings, { color: theme.textMuted }]}>
                  {auditResult.findings.length} issue{auditResult.findings.length !== 1 ? 's' : ''} found
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.lockedScore}>
              <ShieldIcon size={40} color={theme.primary} />
              <Text style={[styles.scoreTitle, { color: theme.textPrimary }]}>Run Security Audit</Text>
              <Text style={[styles.scoreFindings, { color: theme.textMuted }]}>Analyze your network for vulnerabilities</Text>
            </View>
          )}
          <GlassButton
            title={running ? 'Analyzing...' : 'Run Security Audit'}
            onPress={runAudit}
            loading={running}
            style={{ marginTop: spacing.md }}
          />
        </GlassCard>

        <ISPOutageDetector />

        {auditResult && auditResult.findings.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>FINDINGS</Text>
            {auditResult.findings.map(f => <ThreatCard key={f.id} finding={f} />)}
          </>
        )}

        {auditResult && auditResult.findings.length === 0 && (
          <GlassCard>
            <View style={styles.allClear}>
              <CheckCircleIcon size={32} color={theme.success} />
              <Text style={[styles.allClearText, { color: theme.success }]}>All Clear</Text>
              <Text style={[styles.allClearSub, { color: theme.textMuted }]}>No security issues detected on your network.</Text>
            </View>
          </GlassCard>
        )}

        <GlassCard padded={false}>
          <View style={styles.featureHeader}>
            <View style={[styles.featureIconBox, { backgroundColor: `${theme.warning}15` }]}>
              <AlertTriangleIcon size={18} color={theme.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>ARP Spoofing Detection</Text>
              <Text style={[styles.featureSub, { color: theme.textMuted }]}>
                Detects duplicate MACs and gateway impersonation on your LAN
              </Text>
            </View>
          </View>

          {arpResult && (
            <View style={[styles.featureResult, { borderTopColor: theme.border }]}>
              <View style={[styles.arpStatusRow, { backgroundColor: `${arpColor}10`, borderColor: `${arpColor}25`, borderRadius: radius.lg, padding: spacing.md }]}>
                <View style={[styles.arpDot, { backgroundColor: arpColor }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.arpStatusText, { color: arpColor }]}>
                    {arpResult.status === 'clean' ? 'Network Clean' : arpResult.status === 'warning' ? 'Suspicious Activity' : 'ARP Spoofing Detected'}
                  </Text>
                  <Text style={[styles.arpSummary, { color: theme.textMuted }]}>{arpResult.summary}</Text>
                </View>
              </View>
              {arpResult.findings.map((f, i) => (
                <View key={i} style={[styles.arpFindingRow, { borderColor: `${theme.error}20`, backgroundColor: `${theme.error}08` }]}>
                  <AlertTriangleIcon size={12} color={theme.error} />
                  <Text style={[styles.arpFindingText, { color: theme.textSecondary }]}>{f}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={[styles.featureFooter, { borderTopColor: theme.border }]}>
            <GlassButton
              title={arpRunning ? 'Scanning…' : devices.length === 0 ? 'Run LAN Scan First' : 'Scan for ARP Spoofing'}
              onPress={runArpScan}
              loading={arpRunning}
              disabled={arpRunning}
            />
          </View>
        </GlassCard>

        <GlassCard padded={false}>
          <View style={styles.featureHeader}>
            <View style={[styles.featureIconBox, { backgroundColor: `${theme.primary}15` }]}>
              <ServerIcon size={18} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>Router Audit</Text>
              <Text style={[styles.featureSub, { color: theme.textMuted }]}>
                Probes your gateway for exposed admin panels, vendor, and risky services
              </Text>
            </View>
          </View>

          {routerResult && (
            <View style={[styles.featureResult, { borderTopColor: theme.border, gap: spacing.sm }]}>
              <View style={[styles.routerInfoRow, { backgroundColor: `${theme.primary}08`, borderColor: `${theme.primary}20` }]}>
                <View style={styles.routerInfoGrid}>
                  <View style={styles.routerInfoCell}>
                    <Text style={[styles.routerInfoLabel, { color: theme.textMuted }]}>Gateway IP</Text>
                    <Text style={[styles.routerInfoValue, { color: theme.textPrimary }]}>{routerResult.ip}</Text>
                  </View>
                  <View style={styles.routerInfoCell}>
                    <Text style={[styles.routerInfoLabel, { color: theme.textMuted }]}>Vendor</Text>
                    <Text style={[styles.routerInfoValue, { color: theme.textPrimary }]}>{routerResult.vendor}</Text>
                  </View>
                  <View style={styles.routerInfoCell}>
                    <Text style={[styles.routerInfoLabel, { color: theme.textMuted }]}>MAC</Text>
                    <Text style={[styles.routerInfoValue, { color: theme.textPrimary }]} numberOfLines={1}>{routerResult.mac}</Text>
                  </View>
                  <View style={styles.routerInfoCell}>
                    <Text style={[styles.routerInfoLabel, { color: theme.textMuted }]}>Admin Ports</Text>
                    <Text style={[styles.routerInfoValue, { color: routerResult.openAdminPorts.length > 0 ? theme.warning : theme.success }]}>
                      {routerResult.openAdminPorts.length > 0 ? `${routerResult.openAdminPorts.length} open` : 'None exposed'}
                    </Text>
                  </View>
                </View>
              </View>

              {routerResult.openAdminPorts.length > 0 ? (
                <View style={[styles.adminPortsCard, { backgroundColor: `${theme.warning}08`, borderColor: `${theme.warning}25` }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
                    <AlertTriangleIcon size={14} color={theme.warning} />
                    <Text style={[styles.adminPortsTitle, { color: theme.warning }]}>Exposed Admin Panel{routerResult.openAdminPorts.length > 1 ? 's' : ''}</Text>
                  </View>
                  {routerResult.openAdminPorts.map(p => (
                    <View key={p.port} style={[styles.portRow, { borderBottomColor: `${theme.warning}15` }]}>
                      <View style={[styles.portBadge, { backgroundColor: `${theme.warning}15` }]}>
                        <Text style={[styles.portBadgeText, { color: theme.warning }]}>{p.port}</Text>
                      </View>
                      <Text style={[styles.portLabel, { color: theme.textSecondary }]}>{p.label}</Text>
                      <Text style={[styles.portUrl, { color: theme.primary }]} numberOfLines={1}>{p.url}</Text>
                    </View>
                  ))}
                  <Text style={[styles.adminPortsNote, { color: theme.textMuted }]}>
                    Router admin UI is reachable. Use HTTPS admin and set a strong password. Disable remote management if not needed.
                  </Text>
                </View>
              ) : (
                <View style={[styles.adminPortsCard, { backgroundColor: `${theme.success}08`, borderColor: `${theme.success}20` }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <CheckCircleIcon size={14} color={theme.success} />
                    <Text style={[styles.adminPortsTitle, { color: theme.success }]}>No HTTP admin ports reachable</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          <View style={[styles.featureFooter, { borderTopColor: theme.border }]}>
            <GlassButton
              title={routerRunning ? 'Auditing Router…' : 'Audit Router'}
              onPress={runRouterAudit}
              loading={routerRunning}
              disabled={routerRunning}
            />
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  title: { fontSize: typography.xl, fontWeight: typography.bold },
  content: { padding: spacing.md, gap: spacing.md },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
  scoreCenter: { alignItems: 'center' },
  scoreNum: { fontSize: typography.xl, fontWeight: typography.bold },
  scoreGrade: { fontSize: typography.sm, fontWeight: typography.bold },
  scoreTitle: { fontSize: typography.md, fontWeight: typography.semibold },
  scoreFindings: { fontSize: typography.sm, marginTop: spacing.xs },
  lockedScore: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  sectionLabel: { fontSize: typography.xs, fontWeight: typography.semibold, letterSpacing: 1.2, paddingHorizontal: spacing.sm },
  threatHeader: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, alignItems: 'flex-start' },
  threatTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  threatTitle: { fontSize: typography.sm, fontWeight: typography.semibold, flex: 1 },
  threatDesc: { fontSize: typography.xs, lineHeight: 18 },
  remediation: { padding: spacing.md, borderTopWidth: 1 },
  remTitle: { fontSize: typography.sm, fontWeight: typography.semibold, marginBottom: spacing.xs },
  remText: { fontSize: typography.xs, lineHeight: 18 },
  fixBtn: { padding: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  fixBtnText: { fontSize: typography.sm, fontWeight: typography.medium },
  allClear: { alignItems: 'center', gap: spacing.sm },
  allClearText: { fontSize: typography.lg, fontWeight: typography.bold },
  allClearSub: { fontSize: typography.sm, textAlign: 'center' },
  featureHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.md },
  featureIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontSize: typography.base, fontWeight: typography.semibold },
  featureSub: { fontSize: typography.xs, marginTop: 3, lineHeight: 17 },
  featureResult: { borderTopWidth: StyleSheet.hairlineWidth, padding: spacing.md, gap: spacing.sm },
  featureFooter: { borderTopWidth: StyleSheet.hairlineWidth, padding: spacing.md },
  arpStatusRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  arpDot: { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
  arpStatusText: { fontSize: typography.sm, fontWeight: typography.bold },
  arpSummary: { fontSize: typography.xs, marginTop: 2, lineHeight: 16 },
  arpFindingRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    padding: spacing.sm, borderRadius: radius.md, borderWidth: 1,
  },
  arpFindingText: { flex: 1, fontSize: 11, lineHeight: 16 },
  routerInfoRow: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md },
  routerInfoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  routerInfoCell: { width: '48%' },
  routerInfoLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  routerInfoValue: { fontSize: typography.sm, fontWeight: typography.semibold, marginTop: 2 },
  adminPortsCard: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, gap: spacing.xs },
  adminPortsTitle: { fontSize: typography.sm, fontWeight: typography.bold },
  portRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  portBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  portBadgeText: { fontSize: 11, fontWeight: '800' },
  portLabel: { fontSize: typography.xs, width: 80 },
  portUrl: { flex: 1, fontSize: typography.xs },
  adminPortsNote: { fontSize: 10, lineHeight: 15, marginTop: spacing.xs },
});
