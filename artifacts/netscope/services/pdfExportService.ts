import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { Platform } from 'react-native';

export interface ReportData {
  networkInfo?: { ssid: string; ip: string; publicIP: string; gateway: string; isp: string; };
  deviceCount?: number;
  securityScore?: number;
  downloadSpeed?: number;
  uploadSpeed?: number;
  ping?: number;
  traceroute?: { host: string; hops: number; responding: number; };
  ssl?: {
    domain: string; grade?: string; issuer?: string; expiresInDays?: number | null;
    headers?: { hsts?: boolean; csp?: boolean; xfo?: string | null; xcto?: boolean; referrer?: string | null; };
  };
  headers?: {
    url: string; status?: number; statusText?: string; count?: number;
    securityCount?: number; cachingCount?: number; serverCount?: number; contentCount?: number;
  };
  wol?: { mac: string; broadcastIP: string; port: string; };
  devices?: { ip: string; mac?: string; hostname?: string; vendor?: string; type?: string }[];
}

type ExportFormat = 'json' | 'txt' | 'pdf';

function e(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function row(label: string, value: string, color?: string): string {
  const valStyle = color ? ` style="color:${color};font-weight:700"` : '';
  return `<div class="sr"><span class="sk">${e(label)}</span><span class="sv"${valStyle}>${e(value)}</span></div>`;
}

function eduCard(color: string, icon: string, title: string, what: string, use: string, how: string, extra?: string): string {
  return `
<div class="edu-card" style="border-left:3px solid ${color}">
  <div class="edu-header" style="color:${color}">
    <span class="edu-icon">${icon}</span>
    <span class="edu-title">${e(title)}</span>
    <span class="edu-badge" style="background:${color}22;color:${color}">EDUCATIONAL</span>
  </div>
  <div class="edu-grid">
    <div class="edu-item">
      <div class="edu-label">WHAT IT IS</div>
      <div class="edu-text">${e(what)}</div>
    </div>
    <div class="edu-item">
      <div class="edu-label">PRIMARY USE</div>
      <div class="edu-text">${e(use)}</div>
    </div>
    <div class="edu-item" style="grid-column:1/-1">
      <div class="edu-label">HOW IT WORKS</div>
      <div class="edu-text">${e(how)}</div>
    </div>
    ${extra ? `<div class="edu-item" style="grid-column:1/-1"><div class="edu-label">RESULTS</div><div class="edu-text">${e(extra)}</div></div>` : ''}
  </div>
</div>`;
}

function buildHtml(data: ReportData): string {
  const now = new Date().toLocaleString();
  const accent = '#4F87FF';

  const isToolReport = !!(data.traceroute || data.ssl || data.headers || data.wol);

  // ── Educational sections ──────────────────────────────────────────────────
  const eduBlocks: string[] = [];

  if (data.traceroute) {
    eduBlocks.push(eduCard(
      '#A855F7', '🛣️', 'Traceroute',
      'Traceroute maps the network path between your device and a destination host, revealing every intermediate router (hop) along the route.',
      'Used to diagnose routing delays, identify where packet loss begins, detect ISP congestion, and verify that traffic is taking the expected path across the internet.',
      'It sends probes with incrementing TTL (Time To Live) values. Each router decrements TTL by 1; when it hits 0, the router returns an ICMP "Time Exceeded" message. By collecting these replies, Traceroute reconstructs the full hop-by-hop path. NetScope uses the HackerTarget MTR API which combines traditional traceroute with MTR (My Traceroute) for real-time latency and packet loss at each hop.',
      `Traced ${data.traceroute.hops} hops to ${data.traceroute.host} · ${data.traceroute.responding} of ${data.traceroute.hops} hops responding · ${data.traceroute.hops - data.traceroute.responding} silent (firewall-filtered) hops`,
    ));
    eduBlocks.push(`
<div class="tip-card">
  <div class="tip-title">📖 How to Read Traceroute Results</div>
  <ul class="tip-list">
    <li><b>Hop 1</b> — Your home router/gateway (typically 192.168.x.1)</li>
    <li><b>Hops 2–3</b> — Your ISP's local infrastructure (DSLAM, CMTS, aggregation switches)</li>
    <li><b>Hops 4–8</b> — ISP backbone, peering points and internet exchanges (IXPs)</li>
    <li><b>Final hop</b> — The destination server responding to your probe</li>
    <li><b>* * *</b> — Router silently drops ICMP probes (firewall rule) — not a broken link</li>
    <li><b>High latency mid-route then drops</b> — That router de-prioritizes ICMP; not a real bottleneck</li>
    <li><b>High latency persisting from a hop onward</b> — Real congestion or routing problem at that node</li>
  </ul>
</div>`);
  }

  if (data.ssl) {
    const gradeColor = data.ssl.grade === 'A+' || data.ssl.grade === 'A' ? '#00E5A0' : data.ssl.grade === 'B' ? '#4F87FF' : '#FFBE5C';
    const h = data.ssl.headers;
    const headersHtml = h ? `
<div class="sec-header-grid">
  ${secHeaderRow('HSTS', !!h.hsts, 'Strict-Transport-Security: forces browser to always use HTTPS — prevents SSL-stripping attacks')}
  ${secHeaderRow('CSP', !!h.csp, 'Content-Security-Policy: limits which scripts, styles and images can load — blocks XSS injection')}
  ${secHeaderRow('X-Frame-Options', !!(h.xfo), 'Prevents clickjacking: stops malicious sites embedding this page in an invisible iframe')}
  ${secHeaderRow('X-Content-Type-Options', !!h.xcto, 'nosniff: prevents browsers from MIME-sniffing responses away from the declared content-type')}
  ${secHeaderRow('Referrer-Policy', !!(h.referrer), 'Controls how much URL is leaked in the Referer header when following links to external sites')}
</div>` : '';
    eduBlocks.push(eduCard(
      '#00E5A0', '🔒', 'SSL / TLS Certificate Checker',
      'Inspects the TLS (Transport Layer Security) certificate for a domain — verifying its validity, issuer, expiry date, Subject Alternative Names, and security header configuration.',
      'Used by security engineers, developers, and sysadmins to audit HTTPS deployments, catch expiring certificates before browsers block the site, and verify that security headers are correctly configured.',
      'NetScope queries the Certificate Transparency (CT) log database at crt.sh — a public append-only ledger of every certificate ever issued by trusted CAs. It also sends a HEAD request to the domain to inspect its HTTP security headers.',
      `Domain: ${data.ssl.domain} · Grade: ${data.ssl.grade ?? '—'} · Issuer: ${data.ssl.issuer ?? '—'} · Expires in: ${data.ssl.expiresInDays == null ? '—' : data.ssl.expiresInDays + ' days'}`,
    ));
    eduBlocks.push(`
<div class="grade-explainer">
  <div class="tip-title" style="color:${gradeColor}">🏅 Certificate Grade: ${data.ssl.grade ?? '—'}</div>
  <ul class="tip-list">
    <li><b style="color:#00E5A0">A+</b> — Certificate valid >60 days, HSTS enabled, strong headers. Excellent security posture.</li>
    <li><b style="color:#00E5A0">A</b>  — Valid >30 days, most security headers present. Good — minor improvements possible.</li>
    <li><b style="color:#4F87FF">B</b>  — Valid certificate but missing HSTS or CSP. Moderate risk — headers need attention.</li>
    <li><b style="color:#FFBE5C">C</b>  — Certificate expires in &lt;14 days. Renew immediately or browsers will block access.</li>
    <li><b style="color:#FF5C5C">Expired</b> — Certificate has expired. Site is inaccessible to browsers. Critical action required.</li>
  </ul>
</div>
<div class="tip-card" style="margin-top:12px">
  <div class="tip-title">🛡️ Security Headers Analysis</div>
  ${headersHtml}
</div>`);
  }

  if (data.headers) {
    eduBlocks.push(eduCard(
      '#4F87FF', '📋', 'HTTP Headers Inspector',
      'HTTP response headers are metadata that servers send back with every response. They control caching, security policies, content type, and reveal information about the server\'s technology stack.',
      'Used for security audits, debugging, CDN/caching analysis, and reconnaissance. Missing security headers are a common finding in web app penetration tests. Caching headers affect site performance significantly.',
      'NetScope sends an HTTP HEAD request (retrieves only headers, no body — fast and lightweight). It then categorises each header into: Security (HSTS, CSP, etc.), Caching (Cache-Control, ETag, etc.), Server info (Server, Via, CF-Ray, etc.), and Content (Content-Type, encoding, etc.).',
      `URL: ${data.headers.url} · Status: ${data.headers.status ?? '—'} ${data.headers.statusText ?? ''} · ${data.headers.count ?? 0} total headers · Security: ${data.headers.securityCount ?? 0} · Caching: ${data.headers.cachingCount ?? 0} · Server: ${data.headers.serverCount ?? 0}`,
    ));
    eduBlocks.push(`
<div class="tip-card">
  <div class="tip-title">🔍 What Headers Tell You</div>
  <ul class="tip-list">
    <li><b>Server: nginx 1.24</b> — Reveals web server software + version. Cross-reference against CVE databases.</li>
    <li><b>X-Powered-By: PHP/8.1</b> — Exposes backend language and version. Attackers use this for targeted exploits.</li>
    <li><b>Cache-Control: no-store</b> — Prevents browsers and CDNs from caching sensitive pages (e.g., account pages).</li>
    <li><b>Access-Control-Allow-Origin: *</b> — Permissive CORS policy. Any site can read API responses — potential data leak.</li>
    <li><b>Set-Cookie: session=…</b> — Check for HttpOnly and Secure flags. Missing flags = session hijack risk.</li>
    <li><b>X-Debug-Token</b> or <b>X-Internal-*</b> — May leak internal IP ranges, hostnames or debug data.</li>
    <li><b>CF-Ray</b> or <b>Via: cloudflare</b> — Site is behind Cloudflare CDN. Real origin IP may be hidden.</li>
  </ul>
</div>`);
  }

  if (data.wol) {
    eduBlocks.push(eduCard(
      '#FF5C8A', '⚡', 'Wake-on-LAN (WOL)',
      'Wake-on-LAN is a networking protocol that allows a device to be turned on remotely over a local network by sending a specially crafted "magic packet" to its network interface card (NIC).',
      'Used by IT administrators to remotely power on servers, workstations, and lab machines without physical access. Also useful for home users who want to wake a desktop PC from a laptop or phone.',
      'The magic packet consists of 102 bytes: 6 bytes of 0xFF (sync stream), followed by the 6-byte MAC address repeated 16 times. This pattern is recognised by the NIC\'s hardware controller which stays powered on in a low-power state even when the system is off, listening for this specific pattern on UDP port 7 or 9.',
      `Target MAC: ${data.wol.mac} · Broadcast: ${data.wol.broadcastIP}:${data.wol.port} · Packet size: 102 bytes (6 sync + 96 MAC)`,
    ));
    eduBlocks.push(`
<div class="tip-card">
  <div class="tip-title">✅ WOL Setup Checklist</div>
  <ul class="tip-list">
    <li><b>BIOS/UEFI:</b> Enable "Wake on LAN" or "Power on by PCI-E" in Power Management settings</li>
    <li><b>Windows NIC:</b> Device Manager → Network Adapter → Properties → Power Management → ✓ Allow this device to wake the computer</li>
    <li><b>Windows Fast Startup:</b> Disable Fast Startup (Control Panel → Power Options → Choose what the power button does)</li>
    <li><b>Same subnet:</b> WOL broadcast (255.255.255.255 or 192.168.x.255) only reaches devices on the same network segment</li>
    <li><b>Remote WOL:</b> For internet access, use a VPN, SSH tunnel, or router with WOL port-forwarding support</li>
    <li><b>Verify MAC:</b> Windows → ipconfig /all | Linux → ip link show | Android → Settings → About → Status → Wi-Fi MAC</li>
  </ul>
</div>`);
  }

  // ── Device table ──────────────────────────────────────────────────────────
  const deviceRows = (data.devices ?? []).slice(0, 20).map(d =>
    `<tr><td>${e(d.ip)}</td><td>${e(d.mac ?? '—')}</td><td>${e(d.hostname ?? '—')}</td><td>${e(d.vendor ?? '—')}</td><td>${e(d.type ?? '—')}</td></tr>`
  ).join('');

  const networkSection = (data.networkInfo || data.downloadSpeed != null || data.ping != null) ? `
<div class="grid">
  <div class="card">
    <div class="cl">Network Info</div>
    ${row('SSID', data.networkInfo?.ssid || '—', accent)}
    ${row('Local IP', data.networkInfo?.ip || '—')}
    ${row('Public IP', data.networkInfo?.publicIP || '—')}
    ${row('Gateway', data.networkInfo?.gateway || '—')}
    ${row('ISP', data.networkInfo?.isp || '—')}
  </div>
  <div class="card">
    <div class="cl">Performance</div>
    ${row('Download', data.downloadSpeed != null ? `${data.downloadSpeed} Mbps` : '—', '#00E5A0')}
    ${row('Upload', data.uploadSpeed != null ? `${data.uploadSpeed} Mbps` : '—', accent)}
    ${row('Ping', data.ping != null ? `${data.ping} ms` : '—')}
    ${row('Devices', String(data.deviceCount ?? '—'))}
    ${row('Security Score', data.securityScore != null ? `${data.securityScore}/100` : '—', (data.securityScore ?? 0) >= 80 ? '#00E5A0' : '#FFBE5C')}
  </div>
</div>` : '';

  const toolReportHeader = isToolReport ? `
<div class="tool-banner">
  <span class="tool-banner-label">TOOL ANALYSIS REPORT</span>
  <span class="tool-banner-desc">Contains educational explanations of network tools used in this session</span>
</div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>NetScope Report</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;background:#050816;color:#EEF2FF;padding:28px;line-height:1.4}
  .header{display:flex;align-items:center;gap:16px;margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid rgba(79,135,255,0.15)}
  .logo{width:48px;height:48px;background:linear-gradient(135deg,#4F87FF,#00D4FF);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#fff;flex-shrink:0}
  h1{font-size:24px;font-weight:900;letter-spacing:-0.8px;color:#EEF2FF}
  .sub{color:#7C96CC;font-size:12px;margin-top:3px}
  .ts{margin-left:auto;color:#354770;font-size:10px;text-align:right;flex-shrink:0}
  .tool-banner{background:linear-gradient(135deg,rgba(79,135,255,0.12),rgba(0,212,255,0.06));border:1px solid rgba(79,135,255,0.2);border-radius:12px;padding:14px 18px;margin-bottom:22px;display:flex;align-items:center;gap:14px}
  .tool-banner-label{font-size:10px;font-weight:800;letter-spacing:1.5px;color:${accent};background:rgba(79,135,255,0.12);padding:3px 10px;border-radius:999px;flex-shrink:0}
  .tool-banner-desc{font-size:12px;color:#7C96CC}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px}
  .card{background:#080D1A;border:1px solid rgba(79,135,255,0.1);border-radius:14px;padding:18px}
  .cl{font-size:9px;font-weight:800;letter-spacing:2px;color:#354770;margin-bottom:12px;text-transform:uppercase}
  .sr{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(79,135,255,0.07)}
  .sr:last-child{border-bottom:none}
  .sk{color:#7C96CC;font-size:12px}
  .sv{color:#EEF2FF;font-size:12px;font-weight:600}
  .edu-card{background:#080D1A;border:1px solid rgba(79,135,255,0.1);border-radius:14px;padding:18px;margin-bottom:16px;overflow:hidden}
  .edu-header{display:flex;align-items:center;gap:8px;margin-bottom:14px}
  .edu-icon{font-size:18px;line-height:1}
  .edu-title{font-size:15px;font-weight:800;flex:1;letter-spacing:-0.3px}
  .edu-badge{font-size:9px;font-weight:700;letter-spacing:1px;padding:2px 8px;border-radius:999px}
  .edu-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .edu-item{background:rgba(79,135,255,0.04);border-radius:8px;padding:10px 12px}
  .edu-label{font-size:8px;font-weight:800;letter-spacing:1.5px;color:#354770;margin-bottom:5px;text-transform:uppercase}
  .edu-text{font-size:11px;color:#A9B9E8;line-height:1.6}
  .tip-card{background:rgba(79,135,255,0.04);border:1px solid rgba(79,135,255,0.1);border-radius:12px;padding:14px 16px;margin-bottom:16px}
  .grade-explainer{background:rgba(79,135,255,0.04);border:1px solid rgba(79,135,255,0.1);border-radius:12px;padding:14px 16px;margin-bottom:12px}
  .tip-title{font-size:12px;font-weight:700;color:#EEF2FF;margin-bottom:10px}
  .tip-list{padding-left:16px;color:#7C96CC;font-size:11px;display:flex;flex-direction:column;gap:5px}
  .tip-list li{line-height:1.5}
  .sec-header-grid{display:flex;flex-direction:column;gap:6px;margin-top:8px}
  .sec-row{display:flex;align-items:flex-start;gap:8px;padding:7px 10px;border-radius:7px;background:rgba(0,0,0,0.2)}
  .sec-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:3px}
  .sec-name{font-size:11px;font-weight:700;color:#EEF2FF;min-width:160px;flex-shrink:0}
  .sec-desc{font-size:10px;color:#7C96CC;line-height:1.5;flex:1}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  th{font-size:9px;font-weight:700;letter-spacing:1px;color:#354770;text-transform:uppercase;padding:8px 6px;border-bottom:1px solid rgba(79,135,255,0.12);text-align:left}
  td{font-size:11px;color:#7C96CC;padding:7px 6px;border-bottom:1px solid rgba(79,135,255,0.05)}
  footer{margin-top:28px;text-align:center;color:#354770;font-size:11px;border-top:1px solid rgba(79,135,255,0.08);padding-top:16px}
  .badge{display:inline-block;background:rgba(79,135,255,0.1);color:${accent};border:1px solid rgba(79,135,255,0.2);border-radius:999px;padding:3px 10px;font-size:10px;font-weight:700;letter-spacing:1px}
  .section-sep{border:none;border-top:1px solid rgba(79,135,255,0.08);margin:20px 0}
</style>
</head>
<body>
<div class="header">
  <div class="logo">N</div>
  <div>
    <h1>NetScope Report</h1>
    <div class="sub">${isToolReport ? 'Tool Analysis Report with Educational Explanations' : 'Network Intelligence Summary'}</div>
  </div>
  <div class="ts">Generated<br>${e(now)}</div>
</div>

${toolReportHeader}
${networkSection}
${eduBlocks.join('\n')}
${deviceRows ? `<hr class="section-sep"><div class="card">
  <div class="cl">Discovered Devices</div>
  <table><thead><tr><th>IP</th><th>MAC</th><th>Hostname</th><th>Vendor</th><th>Type</th></tr></thead>
  <tbody>${deviceRows}</tbody></table>
</div>` : ''}
<footer>
  <span class="badge">NETSCOPE</span>
  <p style="margin-top:8px">Generated by NetScope · com.mkrinfinity.netscope · For educational and authorized network analysis only</p>
</footer>
</body></html>`;
}

function secHeaderRow(name: string, present: boolean, desc: string): string {
  const color = present ? '#00E5A0' : '#FF5C5C';
  const label = present ? '✓ Present' : '✗ Missing';
  return `<div class="sec-row">
  <div class="sec-dot" style="background:${color}"></div>
  <span class="sec-name">${e(name)} <span style="color:${color};font-size:10px">${label}</span></span>
  <span class="sec-desc">${e(desc)}</span>
</div>`;
}

function buildJson(data: ReportData): string {
  return JSON.stringify({
    meta: { app: 'NetScope', version: '1.0.0', generated: new Date().toISOString() },
    network: data.networkInfo ?? {},
    performance: { downloadMbps: data.downloadSpeed ?? null, uploadMbps: data.uploadSpeed ?? null, pingMs: data.ping ?? null },
    devices: { count: data.deviceCount ?? null, list: data.devices ?? [] },
    security: { score: data.securityScore ?? null },
    tools: {
      traceroute: data.traceroute ?? null,
      ssl: data.ssl ?? null,
      headers: data.headers ?? null,
      wol: data.wol ?? null,
    },
  }, null, 2);
}

function buildTxt(data: ReportData): string {
  const line = (k: string, v: string) => `  ${k.padEnd(20)}: ${v}`;
  const sep = '─'.repeat(50);
  const deviceLines = (data.devices ?? []).slice(0, 20).map(
    d => `  ${d.ip.padEnd(16)} ${(d.mac ?? '—').padEnd(18)} ${d.hostname ?? '—'}`
  );
  const toolLines: string[] = [];
  if (data.traceroute) {
    toolLines.push(sep, 'TRACEROUTE', line('Host', data.traceroute.host), line('Hops', String(data.traceroute.hops)), line('Responding', String(data.traceroute.responding)));
    toolLines.push('  What: Maps network path from your device to destination host via MTR probe.');
    toolLines.push('  Use:  Diagnose routing delays, packet loss, ISP congestion.');
  }
  if (data.ssl) {
    toolLines.push(sep, 'SSL CHECKER', line('Domain', data.ssl.domain), line('Grade', data.ssl.grade ?? '—'), line('Issuer', data.ssl.issuer ?? '—'), line('Expires in', data.ssl.expiresInDays == null ? '—' : `${data.ssl.expiresInDays} days`));
    toolLines.push('  What: Inspects TLS certificate validity and security headers.');
    toolLines.push('  Use:  Detect expired certs, missing security headers, verify HTTPS configuration.');
  }
  if (data.headers) {
    toolLines.push(sep, 'HTTP HEADERS', line('URL', data.headers.url), line('Status', `${data.headers.status ?? '—'} ${data.headers.statusText ?? ''}`), line('Total headers', String(data.headers.count ?? 0)));
    toolLines.push('  What: Retrieves HTTP response headers from a server.');
    toolLines.push('  Use:  Security audits, caching analysis, server fingerprinting.');
  }
  if (data.wol) {
    toolLines.push(sep, 'WAKE-ON-LAN', line('Target MAC', data.wol.mac), line('Broadcast', `${data.wol.broadcastIP}:${data.wol.port}`));
    toolLines.push('  What: Generates a 102-byte magic packet to remotely wake a device.');
    toolLines.push('  Use:  Power on PCs, servers and lab machines without physical access.');
  }
  return [
    'NETSCOPE NETWORK REPORT',
    `Generated: ${new Date().toLocaleString()}`,
    sep,
    ...(data.networkInfo ? ['NETWORK', line('SSID', data.networkInfo.ssid), line('Local IP', data.networkInfo.ip), line('Public IP', data.networkInfo.publicIP), line('Gateway', data.networkInfo.gateway), line('ISP', data.networkInfo.isp)] : []),
    ...(data.downloadSpeed != null ? [sep, 'PERFORMANCE', line('Download', `${data.downloadSpeed} Mbps`), line('Upload', `${data.uploadSpeed ?? '—'} Mbps`), line('Ping', `${data.ping ?? '—'} ms`)] : []),
    ...toolLines,
    ...(deviceLines.length > 0 ? [sep, 'DEVICES', `  ${'IP'.padEnd(16)} ${'MAC'.padEnd(18)} HOSTNAME`, ...deviceLines] : []),
    sep,
    'NetScope · com.mkrinfinity.netscope · For authorized network analysis only',
  ].join('\n');
}

export async function exportNetworkReport(
  data: ReportData = {},
  format: ExportFormat = 'json',
): Promise<{ success: boolean; error?: string }> {
  try {
    if (Platform.OS === 'web') {
      if (format === 'pdf') {
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(buildHtml(data));
          win.document.close();
          setTimeout(() => win.print(), 600);
        }
        return { success: true };
      }
      const content = format === 'json' ? buildJson(data) : buildTxt(data);
      const mime = format === 'json' ? 'application/json' : 'text/plain';
      const filename = `netscope-report.${format}`;
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      return { success: true };
    }

    if (format === 'pdf') {
      const { uri } = await Print.printToFileAsync({ html: buildHtml(data), base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share NetScope Report (PDF)', UTI: 'com.adobe.pdf' });
      }
      return { success: true };
    }

    const content = format === 'json' ? buildJson(data) : buildTxt(data);
    const { Share } = require('react-native');
    await Share.share({ message: content, title: `NetScope Report (.${format})` });
    return { success: true };
  } catch (ex: any) {
    return { success: false, error: ex?.message || 'Export failed' };
  }
}
