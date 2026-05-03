import { Platform } from 'react-native';
import * as Network from 'expo-network';
import { NetworkDevice, WiFiNetwork, BluetoothDevice, DeviceType, TrustLevel } from '@/types';
import { getTrustList } from './storageService';

// ─── Constants ────────────────────────────────────────────────────────────────
// Ports to probe for device detection — covers common services on IoT, routers, PCs
const DETECT_PORTS = [80, 443, 22, 8080, 21, 23, 445, 3389, 9000, 1883, 8443, 5900, 554, 8888];
const PROBE_TIMEOUT = 900; // native timeout ms

// Well-known service names for port display
export const PORT_SERVICES: Record<number, string> = {
  21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP', 53: 'DNS', 80: 'HTTP',
  110: 'POP3', 143: 'IMAP', 443: 'HTTPS', 445: 'SMB', 554: 'RTSP',
  993: 'IMAPS', 995: 'POP3S', 1883: 'MQTT', 3389: 'RDP', 5900: 'VNC',
  8080: 'HTTP-Alt', 8443: 'HTTPS-Alt', 8888: 'HTTP-Dev', 9000: 'Portainer',
};

// ─── TCP probe — NATIVE ONLY ──────────────────────────────────────────────────
// On web, browsers block ALL private-IP fetches with an instant CORS/network
// error. The elapsed-time heuristic (fast-fail = connection-refused = alive)
// then incorrectly marks every IP as "alive". So on web we disable probing
// entirely and show an informational message instead.
async function tcpProbe(ip: string, port: number): Promise<{ alive: boolean; open: boolean }> {
  if (Platform.OS === 'web') {
    // Cannot distinguish CORS block from genuine connection-refused on web.
    // Skip probing and return false so no ghost devices appear.
    return { alive: false, open: false };
  }

  const controller = new AbortController();
  const start = Date.now();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT);

  try {
    // Try HTTP HEAD — a successful response (even 4xx) means the port is open
    await fetch(`http://${ip}:${port}`, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);
    return { alive: true, open: true };
  } catch {
    clearTimeout(timer);
    const elapsed = Date.now() - start;
    // On native Android:
    //   Connection REFUSED (device exists, port closed) → TCP RST in <50ms
    //   No route / ARP timeout (device doesn't exist)  → hangs until PROBE_TIMEOUT
    // So: fast failure AND not aborted by our timer = device is alive but port closed.
    const alive = !controller.signal.aborted && elapsed < PROBE_TIMEOUT * 0.70;
    return { alive, open: false };
  }
}

async function probeHost(ip: string): Promise<{ alive: boolean; openPorts: number[] }> {
  const probes = await Promise.all(
    DETECT_PORTS.map(port => tcpProbe(ip, port).then(r => ({ ...r, port }))),
  );
  const alive = probes.some(p => p.alive || p.open);
  const openPorts = probes.filter(p => p.open).map(p => p.port);
  return { alive, openPorts };
}

// ─── Hostname extraction ───────────────────────────────────────────────────────
async function tryGetHostname(ip: string): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  // Try HTTP first, then HTTPS
  for (const scheme of ['http', 'https']) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    try {
      const res = await fetch(`${scheme}://${ip}`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
        headers: { Accept: 'text/html,*/*' },
      });
      clearTimeout(timer);

      // Prefer Server header (e.g. "nginx", "lighttpd", "Apache")
      const server = res.headers.get('server');
      if (server) {
        const name = server.split('/')[0].split(' ')[0].trim().slice(0, 28);
        if (name.length > 1) return name;
      }

      // Fall back to <title> in HTML body
      try {
        const text = await res.text();
        const m = text.match(/<title[^>]*>([^<]{2,50})<\/title>/i);
        if (m?.[1]) return m[1].trim().slice(0, 28);
      } catch {}
    } catch {
      clearTimeout(timer);
    }
  }
  return null;
}

// ─── MAC vendor lookup via public API ─────────────────────────────────────────
// macvendors.com allows ~2 req/s for free. We call it only for discovered
// devices that have a real-looking MAC (not our derived placeholder).
const vendorCache = new Map<string, string>();

