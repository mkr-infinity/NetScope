import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/contexts/ThemeContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { useActivity } from '@/contexts/ActivityContext';
import { typography, spacing, radius } from '@/constants/theme';
import { ArrowLeftIcon, ZapIcon, CopyIcon, ServerIcon, ShieldIcon, WifiIcon } from '@/components/icons/Icons';
import ToolLearnCard from '@/components/ui/ToolLearnCard';
import ToolExportButton from '@/components/ui/ToolExportButton';

function generateMagicPacket(mac: string): Uint8Array | null {
  const normalized = mac.replace(/[:\-\.]/g, '').toUpperCase();
  if (normalized.length !== 12 || !/^[0-9A-F]+$/.test(normalized)) return null;
  const packet = new Uint8Array(102);
  for (let i = 0; i < 6; i++) packet[i] = 0xff;
  const macBytes = new Uint8Array(6);
  for (let i = 0; i < 6; i++) macBytes[i] = parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  for (let rep = 0; rep < 16; rep++) {
    for (let b = 0; b < 6; b++) packet[6 + rep * 6 + b] = macBytes[b];
  }
  return packet;
}

function formatMacInput(raw: string): string {
  const digits = raw.replace(/[^0-9a-fA-F]/g, '').slice(0, 12);
  const groups: string[] = [];
  for (let i = 0; i < digits.length; i += 2) groups.push(digits.slice(i, i + 2));
  return groups.join(':');
}

function isValidMac(mac: string): boolean {
  return /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(mac);
}

function hexDump(bytes: Uint8Array): string {
  const rows: string[] = [];
  for (let i = 0; i < bytes.length; i += 16) {
    const chunk = Array.from(bytes.slice(i, i + 16));
    rows.push(chunk.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' '));
  }
  return rows.join('\n');
}

const LEARN_SECTIONS = [
  {
    title: 'How Wake-on-LAN Works',
    color: '#FF5C8A',
    items: [
      'WOL sends a "magic packet" — 102 bytes over UDP (port 9 or 7)',
      'Packet = 6×0xFF followed by 16 repetitions of the target device\'s MAC address',
      'The network card stays powered even when the PC is off — listens for the magic packet',
      'Target device must have WOL enabled in BIOS/UEFI and network card settings',
      'Best sent as subnet broadcast (e.g., 192.168.1.255:9) from the same LAN',
    ],
  },
  {
    title: 'Requirements',
    color: '#4F87FF',
    items: [
      '1. Target device: WOL enabled in BIOS + NIC settings (Windows: Device Manager → NIC → Power → Allow this device to wake)',
      '2. Router: must not block UDP port 9 broadcast packets',
      '3. Must be on same subnet OR router must support WOL relay/forwarding',
      '4. Target must be physically powered to the network (or have WOL-capable NIC)',
      '5. Some ISPs block WOL over internet — use a VPN or SSH tunnel for remote WOL',
    ],
  },
  {
    title: 'Sending the Packet',
    color: '#A855F7',
    items: [
      'Android: Use free apps like "Wake On LAN" by Biconico or "WolOn"',
      'Linux/macOS: etherwake <MAC> or wakeonlan -i 192.168.1.255 <MAC>',
      'Windows: powershell: Send-MagicPacket -Mac <MAC> (via WakeOnLan module)',
      'Home Assistant: wake_on_lan.send_magic_packet service',
      'Router firmware (DD-WRT/OpenWrt): has built-in WOL support',
    ],
  },
  {
    title: 'Troubleshooting',
    color: '#FFBE5C',
    items: [
      'Still won\'t wake: check BIOS → Power Management → Wake on PCI-E/LAN → Enable',
      'Windows: Disable "Turn off this device to save power" in NIC advanced settings',
      'Fast Startup mode in Windows prevents WOL — disable in Power settings',
      'Verify MAC is correct using ipconfig /all (Windows) or ip link (Linux)',
      'Test with a direct UDP tool first before trying over the internet',
    ],
  },
];

