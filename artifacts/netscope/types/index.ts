export type DeviceType = 'router' | 'laptop' | 'phone' | 'smart_tv' | 'iot' | 'unknown';
export type TrustLevel = 'trusted' | 'guest' | 'unknown';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertType = 'new_device' | 'network_change' | 'security_risk' | 'speed_drop';
export type SecurityGrade = 'A' | 'B' | 'C' | 'D' | 'F';
export type BluetoothDeviceType = 'phone' | 'audio' | 'wearable' | 'laptop' | 'iot' | 'unknown';

export type ActivityType =
  | 'speed_test'
  | 'ping'
  | 'port_scan'
  | 'dns'
  | 'packet_loss'
  | 'ip_info'
  | 'whois'
  | 'latency'
  | 'network_scan'
  | 'security_audit';

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  title: string;
  detail: string;
  route: string;
  timestamp: string;
  read: boolean;
}

export interface NetworkDevice {
  id: string;
  ip: string;
  mac: string;
  vendor: string;
  hostname: string;
  type: DeviceType;
  isOnline: boolean;
  signalStrength: number;
  openPorts: number[];
  firstSeen: Date;
  lastSeen: Date;
  trust: TrustLevel;
  note?: string;
}

export interface BluetoothDevice {
  id: string;
  name: string;
  address: string;
  rssi: number;
  type: BluetoothDeviceType;
  isPaired: boolean;
  manufacturer: string;
  serviceClass?: string;
}

export interface WiFiNetwork {
  ssid: string;
  bssid: string;
  rssi: number;
  channel: number;
  frequency: '2.4GHz' | '5GHz';
  security: 'WPA3' | 'WPA2' | 'WPA' | 'WEP' | 'Open';
  isConnected: boolean;
  isHidden: boolean;
  linkSpeed?: number;
  subnet?: string;
}

export interface NetworkInfo {
  ssid: string;
  localIP: string;
  publicIP: string;
  gateway: string;
  isp: string;
  city: string;
  country: string;
  asn: string;
  frequency: string;
  channel: string;
  rssi: number;
  isConnected: boolean;
  isInternetReachable: boolean;
  connectionType: string;
}

export interface PingResult {
  seq: number;
  latency: number;
  ttl: number;
  success: boolean;
}

export interface SpeedTestResult {
  download: number;
  upload: number | null;
  ping: number;
  jitter: number;
}

export interface PortResult {
  port: number;
  service: string;
  status: 'open' | 'closed' | 'filtered';
  risk: 'HIGH' | 'MED' | 'LOW' | 'NONE';
}

export interface SecurityAlert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  severity: AlertSeverity;
}

export interface SecurityAuditResult {
  score: number;
  grade: SecurityGrade;
  findings: SecurityFinding[];
}

export interface SecurityFinding {
  id: string;
  category: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  remediation: string;
}

export interface OutageCheckResult {
  layer1: 'pass' | 'fail' | 'pending';
  layer2: 'pass' | 'fail' | 'pending';
  layer3: 'pass' | 'fail' | 'pending';
  layer4: 'pass' | 'fail' | 'pending';
  verdict: 'all_good' | 'internet_down' | 'isp_issue' | 'router_issue' | 'wifi_issue' | 'checking';
  verdictMessage: string;
}

export interface HealthScore {
  total: number;
  signal: number;
  latency: number;
  security: number;
  devices: number;
  stability: number;
  grade: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

export interface AppSettings {
  themeMode: 'dark' | 'light' | 'system';
  accent: string;
  privacyMode: boolean;
  pingCount: 1 | 4 | 10;
  autoRefresh: 'off' | '1min' | '5min' | '15min';
  notifyNewDevice: boolean;
  notifyNetworkChange: boolean;
  notifySecurityRisk: boolean;
  units: 'Mbps' | 'Kbps';
  exportFormat: 'txt' | 'json' | 'pdf';
  scanTimeout: 1000 | 3000 | 5000;
  showClosedPorts: boolean;
  hiddenTabs: string[];
  compactMode: boolean;
  navStyle: 'floating' | 'bar' | 'compact' | 'minimal' | 'bubble' | 'underline';
  trackActivity: boolean;
}
