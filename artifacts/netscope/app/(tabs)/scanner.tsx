import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, Alert, PermissionsAndroid } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';

import { useTheme } from '@/contexts/ThemeContext';
import { useActivity } from '@/contexts/ActivityContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { typography, spacing, radius } from '@/constants/theme';
import { NetworkDevice, WiFiNetwork, BluetoothDevice } from '@/types';

import GlassButton from '@/components/ui/GlassButton';
import DeviceCard from '@/components/scanner/DeviceCard';
import WiFiCard from '@/components/scanner/WiFiCard';
import BluetoothCard from '@/components/scanner/BluetoothCard';
import ScanProgress from '@/components/scanner/ScanProgress';
import { scanDevices, scanWiFiNetworks, scanBluetoothDevices } from '@/services/scannerService';
import { getLocalIP } from '@/services/networkService';
import { saveLastScan } from '@/services/storageService';
import { WifiIcon, BluetoothIcon, RadarIcon, ShieldIcon } from '@/components/icons/Icons';

const TABS = [
  { key: 'bluetooth', label: 'Bluetooth', Icon: BluetoothIcon, color: '#A855F7' },
  { key: 'wifi',      label: 'WiFi',      Icon: WifiIcon,       color: '#4F87FF' },
  { key: 'devices',   label: 'LAN',       Icon: RadarIcon,      color: '#00D4FF' },
] as const;

type TabKey = typeof TABS[number]['key'];

async function requestBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : parseInt(Platform.Version as string, 10);
    if (apiLevel >= 31) {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
      return (
        results['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
        results['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
      );
    } else {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission Required',
          message: 'NetScope needs location access to discover nearby Bluetooth devices on Android.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        },
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
  } catch {
    return false;
  }
}

async function checkBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : parseInt(Platform.Version as string, 10);
    if (apiLevel >= 31) {
      const [scan, connect] = await Promise.all([
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN),
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT),
      ]);
      return scan && connect;
    } else {
      return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    }
  } catch {
    return false;
  }
}

