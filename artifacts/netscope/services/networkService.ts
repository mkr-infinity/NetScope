import * as Network from 'expo-network';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { NetworkInfo } from '@/types';

const PING_URL = 'https://www.gstatic.com/generate_204';

export async function ping(url: string = PING_URL): Promise<number> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const start = Date.now();
    await fetch(url, { method: 'HEAD', cache: 'no-store', signal: controller.signal });
    return Date.now() - start;
  } catch {
    return -1;
  } finally {
    clearTimeout(timer);
  }
}

export function deriveGateway(localIP: string): string {
  const parts = localIP.split('.');
  if (parts.length === 4) {
    parts[3] = '1';
    return parts.join('.');
  }
  return '192.168.1.1';
}

export async function getLocalIP(): Promise<string> {
  try {
    const ip = await Network.getIpAddressAsync();
    return ip || '—';
  } catch { return '—'; }
}

export async function getPublicIP(): Promise<string> {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    const data = await res.json() as { ip: string };
    return data.ip;
  } catch { return '—'; }
}

export async function getIPInfo(ip: string): Promise<{ isp: string; city: string; country: string; asn: string }> {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, { signal: controller.signal });
    const data = await res.json() as { org?: string; city?: string; country_name?: string; asn?: string };
    return {
      isp: data.org || '—',
      city: data.city || '—',
      country: data.country_name || '—',
      asn: data.asn || '—',
    };
  } catch {
    return { isp: '—', city: '—', country: '—', asn: '—' };
  }
}

export async function getNetworkInfo(): Promise<NetworkInfo> {
  try {
    const [networkState, localIP] = await Promise.all([
      Network.getNetworkStateAsync(),
      getLocalIP(),
    ]);

    const details = (networkState as any).details ?? {};

    // Android strength is 0–4 signal bars from WifiManager.calculateSignalLevel()
    // Convert to approximate RSSI dBm: bars 0→-100, 1→-85, 2→-70, 3→-60, 4→-50
    const strengthBars: number = typeof details.strength === 'number' ? details.strength : -1;
    const rssi = strengthBars >= 0
      ? [-100, -85, -70, -60, -50][Math.min(strengthBars, 4)]
      : -70;

    // SSID is available on Android when location permission is granted
    const ssid: string = details.ssid || details.wifiSsid || '—';

    const publicIP = await getPublicIP();
    const ipInfo = publicIP !== '—' ? await getIPInfo(publicIP) : { isp: '—', city: '—', country: '—', asn: '—' };
    const gateway = localIP !== '—' ? deriveGateway(localIP) : '—';

    return {
      ssid,
      localIP,
      publicIP,
      gateway,
      isp: ipInfo.isp,
      city: ipInfo.city,
      country: ipInfo.country,
      asn: ipInfo.asn,
      // Frequency and channel require WiFiManager native API — not available via expo-network
      frequency: '—',
      channel: '—',
      rssi,
      isConnected: networkState.isConnected ?? false,
      isInternetReachable: networkState.isInternetReachable ?? false,
      connectionType: networkState.type || 'UNKNOWN',
    };
  } catch {
    return {
      ssid: '—',
      localIP: '—',
      publicIP: '—',
      gateway: '—',
      isp: '—',
      city: '—',
      country: '—',
      asn: '—',
      frequency: '—',
      channel: '—',
      rssi: -70,
      isConnected: false,
      isInternetReachable: false,
      connectionType: 'UNKNOWN',
    };
  }
}

export async function measureMultiplePings(count: number = 5): Promise<number[]> {
  const results: number[] = [];
  for (let i = 0; i < count; i++) {
    const ms = await ping();
    if (ms > 0) results.push(ms);
    if (i < count - 1) await new Promise(r => setTimeout(r, 500));
  }
  return results;
}

export function calcJitter(pings: number[]): number {
  if (pings.length < 2) return 0;
  return Math.round(Math.max(...pings) - Math.min(...pings));
}

export async function getDeviceInfo(): Promise<string> {
  const networkState = await Network.getNetworkStateAsync();
  return [
    `App Version: ${Application.nativeApplicationVersion || '—'}`,
    `Android Version: ${Platform.OS === 'android' ? Platform.Version : Device.osVersion || '—'}`,
    `Device Model: ${Device.modelName || '—'}`,
    `Network Type: ${networkState.type || '—'}`,
  ].join('\n');
}

export type OutageVerdict = 'all_good' | 'internet_down' | 'isp_issue' | 'router_issue' | 'wifi_issue' | 'checking';

export async function checkISPOutage(gateway: string): Promise<{
  layer1: boolean; layer2: boolean; layer3: boolean; layer4: boolean;
  verdict: OutageVerdict; message: string;
}> {
  const pingGateway = async () => {
    try { return (await ping(`http://${gateway}`)) > 0; }
    catch { return false; }
  };
  const pingDNS = async () => {
    try { return (await ping('https://dns.google/generate_204')) > 0; }
    catch { return false; }
  };
  const pingGoogle = async () => {
    try { return (await ping('https://www.google.com')) > 0; }
    catch { return false; }
  };
  const pingCDN = async () => {
    try { return (await ping('https://1.1.1.1')) > 0; }
    catch { return false; }
  };

  const [l1, l2, l3, l4] = await Promise.all([pingGateway(), pingDNS(), pingGoogle(), pingCDN()]);

  let verdict: OutageVerdict = 'all_good';
  let message = 'All layers are healthy. Your connection is working normally.';

  if (!l1) {
    verdict = 'router_issue';
    message = 'Cannot reach your router. Try restarting it by unplugging for 30 seconds.';
  } else if (!l2 && !l3) {
    verdict = 'isp_issue';
    message = 'Your router is fine but the ISP connection is down. Contact your internet provider.';
  } else if (!l3 && !l4) {
    verdict = 'internet_down';
    message = 'ISP routing is partially down. Internet services may be unstable.';
  } else if (!l4) {
    verdict = 'internet_down';
    message = 'Some internet services are unreachable. Partial outage detected.';
  }

  return { layer1: l1, layer2: l2, layer3: l3, layer4: l4, verdict, message };
}