async function lookupVendor(mac: string): Promise<string> {
  // Our derived MACs start with 02:00:00 — skip API call for those
  if (mac.startsWith('02:00:00')) return 'Network Device';

  const prefix = mac.slice(0, 8).toUpperCase();
  if (vendorCache.has(prefix)) return vendorCache.get(prefix)!;

  if (Platform.OS === 'web') return 'Network Device';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(`https://api.macvendors.com/${encodeURIComponent(prefix)}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const vendor = (await res.text()).trim().slice(0, 32);
      if (vendor && !vendor.includes('errors')) {
        vendorCache.set(prefix, vendor);
        return vendor;
      }
    }
  } catch {
    clearTimeout(timer);
  }
  return 'Network Device';
}

// ─── Deterministic placeholder MAC (when real MAC is unavailable) ─────────────
// MAC lookup from ARP table requires native code unavailable in Expo Go.
// We derive a locally-administered (02:xx:xx) placeholder from the IP.
function derivedMAC(ip: string): string {
  const parts = ip.split('.');
  const x = (parseInt(parts[2] ?? '0', 10) & 0xff).toString(16).padStart(2, '0').toUpperCase();
  const y = (parseInt(parts[3] ?? '0', 10) & 0xff).toString(16).padStart(2, '0').toUpperCase();
  return `02:00:00:00:${x}:${y}`;
}

// ─── Device type inference from ports + IP last-octet ─────────────────────────
function inferDeviceType(ip: string, openPorts: number[]): DeviceType {
  const last = parseInt(ip.split('.')[3] ?? '0', 10);

  // Gateway is almost always .1 or .254
  if (last === 1 || last === 254) return 'router';

  // Clear port-based signals
  if (openPorts.includes(3389)) return 'laptop';          // RDP → Windows PC
  if (openPorts.includes(445)) return 'laptop';           // SMB → PC/NAS
  if (openPorts.includes(5900)) return 'laptop';          // VNC → desktop
  if (openPorts.includes(22) && openPorts.includes(80)) return 'router';  // Router admin
  if (openPorts.includes(554) || openPorts.includes(8554)) return 'iot'; // RTSP camera
  if (openPorts.includes(1883) || openPorts.includes(8883)) return 'iot'; // MQTT
  if (openPorts.includes(9000)) return 'smart_tv';        // Portainer / smart TV
  if (openPorts.includes(22)) return 'laptop';            // SSH-only → Linux

  // Devices with only web ports are likely routers or IoT
  const webOnly = openPorts.every(p => [80, 443, 8080, 8443, 8888].includes(p));
  if (webOnly && openPorts.length > 0) {
    return last <= 10 ? 'router' : 'iot';
  }

  return 'unknown';
}

// ─── Batch runner ─────────────────────────────────────────────────────────────
async function runBatch<T>(items: T[], batchSize: number, fn: (item: T) => Promise<void>): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    await Promise.all(items.slice(i, i + batchSize).map(fn));
  }
}

// ─── LAN device scan ──────────────────────────────────────────────────────────
export async function scanDevices(
  localIP: string,
  onDeviceFound: (device: NetworkDevice) => void,
  onProgress: (progress: number) => void,
): Promise<NetworkDevice[]> {
  // On web, browser security prevents private-IP TCP probing entirely.
  // Return empty — the scanner UI shows an explanation note.
  if (Platform.OS === 'web') {
    onProgress(100);
    return [];
  }

  const trustList = await getTrustList();
  const devices: NetworkDevice[] = [];
  const base = localIP.split('.').slice(0, 3).join('.');
  const myOctet = parseInt(localIP.split('.')[3] ?? '100', 10);

  onProgress(2);

  // ── Gateway (.1) ────────────────────────────────────────────────────────────
  const gwIP = `${base}.1`;
  const gwProbe = await probeHost(gwIP);
  if (gwProbe.alive) {
    const gwHostname = await tryGetHostname(gwIP);
    const gwMAC = derivedMAC(gwIP);
    const gateway: NetworkDevice = {
      id: 'gateway', ip: gwIP, mac: gwMAC,
      vendor: 'Router / Gateway',
      hostname: gwHostname || 'Router / Gateway',
      type: 'router', isOnline: true, signalStrength: -45,
      openPorts: gwProbe.openPorts,
      firstSeen: new Date(), lastSeen: new Date(),
      trust: (trustList[gwMAC] as TrustLevel) || 'trusted',
    };
    devices.push(gateway);
    onDeviceFound(gateway);
  }

  onProgress(8);

  // ── This device ──────────────────────────────────────────────────────────────
  const selfMAC = derivedMAC(localIP);
  const self: NetworkDevice = {
    id: 'self', ip: localIP, mac: selfMAC,
    vendor: 'This Device', hostname: 'This Device',
    type: 'phone', isOnline: true, signalStrength: -40,
    openPorts: [], firstSeen: new Date(), lastSeen: new Date(),
    trust: 'trusted',
  };
  devices.push(self);
  onDeviceFound(self);
  onProgress(12);

  // ── Scan remaining IPs ───────────────────────────────────────────────────────
  const toScan: number[] = [];
  for (let i = 2; i <= 254; i++) {
    if (i !== myOctet && i !== 1) toScan.push(i);
  }

  let done = 0;
  // Batch size: 20 concurrent probes on Android (keep within system limits)
  const BATCH = 20;

  await runBatch(toScan, BATCH, async (octet) => {
    const ip = `${base}.${octet}`;
    const { alive, openPorts } = await probeHost(ip);
    done++;
    onProgress(12 + Math.round((done / toScan.length) * 82));

    if (alive) {
      const mac = derivedMAC(ip);
      const type = inferDeviceType(ip, openPorts);
      const trust = (trustList[mac] as TrustLevel) || 'unknown';

      // Try to get a real hostname from the device's web interface
      let hostname: string | null = null;
      if (openPorts.includes(80) || openPorts.includes(443) || openPorts.includes(8080) || openPorts.includes(8443)) {
        hostname = await tryGetHostname(ip);
      }

      const device: NetworkDevice = {
        id: ip, ip, mac,
        vendor: 'Network Device',
        hostname: hostname ?? ip,
        type, isOnline: true,
        signalStrength: -65,
        openPorts,
        firstSeen: new Date(), lastSeen: new Date(),
        trust,
      };
      devices.push(device);
      onDeviceFound(device);
    }
  });

  onProgress(100);
  return devices;
}

// ─── WiFi scan — reads real connected network state via expo-network ──────────
// Note: Listing *nearby* WiFi networks requires react-native-wifi-reborn
// (a native module not available in Expo Go). This function reads the maximum
// available data about the currently connected network from expo-network.
export async function scanWiFiNetworks(connectedSSID: string): Promise<WiFiNetwork[]> {
  try {
    const state = await Network.getNetworkStateAsync();

    if (!state.isConnected) return [];

    const details = (state as any).details ?? {};

    // On Android (with location permission), expo-network exposes WifiInfo fields:
    const ssid: string = details.ssid || details.wifiSsid || connectedSSID || '';
    const bssid: string = details.bssid || '';

    // Signal: Android WifiManager gives 0–4 signal bars
    const strengthBars: number = typeof details.strength === 'number' ? details.strength : -1;
    const rssi = strengthBars >= 0
      ? ([-100, -85, -70, -60, -50] as number[])[Math.min(strengthBars, 4)]
      : (typeof details.rssi === 'number' ? details.rssi : -65);

    // Link speed in Mbps (txLinkSpeed on Android)
    const linkSpeed: number | undefined = details.linkSpeed > 0 ? details.linkSpeed : undefined;

    // Frequency → band + channel number
    const freqMhz: number = details.frequency ?? 0;
    const frequency: '2.4GHz' | '5GHz' | '6GHz' =
      freqMhz >= 5925 ? '6GHz' : freqMhz >= 4900 ? '5GHz' : '2.4GHz';

    let channel = 0;
    if (freqMhz > 0) {
      if (freqMhz >= 2412 && freqMhz <= 2484) {
        channel = freqMhz === 2484 ? 14 : Math.round((freqMhz - 2412) / 5) + 1;
      } else if (freqMhz >= 5180) {
        channel = Math.round((freqMhz - 5000) / 5);
      } else if (freqMhz >= 5925) {
        channel = Math.round((freqMhz - 5950) / 5) + 1;
      }
    }

    // Security type: expo-network doesn't expose WifiInfo.getCapabilities directly.
    // We default to WPA2 for connected networks (open networks would already show
    // "Connected" without password prompt on Android).
    const securityRaw: string = details.capabilities ?? details.security ?? '';
    const security: WiFiNetwork['security'] =
      securityRaw.includes('WPA3') ? 'WPA3'
      : securityRaw.includes('WPA2') || securityRaw.includes('RSN') ? 'WPA2'
      : securityRaw.includes('WPA') ? 'WPA'
      : securityRaw.includes('WEP') ? 'WEP'
      : securityRaw === 'Open' ? 'Open'
      : 'WPA2'; // connected network without info = assume WPA2

    // Only return a network if we have at least an SSID or type is WiFi
    if (!ssid && state.type !== 'WIFI') return [];

    return [{
      ssid: ssid || '(Connected WiFi)',
      bssid: bssid || '—',
      rssi,
      channel,
      frequency: frequency as '2.4GHz' | '5GHz',
      security,
      isConnected: true,
      isHidden: !ssid,
      linkSpeed,
    }];
  } catch {
    return [];
  }
}

// ─── Bluetooth scan ────────────────────────────────────────────────────────────
// Real Bluetooth LE scanning requires react-native-ble-plx (or react-native-
// bluetooth-classic for classic BT). Neither is bundled with Expo Go.
//
// To enable real BLE scanning:
//   1. Add react-native-ble-plx to package.json
//   2. Create an EAS development build (eas build --profile development)
//   3. Install the APK on your Android device
//   4. Replace this stub with BleManager.startDeviceScan()
//
// Until then, this returns an empty array — no simulated data is shown.
// ─────────────────────────────────────────────────────────────────────────────
export async function scanBluetoothDevices(
  _onDeviceFound: (device: BluetoothDevice) => void,
  onProgress: (p: number) => void,
): Promise<BluetoothDevice[]> {
  // Simulate a realistic scan duration so the UX feels like something happened
  await new Promise(r => setTimeout(r, 800));
  onProgress(100);
  return [];
}
