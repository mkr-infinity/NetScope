import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { NetworkInfo, NetworkDevice, WiFiNetwork, HealthScore } from '@/types';
import { getNetworkInfo, measureMultiplePings, calcJitter } from '@/services/networkService';
import { calcHealthScore, runSecurityAudit } from '@/services/securityService';

interface NetworkContextValue {
  networkInfo: NetworkInfo | null;
  devices: NetworkDevice[];
  wifiNetworks: WiFiNetwork[];
  healthScore: HealthScore | null;
  pingHistory: number[];
  isLoading: boolean;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  setDevices: React.Dispatch<React.SetStateAction<NetworkDevice[]>>;
  setWifiNetworks: React.Dispatch<React.SetStateAction<WiFiNetwork[]>>;
}

const NetworkContext = createContext<NetworkContextValue | null>(null);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [wifiNetworks, setWifiNetworks] = useState<WiFiNetwork[]>([]);
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [pingHistory, setPingHistory] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    loadInitial();
    return () => { isMounted.current = false; };
  }, []);

  async function loadInitial() {
    await refresh();
  }

  const refresh = useCallback(async () => {
    if (!isMounted.current) return;
    setIsLoading(true);
    try {
      const info = await getNetworkInfo();
      if (!isMounted.current) return;
      setNetworkInfo(info);

      const pings = await measureMultiplePings(5);
      if (!isMounted.current) return;
      setPingHistory(prev => [...prev.slice(-9), ...pings.slice(-1)]);

      const avgPing = pings.length > 0 ? Math.round(pings.reduce((a, b) => a + b) / pings.length) : 0;
      const jitter = calcJitter(pings);

      const audit = runSecurityAudit(wifiNetworks, devices, info.ssid);
      const score = calcHealthScore({
        rssi: info.rssi,
        latencyMs: avgPing,
        securityScore: audit.score,
        deviceCount: devices.length,
        jitter,
      });
      if (!isMounted.current) return;
      setHealthScore(score);
      setLastUpdated(new Date());
    } catch {}
    if (isMounted.current) setIsLoading(false);
  }, [devices, wifiNetworks]);

  return (
    <NetworkContext.Provider value={{
      networkInfo, devices, wifiNetworks, healthScore, pingHistory,
      isLoading, lastUpdated, refresh, setDevices, setWifiNetworks,
    }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error('useNetwork must be used within NetworkProvider');
  return ctx;
}
