import React, { useState, useCallback, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useTheme } from '@/contexts/ThemeContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useActivity } from '@/contexts/ActivityContext';
import { typography, spacing, radius } from '@/constants/theme';

import HealthScoreCard from '@/components/dashboard/HealthScoreCard';
import NetworkInfoCard from '@/components/dashboard/NetworkInfoCard';
import StabilityCard from '@/components/dashboard/StabilityCard';
import DeviceCountCard from '@/components/dashboard/DeviceCountCard';
import QuickActions from '@/components/dashboard/QuickActions';
import PulsingDot from '@/components/ui/PulsingDot';
import NotificationDrawer from '@/components/ui/NotificationDrawer';
import {
  BellIcon, WifiIcon, WifiOffIcon, RefreshIcon, CellularIcon,
} from '@/components/icons/Icons';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getTimeAgo(date: Date | null): string {
  if (!date) return 'Syncing...';
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 10) return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  return `${Math.floor(diff / 60)}m ago`;
}

function getConnectionLabel(type: string): string {
  switch (type.toUpperCase()) {
    case 'WIFI': return 'WiFi';
    case 'CELLULAR': return 'Mobile Data';
    case 'ETHERNET': return 'Ethernet';
    case 'VPN': return 'VPN';
    case 'BLUETOOTH': return 'Bluetooth';
    default: return 'Network';
  }
}