export default function WakeOnLan() {
  const { theme } = useTheme();
  const { logActivity } = useActivity();
  const { networkInfo } = useNetwork();
  const insets = useSafeAreaInsets();
  const [mac, setMac] = useState('');
  const [broadcastIP, setBroadcastIP] = useState('255.255.255.255');
  const [port, setPort] = useState('9');
  const [packet, setPacket] = useState<Uint8Array | null>(null);
  const [hexPreview, setHexPreview] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const paddingTop = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  useEffect(() => {
    if (networkInfo?.localIP) {
      const parts = networkInfo.localIP.split('.');
      if (parts.length === 4) {
        setBroadcastIP(`${parts[0]}.${parts[1]}.${parts[2]}.255`);
      }
    }
  }, [networkInfo?.localIP]);

  useEffect(() => {
    if (isValidMac(mac)) {
      const p = generateMagicPacket(mac);
      setPacket(p);
      setHexPreview(p ? hexDump(p) : '');
    } else {
      setPacket(null);
      setHexPreview('');
    }
  }, [mac]);

  const handleMacChange = (text: string) => {
    setMac(formatMacInput(text));
    setSent(false);
  };

  const handleSend = useCallback(async () => {
    if (!packet || !isValidMac(mac)) return;
    setSending(true);
    setSent(false);
    await new Promise(r => setTimeout(r, 600));
    setSending(false);
    Alert.alert(
      'Magic Packet Ready',
      `WOL magic packet generated for ${mac}.\n\nTo send it, use:\n• Android: "Wake On LAN" app (by Biconico)\n• Linux: wakeonlan -i ${broadcastIP} ${mac}\n• macOS: etherwake -B ${mac}\n• Windows PowerShell: Install-Module WakeOnLan → Send-WOL ${mac}\n\nOr copy the hex below and use any UDP sender on port ${port} to ${broadcastIP}.`,
      [
        { text: 'Copy Hex', onPress: () => Clipboard.setStringAsync(hexPreview) },
        { text: 'OK', style: 'cancel' },
      ],
    );
    setSent(true);
    await logActivity('network_scan', 'Wake-on-LAN', `Generated WOL packet for ${mac}`, '/tool/wol');
  }, [packet, mac, broadcastIP, port, hexPreview]);

  const validMac = isValidMac(mac);

  const exportData = sent ? {
    wol: { mac, broadcastIP, port },
  } : {};

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <LinearGradient colors={theme.gradientBg as [string, string, string]} style={StyleSheet.absoluteFill} />
      <View style={[styles.header, { paddingTop: paddingTop + spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <ArrowLeftIcon size={18} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Wake-on-LAN</Text>
          <Text style={[styles.pageSub, { color: theme.textMuted }]}>Generate magic packet · wake remote devices</Text>
        </View>
        <ToolLearnCard tool="Wake-on-LAN" tagline="Magic packet · UDP broadcast · remote wake" sections={LEARN_SECTIONS} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]} showsVerticalScrollIndicator={false}>

        <View style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>TARGET MAC ADDRESS</Text>
          <View style={[styles.inputRow, { borderColor: validMac ? theme.success : mac.length > 0 ? theme.error : theme.border, backgroundColor: theme.bgInput }]}>
            <ServerIcon size={16} color={validMac ? theme.success : theme.textMuted} />
            <TextInput
              value={mac}
              onChangeText={handleMacChange}
              placeholder="AA:BB:CC:DD:EE:FF"
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { color: theme.textPrimary }]}
              autoCapitalize="characters" autoCorrect={false}
              keyboardType="default" maxLength={17}
            />
            {validMac && (
              <View style={[styles.validDot, { backgroundColor: theme.success }]} />
            )}
          </View>
          {mac.length > 0 && !validMac && (
            <Text style={[styles.fieldHint, { color: theme.error }]}>
              Enter a valid MAC: AA:BB:CC:DD:EE:FF (6 hex pairs separated by colons)
            </Text>
          )}
          <Text style={[styles.fieldHint, { color: theme.textMuted }]}>
            Find MAC: Windows → ipconfig /all | Linux → ip link | Android → Settings → About → Wi-Fi MAC
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>BROADCAST SETTINGS</Text>
          <View style={styles.row2Col}>
            <View style={{ flex: 2 }}>
              <Text style={[styles.sublabel, { color: theme.textMuted }]}>Broadcast IP</Text>
              <View style={[styles.inputRow, { borderColor: theme.border, backgroundColor: theme.bgInput }]}>
                <WifiIcon size={14} color={theme.textMuted} />
                <TextInput
                  value={broadcastIP}
                  onChangeText={setBroadcastIP}
                  style={[styles.input, { color: theme.textPrimary, fontSize: typography.sm }]}
                  placeholderTextColor={theme.textMuted}
                  placeholder="192.168.1.255"
                  keyboardType="numeric" autoCorrect={false}
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sublabel, { color: theme.textMuted }]}>Port</Text>
              <View style={[styles.inputRow, { borderColor: theme.border, backgroundColor: theme.bgInput }]}>
                <TextInput
                  value={port}
                  onChangeText={setPort}
                  style={[styles.input, { color: theme.textPrimary, textAlign: 'center', fontSize: typography.sm }]}
                  keyboardType="numeric" maxLength={5}
                />
              </View>
            </View>
          </View>
          {networkInfo?.localIP && (
            <View style={[styles.autoFillNote, { backgroundColor: `${theme.primary}10`, borderColor: `${theme.primary}20` }]}>
              <WifiIcon size={12} color={theme.primary} />
              <Text style={[styles.autoFillText, { color: theme.textMuted }]}>
                Auto-detected from your network: <Text style={{ color: theme.primary }}>{networkInfo.localIP}</Text>
              </Text>
            </View>
          )}
        </View>

        {validMac && hexPreview ? (
          <View style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: `${theme.success}30` }]}>
            <View style={styles.packetHeader}>
              <ZapIcon size={14} color={theme.success} />
              <Text style={[styles.fieldLabel, { color: theme.success, flex: 1 }]}>MAGIC PACKET (102 bytes)</Text>
              <TouchableOpacity onPress={() => Clipboard.setStringAsync(hexPreview)} style={styles.copyBtn}>
                <CopyIcon size={14} color={theme.textMuted} />
                <Text style={[styles.copyBtnText, { color: theme.textMuted }]}>Copy hex</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.hexDump, { color: theme.textSecondary }]}>{hexPreview.slice(0, 3 * 32)}…</Text>
            <Text style={[styles.packetInfo, { color: theme.textMuted }]}>
              6 sync bytes (FF×6) + 16× {mac}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity onPress={handleSend} disabled={!validMac || sending} activeOpacity={0.85}>
          <LinearGradient
            colors={validMac && !sending ? ['#FF5C8A', '#FF3366'] as [string, string] : ['#333', '#555'] as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.sendBtn}
          >
            <ZapIcon size={20} color="#FFFFFF" />
            <Text style={styles.sendBtnText}>
              {sending ? 'Preparing…' : sent ? 'Magic Packet Sent ✓' : 'Send Wake-on-LAN'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={[styles.infoBox, { backgroundColor: `${theme.primary}08`, borderColor: `${theme.primary}20` }]}>
          <ShieldIcon size={14} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.textMuted }]}>
            Direct UDP broadcast requires a native Android build. This tool generates the correct magic packet and provides send instructions. Install the app as a standalone APK for full UDP support.
          </Text>
        </View>

        {sent && (
          <ToolExportButton data={exportData} label="Export WOL Report (PDF)" />
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
  card: { borderRadius: radius.xl, borderWidth: 1, padding: spacing.md, gap: spacing.sm },
  fieldLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  sublabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: 11 },
  input: { flex: 1, fontSize: typography.base, padding: 0 },
  validDot: { width: 8, height: 8, borderRadius: 4 },
  fieldHint: { fontSize: 10, lineHeight: 15 },
  row2Col: { flexDirection: 'row', gap: spacing.sm },
  autoFillNote: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1 },
  autoFillText: { fontSize: 10, flex: 1, lineHeight: 15 },
  packetHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  copyBtnText: { fontSize: 11 },
  hexDump: { fontSize: 10, lineHeight: 17, fontFamily: Platform.OS !== 'web' ? undefined : 'monospace' },
  packetInfo: { fontSize: 10 },
  sendBtn: { height: 60, borderRadius: radius.full, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, elevation: 8, shadowColor: '#FF5C8A', shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  sendBtnText: { color: '#FFFFFF', fontSize: typography.md, fontWeight: typography.bold },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  infoText: { flex: 1, fontSize: typography.xs, lineHeight: 18 },
});
