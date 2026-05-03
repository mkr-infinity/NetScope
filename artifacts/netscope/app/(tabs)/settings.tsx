import React from 'react';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Switch,
} from 'react-native';
import { useNetwork } from '@/contexts/NetworkContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Application from 'expo-application';
import * as Device from 'expo-device';

import { useTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useActivity } from '@/contexts/ActivityContext';
import { typography, spacing, radius, ThemeMode, THEME_META } from '@/constants/theme';

import AccentPicker from '@/components/settings/AccentPicker';
import DeveloperCard from '@/components/settings/DeveloperCard';
import InfoButton, { InfoData } from '@/components/ui/InfoPopup';
import {
  GearIcon, ShieldIcon, WifiIcon, BellIcon, ZapIcon, GlobeIcon,
  TrashIcon, InfoIcon, CheckCircleIcon, DownloadIcon,
  HouseIcon, WrenchIcon, ChevronRightIcon, ActivityIcon,
  ClockIcon, TrendingUpIcon, ServerIcon, SearchIcon, RefreshIcon,
} from '@/components/icons/Icons';
import { clearAllData } from '@/services/storageService';
import { openBugReport, openFeatureRequest, openBuyMeACoffee } from '@/services/githubService';
import { exportNetworkReport } from '@/services/pdfExportService';

// ─── Info definitions ─────────────────────────────────────────────────────────
const INFO: Record<string, InfoData> = {
  pingCount: {
    title: 'Ping Packets',
    description: 'The number of HTTP probe packets sent when testing latency to a host.',
    why: 'More packets give a more statistically accurate average latency and better detect packet loss.',
    how: 'Each probe opens a short-lived HTTP HEAD connection. Average, min, max and jitter are calculated from all responses.',
    tip: 'Use 1 for quick checks, 4 for diagnostics, 10 for accuracy when troubleshooting connection issues.',
  },
  autoRefresh: {
    title: 'Auto Refresh',
    description: 'Automatically re-runs the dashboard network scan at the selected interval.',
    why: 'Useful for monitoring whether new devices join or leave your network without manual intervention.',
    how: 'A background timer triggers a lightweight network state poll and updates the dashboard metrics.',
    tip: 'Keep this Off to save battery unless you actively need live monitoring.',
  },
  units: {
    title: 'Speed Units',
    description: 'The unit used to display network throughput across the app.',
    why: 'Mbps (megabits per second) is the industry standard for connection speed. Kbps is useful for very slow connections.',
    how: 'Values are converted from raw bytes per second measured during speed tests.',
    tip: 'If your ISP advertises in Mbps, use Mbps for easy comparison with your plan.',
  },
  scanTimeout: {
    title: 'Scan Timeout',
    description: 'Maximum time to wait for a device to respond during a network scan before marking it as offline.',
    why: 'Shorter timeout = faster scan but may miss slow devices. Longer timeout is more thorough.',
    how: 'Each IP in the subnet is probed with a TCP connect request. If no response arrives within the timeout, it is skipped.',
    tip: 'Use 3s for home networks. Increase to 5s on larger or congested enterprise networks.',
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ title, icon, noTopMargin }: { title: string; icon: React.ReactNode; noTopMargin?: boolean }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.sectionLabel, noTopMargin && { marginTop: 0 }]}>
      <LinearGradient colors={[`${theme.primary}25`, `${theme.accent}10`] as [string, string]} style={styles.sectionIcon}>
        {icon}
      </LinearGradient>
      <Text style={[styles.sectionText, { color: theme.textMuted }]}>{title.toUpperCase()}</Text>
    </View>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }, style]}>
      {children}
    </View>
  );
}

