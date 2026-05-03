import { NetworkDevice, WiFiNetwork, SecurityAuditResult, SecurityFinding, SecurityGrade } from '@/types';

function calcGrade(score: number): SecurityGrade {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 45) return 'D';
  return 'F';
}

export function runSecurityAudit(
  networks: WiFiNetwork[],
  devices: NetworkDevice[],
  connectedSSID: string,
): SecurityAuditResult {
  const findings: SecurityFinding[] = [];
  let score = 100;

  const connected = networks.find(n => n.isConnected);

  // WiFi security check
  if (connected) {
    if (connected.security === 'Open') {
      score -= 40;
      findings.push({
        id: 'open-network',
        category: 'WiFi Security',
        title: 'Open WiFi Network',
        description: 'Your network has no encryption. Anyone nearby can intercept your traffic.',
        severity: 'critical',
        remediation: 'Set a WPA2 or WPA3 password on your router immediately. Go to your router admin panel (usually 192.168.1.1).',
      });
    } else if (connected.security === 'WEP') {
      score -= 30;
      findings.push({
        id: 'wep-network',
        category: 'WiFi Security',
        title: 'WEP Encryption (Broken)',
        description: 'WEP encryption was cracked in 2001 and offers no real security.',
        severity: 'critical',
        remediation: 'Upgrade your router to WPA2 or WPA3. This requires changing your router\'s security settings.',
      });
    } else if (connected.security === 'WPA') {
      score -= 15;
      findings.push({
        id: 'wpa-weak',
        category: 'WiFi Security',
        title: 'WPA Encryption (Weak)',
        description: 'WPA has known vulnerabilities. WPA2 or WPA3 should be used.',
        severity: 'warning',
        remediation: 'Upgrade to WPA2 or WPA3 in your router\'s wireless settings.',
      });
    }
  }

  // Unknown devices
  const unknownDevices = devices.filter(d => d.trust === 'unknown' && d.type !== 'router');
  if (unknownDevices.length > 3) {
    score -= 15;
    findings.push({
      id: 'unknown-devices',
      category: 'Connected Devices',
      title: `${unknownDevices.length} Unknown Devices`,
      description: `${unknownDevices.length} unrecognized devices are connected to your network.`,
      severity: unknownDevices.length > 5 ? 'critical' : 'warning',
      remediation: 'Review all connected devices in the Scanner tab. Mark trusted devices and investigate unknown ones.',
    });
  }

  // High-risk ports
  const highRiskDevices = devices.filter(d => d.openPorts.includes(23) || d.openPorts.includes(21));
  if (highRiskDevices.length > 0) {
    score -= 20;
    findings.push({
      id: 'risky-ports',
      category: 'Open Ports',
      title: 'Risky Ports Open',
      description: `${highRiskDevices.length} device(s) have Telnet (23) or FTP (21) open — both unencrypted.`,
      severity: 'critical',
      remediation: 'Disable Telnet and FTP on these devices. Use SSH instead of Telnet, and SFTP instead of FTP.',
    });
  }

  // Crowded channel
  const connectedChannel = connected?.channel || 6;
  const networksOnSameChannel = networks.filter(n => n.channel === connectedChannel && !n.isConnected).length;
  if (networksOnSameChannel >= 4) {
    score -= 5;
    findings.push({
      id: 'channel-congestion',
      category: 'WiFi Performance',
      title: 'Crowded WiFi Channel',
      description: `${networksOnSameChannel + 1} networks on channel ${connectedChannel}. This reduces your speeds.`,
      severity: 'info',
      remediation: 'Change your router\'s WiFi channel in the Channel Analyzer to a less congested one.',
    });
  }

  score = Math.max(0, Math.min(100, score));
  return { score, grade: calcGrade(score), findings };
}

export function calcHealthScore(params: {
  rssi: number; latencyMs: number; securityScore: number;
  deviceCount: number; jitter: number;
}): { total: number; signal: number; latency: number; security: number; devices: number; stability: number; grade: 'Excellent' | 'Good' | 'Fair' | 'Poor' } {
  const signal = Math.max(0, Math.min(100, Math.round(((params.rssi + 90) / 60) * 100)));
  const latency = params.latencyMs <= 0 ? 0 : Math.max(0, Math.round(100 - (params.latencyMs / 2)));
  const security = params.securityScore;
  const devices = params.deviceCount <= 8 ? 100 : Math.max(0, 100 - (params.deviceCount - 8) * 5);
  const stability = params.jitter < 10 ? 100 : params.jitter < 30 ? 60 : params.jitter < 60 ? 20 : 0;
  const total = Math.round((signal + latency + security + devices + stability) / 5);

  const grade = total >= 80 ? 'Excellent' : total >= 60 ? 'Good' : total >= 40 ? 'Fair' : 'Poor';
  return { total, signal, latency, security, devices, stability, grade };
}
