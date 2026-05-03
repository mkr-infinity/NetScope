import { Platform } from 'react-native';
import { PortResult } from '@/types';
import { COMMON_PORTS, getPortInfo } from '@/constants/ports';

const TIMEOUT = Platform.OS === 'web' ? 2000 : 1200;

// Real TCP connect probe using HTTP fetch.
// open   — connection established (server responded)
// closed — connection refused quickly (host alive but port closed)
// filtered — timed out (firewall or unreachable)
async function probePort(ip: string, port: number): Promise<PortResult['status']> {
  const controller = new AbortController();
  const start = Date.now();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    await fetch(`http://${ip}:${port}`, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);
    return 'open';
  } catch {
    clearTimeout(timer);
    const elapsed = Date.now() - start;
    const timedOut = controller.signal.aborted;
    if (timedOut || elapsed >= TIMEOUT * 0.9) return 'filtered';
    // Error came back fast → connection refused → port is closed on a live host
    return 'closed';
  }
}

export async function scanCommonPorts(
  ip: string,
  onResult: (result: PortResult) => void,
): Promise<PortResult[]> {
  const results: PortResult[] = [];

  // Probe all ports concurrently for speed
  await Promise.all(
    COMMON_PORTS.map(async port => {
      const status = await probePort(ip, port);
      const info = getPortInfo(port);
      const result: PortResult = {
        port,
        service: info.service,
        status,
        risk: status === 'open' ? info.risk : 'NONE',
      };
      results.push(result);
      onResult(result);
    }),
  );

  return results.sort((a, b) => a.port - b.port);
}

export async function scanPortRange(
  ip: string,
  fromPort: number,
  toPort: number,
  onResult: (result: PortResult) => void,
): Promise<PortResult[]> {
  const results: PortResult[] = [];
  const limit = Math.min(toPort - fromPort + 1, 100);
  const ports: number[] = [];
  for (let p = fromPort; p < fromPort + limit; p++) ports.push(p);

  // Probe in batches of 20 to avoid overwhelming the network stack
  for (let i = 0; i < ports.length; i += 20) {
    await Promise.all(
      ports.slice(i, i + 20).map(async port => {
        const status = await probePort(ip, port);
        const info = getPortInfo(port);
        const result: PortResult = { port, service: info.service, status, risk: status === 'open' ? info.risk : 'NONE' };
        results.push(result);
        onResult(result);
      }),
    );
  }

  return results.sort((a, b) => a.port - b.port);
}
