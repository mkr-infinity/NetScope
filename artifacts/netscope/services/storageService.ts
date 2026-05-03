import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetworkDevice, SecurityAlert, AppSettings, WiFiNetwork, ActivityEntry } from '@/types';

const KEYS = {
  ONBOARDING: 'ns_onboarding_done',
  SETTINGS: 'ns_settings',
  SCAN_HISTORY: 'ns_scan_history',
  ALERTS: 'ns_alerts',
  TRUST_LIST: 'ns_trust_list',
  NOTES: 'ns_notes',
  SAVED_NETWORKS: 'ns_saved_networks',
  LAST_SCAN: 'ns_last_scan',
  ACTIVITY: 'ns_activity_log',
};

export const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'system',
  accent: 'blue',
  privacyMode: false,
  pingCount: 4,
  autoRefresh: 'off',
  notifyNewDevice: true,
  notifyNetworkChange: true,
  notifySecurityRisk: true,
  units: 'Mbps',
  exportFormat: 'json',
  scanTimeout: 3000,
  showClosedPorts: false,
  hiddenTabs: [],
  compactMode: false,
  navStyle: 'floating',
  trackActivity: true,
};

export async function isOnboardingDone(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(KEYS.ONBOARDING);
    return val === 'true';
  } catch { return false; }
}

export async function setOnboardingDone(): Promise<void> {
  try { await AsyncStorage.setItem(KEYS.ONBOARDING, 'true'); } catch {}
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { return DEFAULT_SETTINGS; }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try { await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings)); } catch {}
}

export async function getAlerts(): Promise<SecurityAlert[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ALERTS);
    if (!raw) return [];
    const alerts = JSON.parse(raw) as SecurityAlert[];
    return alerts.map(a => ({ ...a, timestamp: new Date(a.timestamp) }));
  } catch { return []; }
}

export async function saveAlerts(alerts: SecurityAlert[]): Promise<void> {
  try {
    const trimmed = alerts.slice(0, 50);
    await AsyncStorage.setItem(KEYS.ALERTS, JSON.stringify(trimmed));
  } catch {}
}

export async function addAlert(alert: SecurityAlert): Promise<void> {
  const alerts = await getAlerts();
  alerts.unshift(alert);
  await saveAlerts(alerts);
}

export async function getActivity(): Promise<ActivityEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ACTIVITY);
    if (!raw) return [];
    return JSON.parse(raw) as ActivityEntry[];
  } catch { return []; }
}

export async function saveActivity(entries: ActivityEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.ACTIVITY, JSON.stringify(entries.slice(0, 100)));
  } catch {}
}

export async function getTrustList(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.TRUST_LIST);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export async function setDeviceTrust(mac: string, trust: string): Promise<void> {
  const list = await getTrustList();
  list[mac] = trust;
  try { await AsyncStorage.setItem(KEYS.TRUST_LIST, JSON.stringify(list)); } catch {}
}

export async function getNotes(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.NOTES);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export async function setNote(key: string, note: string): Promise<void> {
  const notes = await getNotes();
  notes[key] = note;
  try { await AsyncStorage.setItem(KEYS.NOTES, JSON.stringify(notes)); } catch {}
}

export async function getSavedNetworks(): Promise<WiFiNetwork[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SAVED_NETWORKS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveNetwork(network: WiFiNetwork): Promise<void> {
  const networks = await getSavedNetworks();
  const idx = networks.findIndex(n => n.ssid === network.ssid);
  if (idx >= 0) {
    networks[idx] = network;
  } else {
    networks.unshift(network);
  }
  try { await AsyncStorage.setItem(KEYS.SAVED_NETWORKS, JSON.stringify(networks.slice(0, 100))); } catch {}
}

export async function getLastScan(): Promise<{ devices: NetworkDevice[]; timestamp: string } | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.LAST_SCAN);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export async function saveLastScan(devices: NetworkDevice[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.LAST_SCAN, JSON.stringify({ devices, timestamp: new Date().toISOString() }));
  } catch {}
}

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  } catch {}
}