export default function Scanner() {
  const { theme } = useTheme();
  const { logActivity } = useActivity();
  const { networkInfo, devices, wifiNetworks, setDevices, setWifiNetworks } = useNetwork();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>('bluetooth');
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [localDevices, setLocalDevices] = useState<NetworkDevice[]>([]);
  const [localWifi, setLocalWifi] = useState<WiFiNetwork[]>([]);
  const [localBT, setLocalBT] = useState<BluetoothDevice[]>([]);
  const [btDenied, setBtDenied] = useState(false);

  const paddingTop = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const paddingBottom = 100 + insets.bottom;

  const subnet = networkInfo?.localIP
    ? networkInfo.localIP.split('.').slice(0, 3).join('.') + '.0/24'
    : '—';

  const runScan = useCallback(async () => {
    setScanning(true);
    setProgress(0);
    setBtDenied(false);

    try {
      if (activeTab === 'bluetooth') {
        const already = await checkBluetoothPermissions();
        if (!already) {
          const granted = await requestBluetoothPermissions();
          if (!granted) {
            setBtDenied(true);
            setScanning(false);
            Alert.alert(
              'Permission Required',
              'Bluetooth scanning requires permission. Please enable it in your device Settings → Apps → NetScope → Permissions.',
              [{ text: 'OK' }],
            );
            return;
          }
        }
        setLocalBT([]);
        await scanBluetoothDevices(
          d => setLocalBT(prev => [...prev, d]),
          p => setProgress(p),
        );
        await logActivity('scan', 'Bluetooth Scan', 'Completed Bluetooth scan', '/scanner');
      } else if (activeTab === 'wifi') {
        const nets = await scanWiFiNetworks(networkInfo?.ssid || '');
        setLocalWifi(nets);
        setWifiNetworks(nets);
        setProgress(100);
        await logActivity('scan', 'WiFi Scan', 'Completed WiFi scan', '/scanner');
      } else {
        setLocalDevices([]);
        const ip = await getLocalIP();
        const scanned = await scanDevices(
          ip,
          d => setLocalDevices(prev => [...prev, d]),
          p => setProgress(p),
        );
        setDevices(scanned);
        await saveLastScan(scanned);
        await logActivity('scan', 'LAN Scan', `Scanned ${ip}`, '/scanner');
      }
    } catch {}

    setScanning(false);
    setProgress(100);
  }, [activeTab, networkInfo, logActivity, setDevices, setWifiNetworks]);

  const isWeb = Platform.OS === 'web';

  const webLanNote = isWeb && activeTab === 'devices' ? (
    <View style={[styles.noteBox, { backgroundColor: `${theme.error}10`, borderColor: `${theme.error}25` }]}>
      <ShieldIcon size={14} color={theme.error} />
      <Text style={[styles.noteText, { color: theme.textMuted }]}>
        LAN scanning is disabled in browser preview. Browser security blocks all private network access. Install the Android APK for full real-device scanning.
      </Text>
    </View>
  ) : activeTab === 'devices' && !isWeb ? (
    <View style={[styles.noteBox, { backgroundColor: `${theme.primary}10`, borderColor: `${theme.primary}25` }]}>
      <RadarIcon size={14} color={theme.primary} />
      <Text style={[styles.noteText, { color: theme.textMuted }]}>
        Probing {subnet} — discovers real devices by TCP port response. Gateway (.1) always checked first.
      </Text>
    </View>
  ) : null;

  const btPermNote = btDenied ? (
    <View style={[styles.noteBox, { backgroundColor: `${theme.error}12`, borderColor: `${theme.error}28` }]}>
      <ShieldIcon size={14} color={theme.error} />
      <Text style={[styles.noteText, { color: theme.error }]}>
        Bluetooth permission denied. Go to Settings → Apps → NetScope → Permissions to enable it.
      </Text>
    </View>
  ) : activeTab === 'bluetooth' ? (
    <View style={[styles.noteBox, { backgroundColor: `#A855F712`, borderColor: '#A855F728' }]}>
      <BluetoothIcon size={14} color='#A855F7' />
      <Text style={[styles.noteText, { color: theme.textMuted }]}>
        Bluetooth LE scanning requires a native Android build. This feature works when you install the APK directly — not in the browser preview.
      </Text>
    </View>
  ) : null;

  const wifiNote = activeTab === 'wifi' && (localWifi.length === 0 && wifiNetworks.length === 0) && !scanning ? (
    <View style={[styles.noteBox, { backgroundColor: `#4F87FF10`, borderColor: '#4F87FF25' }]}>
      <WifiIcon size={14} color='#4F87FF' />
      <Text style={[styles.noteText, { color: theme.textMuted }]}>
        Shows real data about your connected WiFi network: SSID, BSSID, signal strength, frequency band, channel, and link speed. Grant Location permission on Android for full details.
      </Text>
    </View>
  ) : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <LinearGradient colors={theme.gradientBg as [string, string, string]} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: paddingTop + spacing.md }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Scanner</Text>
        <View style={[styles.tabRow, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          {TABS.map(({ key, label, Icon, color }) => {
            const isActive = activeTab === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => { setActiveTab(key); setBtDenied(false); }}
                style={[styles.tab, isActive && { backgroundColor: `${color}20` }]}
                activeOpacity={0.75}
              >
                <Icon size={15} color={isActive ? color : theme.textMuted} />
                <Text style={[styles.tabLabel, { color: isActive ? color : theme.textMuted, fontWeight: isActive ? '700' : '500' }]}>
                  {label}
                </Text>
                {isActive && <View style={[styles.tabDot, { backgroundColor: color }]} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {scanning && (
        <ScanProgress
          progress={progress}
          subnet={
            activeTab === 'bluetooth' ? 'Scanning for Bluetooth devices…'
              : activeTab === 'wifi' ? 'Reading WiFi details…'
              : subnet
          }
        />
      )}

      {activeTab === 'bluetooth' && (
        <FlashList
          data={localBT}
          keyExtractor={d => d.id}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: spacing.md }}>
              <BluetoothCard device={item} />
            </View>
          )}
          estimatedItemSize={72}
          contentContainerStyle={{ paddingTop: spacing.md, paddingBottom }}
          ListHeaderComponent={<View style={{ paddingHorizontal: spacing.md }}>{btPermNote}</View>}
          ListEmptyComponent={!scanning ? (
            <View style={styles.empty}>
              <BluetoothIcon size={40} color='#A855F7' />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Bluetooth LE Scanner</Text>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                Real BLE scanning requires a native Android build. Build and install the APK to discover nearby Bluetooth devices with full RSSI, name, address, and service UUID info.
              </Text>
            </View>
          ) : null}
          ListFooterComponent={
            <View style={{ paddingHorizontal: spacing.md }}>
              <GlassButton
                title={scanning ? 'Scanning Bluetooth…' : 'Scan Bluetooth'}
                onPress={runScan}
                loading={scanning}
                style={{ marginTop: spacing.md, borderColor: '#A855F750', backgroundColor: '#A855F712' }}
              />
            </View>
          }
        />
      )}

      {activeTab === 'wifi' && (
        <FlashList
          data={localWifi.length > 0 ? localWifi : wifiNetworks}
          keyExtractor={n => n.bssid + n.ssid}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}>
              <WiFiCard network={item} />
            </View>
          )}
          estimatedItemSize={90}
          contentContainerStyle={{ paddingTop: spacing.md, paddingBottom }}
          ListHeaderComponent={<View style={{ paddingHorizontal: spacing.md }}>{wifiNote}</View>}
          ListEmptyComponent={!scanning ? (
            <View style={styles.empty}>
              <WifiIcon size={40} color={theme.textMuted} />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No WiFi data yet</Text>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                Tap Scan WiFi to read your connected network details including BSSID, channel, signal strength, and security type.
              </Text>
            </View>
          ) : null}
          ListFooterComponent={
            <View style={{ paddingHorizontal: spacing.md }}>
              <GlassButton
                title={scanning ? 'Scanning WiFi…' : 'Scan WiFi'}
                onPress={runScan}
                loading={scanning}
                style={{ marginTop: spacing.md, borderColor: '#4F87FF50', backgroundColor: '#4F87FF12' }}
              />
            </View>
          }
        />
      )}

      {activeTab === 'devices' && (
        <FlashList
          data={localDevices}
          keyExtractor={d => d.id}
          renderItem={({ item }) => <DeviceCard device={item} />}
          estimatedItemSize={80}
          contentContainerStyle={{ padding: spacing.md, paddingBottom }}
          ListHeaderComponent={<View style={{ paddingHorizontal: spacing.md }}>{webLanNote}</View>}
          ListEmptyComponent={!scanning ? (
            <View style={styles.empty}>
              <RadarIcon size={40} color={theme.textMuted} />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                {isWeb ? 'LAN Scan Unavailable' : 'No LAN devices found'}
              </Text>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                {isWeb
                  ? 'Browser security prevents scanning private network IPs. Install the Android APK for real LAN discovery.'
                  : 'Tap Scan Network to probe your local subnet and discover all connected devices in real time.'}
              </Text>
            </View>
          ) : null}
          ListFooterComponent={
            <GlassButton
              title={scanning ? 'Scanning Network…' : 'Scan Network'}
              onPress={runScan}
              loading={scanning}
              style={{ marginTop: spacing.md }}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.md },
  title: { fontSize: typography.xl, fontWeight: typography.bold },
  tabRow: {
    flexDirection: 'row', borderRadius: radius.lg, borderWidth: 1,
    overflow: 'hidden', padding: 4, gap: 3,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 9, paddingHorizontal: 6, borderRadius: radius.md,
    position: 'relative',
  },
  tabLabel: { fontSize: 12 },
  tabDot: { position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl, gap: spacing.sm },
  emptyTitle: { fontSize: typography.base, fontWeight: typography.semibold, marginTop: spacing.sm },
  emptyText: { fontSize: typography.sm, textAlign: 'center', lineHeight: 20 },
  noteBox: {
    marginBottom: spacing.md, padding: spacing.md,
    borderRadius: radius.md, borderWidth: 1, flexDirection: 'row',
    alignItems: 'flex-start', gap: spacing.sm,
  },
  noteText: { flex: 1, fontSize: typography.xs, lineHeight: 18 },
});