export default function Dashboard() {
  const { theme } = useTheme();
  const { networkInfo, isLoading, lastUpdated, refresh } = useNetwork();
  const { settings } = useSettings();
  const { unreadCount } = useActivity();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  // Refresh on mount so SSID is up-to-date after onboarding location permission grant
  useEffect(() => {
    refresh();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const paddingTop = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const isConnected = networkInfo?.isConnected ?? false;
  const trackActivity = settings.trackActivity !== false;

  const connType = (networkInfo?.connectionType || 'UNKNOWN').toUpperCase();
  const isCellular = connType === 'CELLULAR';
  const isWifi = connType === 'WIFI';

  // Primary label: SSID for wifi, carrier(ISP) for cellular, or generic
  const primaryLabel = isWifi
    ? (networkInfo?.ssid && networkInfo.ssid !== '—' ? networkInfo.ssid : 'WiFi')
    : isCellular
      ? (networkInfo?.isp && networkInfo.isp !== '—' ? networkInfo.isp : 'Mobile Data')
      : isConnected ? 'Connected' : 'No Network';

  // Sub label: IP for wifi, "Mobile Data" label for cellular
  const subLabel = isCellular
    ? `${getConnectionLabel(connType)} · ${networkInfo?.localIP && networkInfo.localIP !== '—' ? networkInfo.localIP : 'No IP'}`
    : networkInfo?.localIP && networkInfo.localIP !== '—'
      ? networkInfo.localIP
      : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <LinearGradient
        colors={theme.gradientBg as [string, string, string]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[theme.primaryGlow, 'transparent'] as [string, string]}
        style={[styles.topGlow, { opacity: 0.35 }]}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: paddingTop + spacing.sm }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.greeting, { color: theme.textMuted }]}>{getGreeting()}</Text>
          <Text style={[styles.wordmark, { color: theme.textPrimary }]}>
            Net<Text style={{ color: theme.accent }}>Scope</Text>
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={handleRefresh}
            style={[styles.iconBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}
          >
            <RefreshIcon size={18} color={theme.textSecondary} />
          </TouchableOpacity>
          {trackActivity && (
            <TouchableOpacity
              onPress={() => setShowNotifs(true)}
              style={[styles.iconBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}
            >
              <BellIcon size={18} color={unreadCount > 0 ? theme.primary : theme.textSecondary} />
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Connection status bar */}
      <View style={[styles.statusBar, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
        <PulsingDot color={isConnected ? theme.success : theme.error} size={7} />

        {/* Connection type icon */}
        <View style={[styles.connTypeIcon, {
          backgroundColor: isConnected
            ? isCellular ? `${theme.warning}15` : `${theme.primary}15`
            : `${theme.error}15`,
        }]}>
          {isCellular
            ? <CellularIcon size={13} color={isConnected ? theme.warning : theme.error} />
            : isConnected
              ? <WifiIcon size={13} color={theme.primary} />
              : <WifiOffIcon size={13} color={theme.error} />
          }
        </View>

        <View style={styles.statusCenter}>
          <Text style={[styles.ssidText, { color: theme.textPrimary }]} numberOfLines={1}>
            {primaryLabel}
          </Text>
          {subLabel && (
            <Text style={[styles.ipText, { color: theme.textMuted }]}>{subLabel}</Text>
          )}
        </View>

        <View style={styles.statusRight}>
          {/* Connection type badge */}
          {isConnected && (
            <View style={[styles.connBadge, {
              backgroundColor: isCellular ? `${theme.warning}15` : `${theme.primary}12`,
              borderColor: isCellular ? `${theme.warning}40` : `${theme.primary}30`,
            }]}>
              <Text style={[styles.connBadgeText, { color: isCellular ? theme.warning : theme.primary }]}>
                {getConnectionLabel(connType)}
              </Text>
            </View>
          )}
          {/* Online/Offline badge */}
          <View style={[styles.statusBadge, {
            backgroundColor: isConnected ? theme.successGlow : theme.errorGlow,
            borderColor: isConnected ? theme.success : theme.error,
          }]}>
            <View style={[styles.statusDot, { backgroundColor: isConnected ? theme.success : theme.error }]} />
            <Text style={[styles.statusBadgeText, { color: isConnected ? theme.success : theme.error }]}>
              {isConnected ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
        <Text style={[styles.updated, { color: theme.textMuted }]}>{getTimeAgo(lastUpdated)}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary, theme.accent]}
          />
        }
      >
        <HealthScoreCard />
        <QuickActions
          onScanNetwork={() => router.navigate('/(tabs)/scanner')}
          onSpeedTest={() => router.push('/tool/speed-test' as any)}
          onPortScan={() => router.push('/tool/port-scan' as any)}
          onPing={() => router.push('/tool/ping' as any)}
          onSecurityAudit={() => router.navigate('/(tabs)/security')}
          onDeepAnalysis={() => router.navigate('/(tabs)/security')}
        />
        <NetworkInfoCard />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <StabilityCard />
          </View>
          <View style={{ flex: 1 }}>
            <DeviceCountCard onPress={() => router.navigate('/(tabs)/scanner')} />
          </View>
        </View>
      </ScrollView>

      <NotificationDrawer visible={showNotifs} onClose={() => setShowNotifs(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topGlow: {
    position: 'absolute', top: -100, left: -80, width: 300, height: 300, borderRadius: 150,
  },
  header: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
  },
  headerLeft: { gap: 2 },
  greeting: { fontSize: typography.xs, fontWeight: typography.medium, letterSpacing: 0.5 },
  wordmark: { fontSize: typography.xl, fontWeight: typography.black, letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', gap: spacing.sm },
  iconBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  badge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 17, height: 17, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: 'rgba(5,8,22,0.9)',
  },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  statusBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: 9,
    borderRadius: radius.lg, borderWidth: 1,
  },
  connTypeIcon: {
    width: 26, height: 26, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
  },
  statusCenter: { flex: 1 },
  ssidText: { fontSize: typography.sm, fontWeight: typography.semibold },
  ipText: { fontSize: 10, marginTop: 1 },
  statusRight: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  connBadge: {
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: radius.full, borderWidth: 1,
  },
  connBadgeText: { fontSize: 9, fontWeight: '700' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 4,
    borderRadius: radius.full, borderWidth: 1,
  },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusBadgeText: { fontSize: 9, fontWeight: typography.bold },
  updated: { fontSize: typography.xs },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
});
