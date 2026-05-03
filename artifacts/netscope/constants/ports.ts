export interface PortInfo {
  service: string;
  risk: 'HIGH' | 'MED' | 'LOW' | 'NONE';
  description: string;
}

export const PORT_MAP: Record<number, PortInfo> = {
  21:   { service: 'FTP',        risk: 'HIGH', description: 'File Transfer Protocol — unencrypted' },
  22:   { service: 'SSH',        risk: 'LOW',  description: 'Secure Shell — encrypted remote access' },
  23:   { service: 'Telnet',     risk: 'HIGH', description: 'Unencrypted remote access — critical risk' },
  25:   { service: 'SMTP',       risk: 'MED',  description: 'Email sending protocol' },
  53:   { service: 'DNS',        risk: 'LOW',  description: 'Domain Name System resolver' },
  80:   { service: 'HTTP',       risk: 'MED',  description: 'Unencrypted web server' },
  110:  { service: 'POP3',       risk: 'MED',  description: 'Email retrieval — legacy' },
  143:  { service: 'IMAP',       risk: 'MED',  description: 'Email access protocol' },
  443:  { service: 'HTTPS',      risk: 'NONE', description: 'Encrypted web server' },
  445:  { service: 'SMB',        risk: 'HIGH', description: 'Windows file sharing — vulnerable to ransomware' },
  1194: { service: 'OpenVPN',    risk: 'LOW',  description: 'VPN service' },
  3306: { service: 'MySQL',      risk: 'HIGH', description: 'Database — should not be exposed' },
  3389: { service: 'RDP',        risk: 'HIGH', description: 'Remote Desktop — high attack surface' },
  5900: { service: 'VNC',        risk: 'HIGH', description: 'Remote desktop — often unencrypted' },
  6379: { service: 'Redis',      risk: 'HIGH', description: 'In-memory database — often unsecured' },
  8080: { service: 'HTTP-Alt',   risk: 'MED',  description: 'Alternate HTTP / admin panels' },
  8443: { service: 'HTTPS-Alt',  risk: 'LOW',  description: 'Alternate HTTPS' },
  27017:{ service: 'MongoDB',    risk: 'HIGH', description: 'MongoDB — check authentication enabled' },
};

export const COMMON_PORTS = [21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3389, 8080, 8443];

export function getPortInfo(port: number): PortInfo {
  return PORT_MAP[port] || { service: 'Unknown', risk: 'NONE', description: 'Unknown service' };
}