function Row({
  label, subtitle, icon, last, onPress, rightNode, info,
}: {
  label: string; subtitle?: string; icon: React.ReactNode; last?: boolean;
  onPress?: () => void; rightNode?: React.ReactNode; info?: InfoData;
}) {
  const { theme } = useTheme();
  const inner = (
    <View style={[styles.row, !last && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <View style={[styles.rowIcon, { backgroundColor: `${theme.primary}10` }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>{label}</Text>
          {info && <InfoButton info={info} />}
        </View>
        {subtitle && <Text style={[styles.rowSub, { color: theme.textMuted }]}>{subtitle}</Text>}
      </View>
      {rightNode}
      {onPress && !rightNode && <ChevronRightIcon size={14} color={theme.textMuted} />}
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{inner}</TouchableOpacity>;
  return inner;
}

function Capsule<T extends string>({
  options, value, onChange,
}: { options: { label: string; value: T }[]; value: T; onChange: (v: T) => void }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.capsule, { backgroundColor: theme.bgInput, borderColor: theme.border }]}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt.value}
          onPress={() => onChange(opt.value)}
          style={[styles.capsuleOpt, value === opt.value && { backgroundColor: theme.bgSurface }]}
          activeOpacity={0.8}
        >
          {value === opt.value && (
            <LinearGradient
              colors={[theme.primary, theme.accent] as [string, string]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 8 }]}
            />
          )}
          <Text style={[styles.capsuleText, { color: value === opt.value ? '#FFFFFF' : theme.textMuted }]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Theme Picker ─────────────────────────────────────────────────────────────
const ALL_THEMES: ThemeMode[] = ['dark', 'amoled', 'hacker', 'ocean', 'sunset', 'light', 'system'];

function ThemePicker({ value, onChange }: { value: ThemeMode; onChange: (v: ThemeMode) => void }) {
  const { theme } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.themeHScroll}
    >
      {ALL_THEMES.map(mode => {
        const meta = THEME_META[mode];
        const active = value === mode;
        const [bg, p1, p2] = meta.swatch;
        return (
          <TouchableOpacity
            key={mode}
            onPress={() => onChange(mode)}
            activeOpacity={0.8}
          >
            <View style={[
              styles.themeCard,
              active
                ? { borderColor: theme.primary, borderWidth: 2 }
                : { borderColor: theme.border, borderWidth: 1 },
              { backgroundColor: theme.bgInput },
            ]}>
              <View style={[styles.swatch, { backgroundColor: bg }]}>
                <View style={[styles.swatchDot, { backgroundColor: p1, left: 8, top: 8 }]} />
                <View style={[styles.swatchDot, { backgroundColor: p2, right: 8, bottom: 8 }]} />
              </View>
              <Text style={[styles.themeCardLabel, { color: active ? theme.primary : theme.textPrimary }]} numberOfLines={1}>
                {meta.label}
              </Text>
              <Text style={[styles.themeCardDesc, { color: theme.textMuted }]} numberOfLines={1}>
                {meta.desc}
              </Text>
              {active && (
                <View style={[styles.activeChip, { backgroundColor: theme.primary }]}>
                  <CheckCircleIcon size={9} color="#FFFFFF" />
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── Support section ──────────────────────────────────────────────────────────
const SUPPORT_ACTIONS = [
  { label: 'Report a Bug',        sub: 'File an issue on GitHub',    icon: <ShieldIcon size={16} color="#FF5C5C" />,   color: '#FF5C5C', onPress: openBugReport },
  { label: 'Request Feature',     sub: 'Suggest an improvement',      icon: <ZapIcon size={16} color="#4F87FF" />,      color: '#4F87FF', onPress: openFeatureRequest },
  { label: 'Support Dev',         sub: 'Buy me a coffee',             icon: <ActivityIcon size={16} color="#00E5A0" />, color: '#00E5A0', onPress: openBuyMeACoffee },
];

function SupportSection() {
  const { theme } = useTheme();
  return (
    <View style={styles.supportGrid}>
      {SUPPORT_ACTIONS.map(a => (
        <TouchableOpacity key={a.label} onPress={a.onPress} activeOpacity={0.8} style={{ width: '48%' }}>
          <LinearGradient
            colors={[`${a.color}10`, 'transparent'] as [string, string]}
            style={[styles.supportCard, { backgroundColor: theme.bgSurface, borderColor: `${a.color}22` }]}
          >
            <View style={[styles.supportIcon, { backgroundColor: `${a.color}18` }]}>{a.icon}</View>
            <Text style={[styles.supportLabel, { color: theme.textPrimary }]}>{a.label}</Text>
            <Text style={[styles.supportSub, { color: theme.textMuted }]}>{a.sub}</Text>
            <View style={[styles.supportArrow, { backgroundColor: `${a.color}15` }]}>
              <ChevronRightIcon size={11} color={a.color} />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── App Info row ─────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
      <Text style={[styles.infoLabel, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{value}</Text>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Settings() {
  const { theme, themeMode, accent, setThemeMode, setAccent } = useTheme();
  const { settings, updateSettings } = useSettings();
  const { clearAll: clearActivity } = useActivity();
  const { networkInfo, devices } = useNetwork();
  const insets = useSafeAreaInsets();
  const [exporting, setExporting] = React.useState(false);

  const paddingTop = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const appVersion = Application.nativeApplicationVersion || '1.0.0';
  const androidVersionMap: Record<number, string> = {
    21: '5.0', 22: '5.1', 23: '6.0', 24: '7.0', 25: '7.1',
    26: '8.0', 27: '8.1', 28: '9', 29: '10', 30: '11',
    31: '12', 32: '12L', 33: '13', 34: '14', 35: '15', 36: '16',
  };
  const apiLevel = Platform.Version as number;
  const androidName = androidVersionMap[apiLevel] ?? String(apiLevel);
  const deviceInfo = Platform.OS !== 'web' ? `Android ${androidName} (API ${apiLevel})` : 'Web Preview';
  const model = Device.modelName || 'Unknown';

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will erase all scan history, notes, and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: async () => { await clearAllData(); } },
      ],
    );
  };

  const handleExport = async () => {
    setExporting(true);
    const fmt = settings.exportFormat === 'pdf' ? 'pdf' : settings.exportFormat === 'txt' ? 'txt' : 'json';
    await exportNetworkReport({
      networkInfo: networkInfo ? {
        ssid: networkInfo.ssid || '—',
        ip: networkInfo.localIP || '—',
        publicIP: networkInfo.publicIP || '—',
        gateway: networkInfo.gateway || '—',
        isp: networkInfo.isp || '—',
      } : undefined,
      deviceCount: devices.length || undefined,
      devices: devices.map(d => ({ ip: d.ip, mac: d.mac, hostname: d.hostname, vendor: d.vendor, type: d.type })),
      traceroute: undefined,
      ssl: undefined,
      headers: undefined,
      wol: undefined,
    }, fmt);
    setExporting(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <LinearGradient colors={theme.gradientBg as [string, string, string]} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={[`${theme.secondary}15`, 'transparent'] as [string, string]} style={styles.topGlow} />

      <View style={[styles.header, { paddingTop: paddingTop + spacing.sm }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>Personalize your experience</Text>
        </View>
        <LinearGradient colors={[theme.primary, theme.accent] as [string, string]} style={styles.headerBadge}>
          <GearIcon size={14} color="#FFFFFF" />
        </LinearGradient>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >

        <SectionLabel title="Navigation" icon={<HouseIcon size={12} color={theme.primary} />} noTopMargin />
        <Card>
          <View style={[styles.row, { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <View style={[styles.rowIcon, { backgroundColor: `${theme.primary}10` }]}>
              <WrenchIcon size={14} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Nav Style</Text>
              <Text style={[styles.rowSub, { color: theme.textMuted }]}>Choose how your tab bar looks</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.navHScroll}
          >
            {([
              {
                value: 'floating',
                label: 'Floating Pill',
                desc: 'Glass pill',
                preview: (
                  <View style={styles.pvFloatingWrap}>
                    <View style={[styles.pvPill, { backgroundColor: `${theme.primary}20`, borderColor: `${theme.primary}30` }]}>
                      {[0,1,2,3].map(i => (
                        <View key={i} style={[styles.pvDot, i === 0
                          ? { backgroundColor: theme.primary, width: 18, height: 18, borderRadius: 6 }
                          : { backgroundColor: theme.textMuted + '55', width: 14, height: 14, borderRadius: 5 }
                        ]} />
                      ))}
                    </View>
                  </View>
                ),
              },
              {
                value: 'bar',
                label: 'Bottom Bar',
                desc: 'Labels + icons',
                preview: (
                  <View style={[styles.pvBar, { backgroundColor: `${theme.primary}12`, borderTopColor: `${theme.primary}30` }]}>
                    {[0,1,2,3].map(i => (
                      <View key={i} style={styles.pvBarItem}>
                        <View style={[styles.pvBarDot, { backgroundColor: i === 0 ? theme.primary : theme.textMuted + '55' }]} />
                        <View style={[styles.pvBarLine, { backgroundColor: i === 0 ? theme.primary + '80' : theme.textMuted + '33' }]} />
                        {i === 0 && <View style={[styles.pvBarUnderline, { backgroundColor: theme.primary }]} />}
                      </View>
                    ))}
                  </View>
                ),
              },
              {
                value: 'compact',
                label: 'Compact',
                desc: 'Icons only',
                preview: (
                  <View style={styles.pvFloatingWrap}>
                    <View style={[styles.pvPill, { backgroundColor: `${theme.primary}20`, borderColor: `${theme.primary}30`, paddingHorizontal: 8, paddingVertical: 6 }]}>
                      {[0,1,2,3].map(i => (
                        <View key={i} style={[styles.pvDot, i === 0
                          ? { backgroundColor: theme.primary, width: 14, height: 14, borderRadius: 5 }
                          : { backgroundColor: theme.textMuted + '55', width: 12, height: 12, borderRadius: 4 }
                        ]} />
                      ))}
                    </View>
                  </View>
                ),
              },
              {
                value: 'minimal',
                label: 'Minimal',
                desc: 'Dot indicator',
                preview: (
                  <View style={[styles.pvMinimalWrap, { borderTopColor: `${theme.primary}20` }]}>
                    {[0,1,2,3].map(i => (
                      <View key={i} style={styles.pvMinimalItem}>
                        <View style={[styles.pvDot, { backgroundColor: i === 0 ? theme.primary : theme.textMuted + '55', width: 13, height: 13, borderRadius: 4 }]} />
                        {i === 0 && <View style={[styles.pvMinimalDot, { backgroundColor: theme.primary }]} />}
                      </View>
                    ))}
                  </View>
                ),
              },
              {
                value: 'bubble',
                label: 'Bubble',
                desc: 'Active bubble',
                preview: (
                  <View style={[styles.pvBar, { backgroundColor: `${theme.primary}12`, borderTopColor: `${theme.primary}30` }]}>
                    {[0,1,2,3].map(i => (
                      <View key={i} style={[styles.pvBarItem,
                        i === 0 && { backgroundColor: `${theme.primary}22`, borderRadius: 8, paddingVertical: 3 }
                      ]}>
                        <View style={[styles.pvBarDot, { backgroundColor: i === 0 ? theme.primary : theme.textMuted + '55' }]} />
                        <View style={[styles.pvBarLine, { backgroundColor: i === 0 ? theme.primary + '80' : theme.textMuted + '33' }]} />
                      </View>
                    ))}
                  </View>
                ),
              },
              {
                value: 'underline',
                label: 'Underline',
                desc: 'Accent underline',
                preview: (
                  <View style={[styles.pvBar, { backgroundColor: `${theme.primary}12`, borderTopColor: `${theme.primary}30` }]}>
                    {[0,1,2,3].map(i => (
                      <View key={i} style={styles.pvBarItem}>
                        <View style={[styles.pvBarDot, { backgroundColor: i === 0 ? theme.primary : theme.textMuted + '55' }]} />
                        <View style={[styles.pvBarLine, { backgroundColor: i === 0 ? theme.primary + '80' : theme.textMuted + '33' }]} />
                        {i === 0 && <View style={[styles.pvBarUnderline, { backgroundColor: theme.primary, height: 2.5 }]} />}
                      </View>
                    ))}
                  </View>
                ),
              },
            ] as const).map(opt => {
              const active = (settings.navStyle ?? 'floating') === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => updateSettings({ navStyle: opt.value as any })}
                  activeOpacity={0.8}
                >
                  {active ? (
                    <LinearGradient
                      colors={[`${theme.primary}28`, `${theme.accent}18`] as [string, string]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={[styles.navHCard, { borderColor: theme.primary }]}
                    >
                      <View style={[styles.navHPreview, { backgroundColor: `${theme.bgSurface}80`, borderBottomColor: `${theme.primary}20` }]}>
                        {opt.preview}
                      </View>
                      <View style={styles.navHCardBody}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <Text style={[styles.navStyleLabel, { color: theme.primary }]} numberOfLines={1}>{opt.label}</Text>
                          <View style={[styles.navActiveChip, { backgroundColor: theme.primary }]}>
                            <Text style={styles.navActiveChipText}>✓</Text>
                          </View>
                        </View>
                        <Text style={[styles.navStyleDesc, { color: theme.textSecondary }]} numberOfLines={1}>{opt.desc}</Text>
                      </View>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.navHCard, { backgroundColor: theme.bgInput, borderColor: theme.border }]}>
                      <View style={[styles.navHPreview, { backgroundColor: `${theme.bgSurface}60`, borderBottomColor: theme.border }]}>
                        {opt.preview}
                      </View>
                      <View style={styles.navHCardBody}>
                        <Text style={[styles.navStyleLabel, { color: theme.textPrimary }]} numberOfLines={1}>{opt.label}</Text>
                        <Text style={[styles.navStyleDesc, { color: theme.textMuted }]} numberOfLines={1}>{opt.desc}</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Card>

        <SectionLabel title="Appearance" icon={<ZapIcon size={12} color={theme.primary} />} />
        <Card>
          <View style={[styles.row, { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <View style={[styles.rowIcon, { backgroundColor: `${theme.primary}10` }]}>
              <GlobeIcon size={14} color={theme.primary} />
            </View>
            <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Theme</Text>
          </View>
          <ThemePicker value={themeMode} onChange={setThemeMode} />

          {['dark', 'light', 'system'].includes(themeMode) && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <View style={{ paddingTop: spacing.xs }}>
                <AccentPicker />
              </View>
            </>
          )}

          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Row
            label="Compact Mode"
            subtitle="Reduce padding for denser layout"
            icon={<SearchIcon size={14} color={theme.primary} />}
            last
            rightNode={
              <Switch
                value={settings.compactMode}
                onValueChange={v => updateSettings({ compactMode: v })}
                trackColor={{ false: theme.bgInput, true: `${theme.primary}50` }}
                thumbColor={settings.compactMode ? theme.primary : theme.textMuted}
              />
            }
          />
        </Card>

        <SectionLabel title="Network Diagnostics" icon={<WifiIcon size={12} color={theme.primary} />} />
        <Card>
          <LinearGradient
            colors={[`${theme.primary}14`, `${theme.accent}08`] as [string, string]}
            style={[styles.diagIntro, { borderBottomColor: theme.border }]}
          >
            <View style={styles.diagIntroRow}>
              <LinearGradient colors={[theme.primary, theme.accent] as [string, string]} style={styles.diagIntroIcon}>
                <WifiIcon size={14} color="#FFFFFF" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[styles.diagIntroTitle, { color: theme.textPrimary }]}>Diagnostics Engine</Text>
                <Text style={[styles.diagIntroSub, { color: theme.textMuted }]}>
                  Fine-tune how NetScope probes your network — scan depth, refresh cadence, and result precision.
                </Text>
              </View>
            </View>
            <View style={styles.diagStatRow}>
              {[
                { label: 'Ping Packets', value: String(settings.pingCount), color: theme.success },
                { label: 'Auto Refresh', value: settings.autoRefresh === 'off' ? 'Off' : settings.autoRefresh, color: theme.primary },
                { label: 'Timeout', value: `${(settings.scanTimeout ?? 3000) / 1000}s`, color: theme.accent },
              ].map(stat => (
                <View key={stat.label} style={[styles.diagStat, { backgroundColor: `${stat.color}12`, borderColor: `${stat.color}20` }]}>
                  <Text style={[styles.diagStatVal, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={[styles.diagStatLabel, { color: theme.textMuted }]}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>

          <View style={[styles.row, { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <View style={[styles.rowIcon, { backgroundColor: `${theme.primary}10` }]}>
              <ClockIcon size={14} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Ping Packets</Text>
                <InfoButton info={INFO.pingCount} />
              </View>
            </View>
            <Capsule
              options={[{ label: '1', value: '1' }, { label: '4', value: '4' }, { label: '10', value: '10' }]}
              value={String(settings.pingCount)}
              onChange={v => updateSettings({ pingCount: parseInt(v) as 1 | 4 | 10 })}
            />
          </View>

          <View style={[styles.row, { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <View style={[styles.rowIcon, { backgroundColor: `${theme.primary}10` }]}>
              <RefreshIcon size={14} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Auto Refresh</Text>
                <InfoButton info={INFO.autoRefresh} />
              </View>
            </View>
            <Capsule
              options={[
                { label: 'Off', value: 'off' }, { label: '1m', value: '1min' },
                { label: '5m', value: '5min' }, { label: '15m', value: '15min' },
              ]}
              value={settings.autoRefresh}
              onChange={v => updateSettings({ autoRefresh: v as any })}
            />
          </View>

          <View style={[styles.row, { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <View style={[styles.rowIcon, { backgroundColor: `${theme.primary}10` }]}>
              <TrendingUpIcon size={14} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Speed Units</Text>
                <InfoButton info={INFO.units} />
              </View>
            </View>
            <Capsule
              options={[{ label: 'Mbps', value: 'Mbps' }, { label: 'Kbps', value: 'Kbps' }]}
              value={settings.units}
              onChange={v => updateSettings({ units: v as 'Mbps' | 'Kbps' })}
            />
          </View>

          <View style={[styles.row, { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <View style={[styles.rowIcon, { backgroundColor: `${theme.primary}10` }]}>
              <ActivityIcon size={14} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Scan Timeout</Text>
                <InfoButton info={INFO.scanTimeout} />
              </View>
            </View>
            <Capsule
              options={[
                { label: '1s', value: '1000' }, { label: '3s', value: '3000' }, { label: '5s', value: '5000' },
              ]}
              value={String(settings.scanTimeout ?? 3000)}
              onChange={v => updateSettings({ scanTimeout: parseInt(v) as 1000 | 3000 | 5000 })}
            />
          </View>

          <Row
            label="Show Closed Ports"
            subtitle="Display closed ports in scan results"
            icon={<ServerIcon size={14} color={theme.primary} />}
            last
            rightNode={
              <Switch
                value={settings.showClosedPorts}
                onValueChange={v => updateSettings({ showClosedPorts: v })}
                trackColor={{ false: theme.bgInput, true: `${theme.primary}50` }}
                thumbColor={settings.showClosedPorts ? theme.primary : theme.textMuted}
              />
            }
          />
        </Card>

        <SectionLabel title="Privacy & Activity" icon={<ActivityIcon size={12} color={theme.primary} />} />
        <Card>
          <Row
            label="Track Activity"
            subtitle={settings.trackActivity !== false ? 'History recorded · Bell visible on Home' : 'Tracking off · Bell hidden'}
            icon={<BellIcon size={14} color={theme.primary} />}
            last
            rightNode={
              <Switch
                value={settings.trackActivity !== false}
                onValueChange={v => {
                  updateSettings({ trackActivity: v });
                  if (!v) clearActivity();
                }}
                trackColor={{ false: theme.bgInput, true: `${theme.primary}50` }}
                thumbColor={settings.trackActivity !== false ? theme.primary : theme.textMuted}
              />
            }
          />
        </Card>

        <SectionLabel title="Alerts" icon={<BellIcon size={12} color={theme.primary} />} />
        <Card>
          <View style={[styles.alertIntro, { borderBottomColor: theme.border }]}>
            <Text style={[styles.alertIntroTitle, { color: theme.textPrimary }]}>Real-time protection</Text>
            <Text style={[styles.alertIntroSub, { color: theme.textMuted }]}>
              Get notified when the network changes, a new device appears, or a security issue is detected.
            </Text>
          </View>
          <Row
            label="New Device Detected"
            subtitle="Alert when unknown device joins"
            icon={<WifiIcon size={14} color={theme.primary} />}
            rightNode={
              <Switch
                value={settings.notifyNewDevice}
                onValueChange={v => updateSettings({ notifyNewDevice: v })}
                trackColor={{ false: theme.bgInput, true: `${theme.primary}50` }}
                thumbColor={settings.notifyNewDevice ? theme.primary : theme.textMuted}
              />
            }
          />
          <Row
            label="Network Change"
            subtitle="Alert on SSID or IP change"
            icon={<GlobeIcon size={14} color={theme.primary} />}
            rightNode={
              <Switch
                value={settings.notifyNetworkChange}
                onValueChange={v => updateSettings({ notifyNetworkChange: v })}
                trackColor={{ false: theme.bgInput, true: `${theme.primary}50` }}
                thumbColor={settings.notifyNetworkChange ? theme.primary : theme.textMuted}
              />
            }
          />
          <Row
            label="Security Risk"
            subtitle="Alert on detected threats"
            icon={<ShieldIcon size={14} color={theme.primary} />}
            last
            rightNode={
              <Switch
                value={settings.notifySecurityRisk}
                onValueChange={v => updateSettings({ notifySecurityRisk: v })}
                trackColor={{ false: theme.bgInput, true: `${theme.primary}50` }}
                thumbColor={settings.notifySecurityRisk ? theme.primary : theme.textMuted}
              />
            }
          />
        </Card>

        <SectionLabel title="Export & Reports" icon={<DownloadIcon size={12} color={theme.primary} />} />
        <Card>
          <View style={[styles.row, { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <View style={[styles.rowIcon, { backgroundColor: `${theme.primary}10` }]}>
              <DownloadIcon size={14} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Report Format</Text>
              <Text style={[styles.rowSub, { color: theme.success }]}>All formats are free</Text>
            </View>
            <Capsule
              options={[{ label: 'JSON', value: 'json' }, { label: 'TXT', value: 'txt' }, { label: 'PDF', value: 'pdf' }]}
              value={settings.exportFormat}
              onChange={v => updateSettings({ exportFormat: v as any })}
            />
          </View>
          <TouchableOpacity onPress={handleExport} disabled={exporting} activeOpacity={0.8}>
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <LinearGradient colors={[theme.primary, theme.accent] as [string, string]} style={styles.rowIcon}>
                <DownloadIcon size={14} color="#FFFFFF" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: theme.primary }]}>{exporting ? 'Generating…' : 'Export Network Report'}</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>Shareable report of your network</Text>
              </View>
              <ChevronRightIcon size={14} color={theme.primary} />
            </View>
          </TouchableOpacity>
        </Card>

        <SectionLabel title="Support" icon={<InfoIcon size={12} color={theme.primary} />} />
        <SupportSection />

        <SectionLabel title="Developer" icon={<ServerIcon size={12} color="#00E5A0" />} />
        <DeveloperCard />

        <SectionLabel title="Data" icon={<TrashIcon size={12} color={theme.error} />} />
        <Card>
          <TouchableOpacity onPress={handleClearData} activeOpacity={0.7}>
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <View style={[styles.rowIcon, { backgroundColor: `${theme.error}12` }]}>
                <TrashIcon size={14} color={theme.error} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: theme.error }]}>Clear All Data</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>Erase history, notes and settings</Text>
              </View>
              <ChevronRightIcon size={14} color={theme.error} />
            </View>
          </TouchableOpacity>
        </Card>

        <SectionLabel title="App Info" icon={<InfoIcon size={12} color={theme.primary} />} />
        <Card>
          <InfoRow label="Version" value={appVersion} />
          <InfoRow label="Build" value="Release" />
          <InfoRow label="Platform" value={deviceInfo} />
          <InfoRow label="Device" value={model} />
          <InfoRow label="Bundle ID" value="com.mkrinfinity.netscope" />
        </Card>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topGlow: { position: 'absolute', top: -80, right: -60, width: 280, height: 280, borderRadius: 140 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.md,
  },
  title: { fontSize: typography.xxl, fontWeight: typography.black, letterSpacing: -0.5 },
  subtitle: { fontSize: typography.sm, marginTop: 1 },
  headerBadge: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  content: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  sectionLabel: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginTop: spacing.lg, paddingHorizontal: 2,
  },
  sectionIcon: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  sectionText: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  card: { borderRadius: radius.xl, borderWidth: 1, overflow: 'hidden' },
  alertIntro: { padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  alertIntroTitle: { fontSize: typography.sm, fontWeight: typography.bold, marginBottom: 4 },
  alertIntroSub: { fontSize: typography.xs, lineHeight: 18 },

  diagIntro: { padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, gap: spacing.sm },
  diagIntroRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  diagIntroIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  diagIntroTitle: { fontSize: typography.sm, fontWeight: typography.bold, marginBottom: 3 },
  diagIntroSub: { fontSize: 11, lineHeight: 17 },
  diagStatRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 2 },
  diagStat: { flex: 1, borderRadius: radius.md, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 4, alignItems: 'center', gap: 2 },
  diagStatVal: { fontSize: typography.sm, fontWeight: typography.black },
  diagStatLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.3, textAlign: 'center' },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: 14, minHeight: 56,
  },
  rowIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: typography.sm, fontWeight: typography.medium },
  rowSub: { fontSize: 11, marginTop: 2 },
  divider: { height: 1, marginHorizontal: spacing.md },

  themeHScroll: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  themeCard: {
    width: 88, borderRadius: radius.lg, padding: spacing.sm, gap: 4, position: 'relative', overflow: 'hidden',
  },
  swatch: { height: 34, borderRadius: 8, marginBottom: 2, position: 'relative', overflow: 'hidden' },
  swatchDot: { position: 'absolute', width: 14, height: 14, borderRadius: 7 },
  themeCardLabel: { fontSize: 11, fontWeight: '600' },
  themeCardDesc: { fontSize: 9.5, lineHeight: 13 },
  activeChip: {
    position: 'absolute', top: 6, right: 6,
    width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },

  // Capsule
  capsule: {
    flexDirection: 'row', borderRadius: radius.md, borderWidth: 1,
    padding: 3, gap: 2,
  },
  capsuleOpt: {
    paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  capsuleText: { fontSize: 11, fontWeight: '600' },

  navHScroll: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  navHCard: { width: 150, borderRadius: radius.lg, borderWidth: 1.5, overflow: 'hidden' },
  navHPreview: { height: 64, borderBottomWidth: StyleSheet.hairlineWidth, overflow: 'hidden', justifyContent: 'flex-end' },
  navHCardBody: { padding: spacing.sm, gap: 2 },
  navStyleLabel: { fontSize: 12, fontWeight: '700' },
  navStyleDesc: { fontSize: 10 },
  navActiveChip: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  navActiveChipText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
  // Preview shapes
  pvFloatingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pvPill: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 8, borderWidth: 1,
  },
  pvDot: { width: 14, height: 14, borderRadius: 5 },
  pvBar: {
    flexDirection: 'row', paddingVertical: 6, borderTopWidth: 1.5,
    paddingHorizontal: 4,
  },
  pvBarItem: {
    flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 2, paddingBottom: 2,
    position: 'relative',
  },
  pvBarDot: { width: 12, height: 12, borderRadius: 4 },
  pvBarLine: { width: 18, height: 3, borderRadius: 2 },
  pvBarUnderline: {
    position: 'absolute', bottom: -2, left: 2, right: 2, height: 2, borderRadius: 1,
  },
  pvMinimalWrap: {
    flexDirection: 'row', paddingVertical: 6, borderTopWidth: 1, paddingHorizontal: 4,
  },
  pvMinimalItem: { flex: 1, alignItems: 'center', gap: 2 },
  pvMinimalDot: { width: 4, height: 4, borderRadius: 2 },

  // Nav chip
  navGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  navChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.full, borderWidth: 1,
  },
  navChipLabel: { fontSize: typography.xs, fontWeight: typography.medium },
  navDot: { width: 6, height: 6, borderRadius: 3 },

  // Support
  supportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  supportCard: {
    borderRadius: radius.xl, padding: spacing.md, gap: spacing.xs,
    borderWidth: 1, position: 'relative', overflow: 'hidden',
  },
  supportIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  supportLabel: { fontSize: typography.sm, fontWeight: typography.semibold },
  supportSub: { fontSize: 11 },
  supportArrow: {
    position: 'absolute', top: spacing.md, right: spacing.md,
    width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center',
  },

  // App info
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLabel: { fontSize: typography.xs, fontWeight: typography.medium },
  infoValue: { fontSize: typography.xs, fontWeight: typography.semibold },
});
