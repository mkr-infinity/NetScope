export const OUI_MAP: Record<string, string> = {
  'AA:BB:CC': 'Apple',
  '00:1A:2B': 'Cisco',
  'DC:A6:32': 'Raspberry Pi',
  'B8:27:EB': 'Raspberry Pi',
  'FC:FB:FB': 'Cisco',
  '00:50:56': 'VMware',
  '00:0C:29': 'VMware',
  '00:25:00': 'Apple',
  '3C:22:FB': 'Apple',
  '88:66:5A': 'Apple',
  'AC:BC:32': 'Apple',
  '00:17:C4': 'Samsung',
  '00:16:32': 'Samsung',
  'F0:72:8C': 'Samsung',
  '10:AE:60': 'Samsung',
  '28:EE:52': 'Xiaomi',
  'AC:F7:F3': 'Xiaomi',
  'F4:8C:50': 'Xiaomi',
  '00:E0:4C': 'Realtek',
  '00:1B:21': 'Intel',
  'D4:3D:7E': 'Intel',
  '00:21:6A': 'Intel',
  'C8:B3:73': 'Intel',
  'D0:37:45': 'TP-Link',
  '14:CF:E2': 'TP-Link',
  '98:DA:C4': 'TP-Link',
  '50:C7:BF': 'TP-Link',
  'E4:A7:C5': 'Netgear',
  '00:14:6C': 'Netgear',
  '20:E5:2A': 'Netgear',
  'C0:FF:D4': 'Google',
  'F4:F5:D8': 'Google',
  '54:60:09': 'Google',
  '00:E0:D0': 'Amazon',
  'FC:A6:67': 'Amazon',
  '74:75:48': 'Amazon',
  '00:11:32': 'Synology',
  '00:11:D9': 'TiVo',
  '00:1D:BA': 'Sony',
  'A8:20:66': 'Apple',
  '18:65:90': 'Apple',
};

export const DEVICE_PREFIXES = [
  { prefix: 'A8:20:66', vendor: 'Apple' },
  { prefix: '18:65:90', vendor: 'Apple' },
  { prefix: '3C:22:FB', vendor: 'Apple' },
  { prefix: 'D0:37:45', vendor: 'TP-Link' },
  { prefix: '14:CF:E2', vendor: 'TP-Link' },
  { prefix: 'F0:72:8C', vendor: 'Samsung' },
  { prefix: '10:AE:60', vendor: 'Samsung' },
  { prefix: '28:EE:52', vendor: 'Xiaomi' },
  { prefix: 'C0:FF:D4', vendor: 'Google' },
  { prefix: 'FC:A6:67', vendor: 'Amazon' },
  { prefix: 'D4:3D:7E', vendor: 'Intel' },
  { prefix: 'E4:A7:C5', vendor: 'Netgear' },
];

export function lookupVendor(mac: string): string {
  const prefix = mac.substring(0, 8).toUpperCase();
  return OUI_MAP[prefix] || 'Unknown';
}

export function generateRealisticMAC(vendorIndex: number): string {
  const prefix = DEVICE_PREFIXES[vendorIndex % DEVICE_PREFIXES.length];
  const rand = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
  return `${prefix.prefix}:${rand()}:${rand()}:${rand()}`;
}
