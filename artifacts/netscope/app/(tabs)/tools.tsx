import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useTheme } from '@/contexts/ThemeContext';
import { typography, spacing, radius } from '@/constants/theme';
import {
  ZapIcon, ClockIcon, SearchIcon, GlobeIcon, TrendingUpIcon,
  WifiIcon, ShieldIcon, ServerIcon,
} from '@/components/icons/Icons';

interface ToolCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  route: string;
}

function ToolCardItem({ card }: { card: ToolCard }) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity onPress={() => router.push(card.route as any)} activeOpacity={0.8} style={styles.cardWrap}>
      <LinearGradient
        colors={[`${card.color}18`, `${card.color}08`] as [string, string]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.card, { borderColor: `${card.color}28` }]}
      >
        <View style={[styles.iconBox, { backgroundColor: `${card.color}22` }]}>
          {card.icon}
        </View>

        <View style={styles.cardText}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            {card.title}
          </Text>
          <Text style={[styles.cardDesc, { color: theme.textMuted }]} numberOfLines={2}>
            {card.description}
          </Text>
        </View>

        <View style={[styles.cardArrow, { backgroundColor: `${card.color}20` }]}>
          <Text style={{ color: card.color, fontSize: 14 }}>→</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const TOOLS: ToolCard[] = [
  {
    id: 'speed', title: 'Speed Test', description: 'Measure download, upload & ping',
    icon: <ZapIcon size={24} color="#A855F7" />, color: '#A855F7', route: '/tool/speed-test',
  },
  {
    id: 'ping', title: 'Ping', description: 'Test latency to any host',
    icon: <ClockIcon size={24} color="#4F87FF" />, color: '#4F87FF', route: '/tool/ping',
  },
  {
    id: 'port', title: 'Port Scanner', description: 'Scan open ports on any IP',
    icon: <SearchIcon size={24} color="#00D4FF" />, color: '#00D4FF', route: '/tool/port-scan',
  },
  {
    id: 'dns', title: 'DNS Lookup', description: 'Resolve domain records',
    icon: <GlobeIcon size={24} color="#00E5A0" />, color: '#00E5A0', route: '/tool/dns',
  },
  {
    id: 'packet', title: 'Packet Loss', description: 'Detect dropped packets',
    icon: <TrendingUpIcon size={24} color="#FFBE5C" />, color: '#FFBE5C', route: '/tool/packet-loss',
  },
  {
    id: 'ipinfo', title: 'IP Info', description: 'Public IP, ISP & location',
    icon: <WifiIcon size={24} color="#FF5C8A" />, color: '#FF5C8A', route: '/tool/ip-info',
  },
  {
    id: 'whois', title: 'WHOIS', description: 'Domain & IP registration info',
    icon: <ServerIcon size={24} color="#4F87FF" />, color: '#4F87FF', route: '/tool/whois',
  },
  {
    id: 'latency', title: 'Latency Board', description: 'Ping leaderboard for top servers',
    icon: <TrendingUpIcon size={24} color="#00D4FF" />, color: '#00D4FF', route: '/tool/latency',
  },
  {
    id: 'traceroute', title: 'Traceroute', description: 'Trace every hop to destination',
    icon: <GlobeIcon size={24} color="#A855F7" />, color: '#A855F7', route: '/tool/traceroute',
  },
  {
    id: 'ssl', title: 'SSL Checker', description: 'Inspect TLS certificates',
    icon: <ShieldIcon size={24} color="#00E5A0" />, color: '#00E5A0', route: '/tool/ssl',
  },
  {
    id: 'headers', title: 'HTTP Headers', description: 'Inspect server response headers',
    icon: <ServerIcon size={24} color="#FFBE5C" />, color: '#FFBE5C', route: '/tool/headers',
  },
  {
    id: 'wol', title: 'Wake-on-LAN', description: 'Wake devices remotely',
    icon: <ZapIcon size={24} color="#FF5C8A" />, color: '#FF5C8A', route: '/tool/wol',
  },
];

export default function Tools() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const paddingTop = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <LinearGradient colors={theme.gradientBg as [string, string, string]} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: paddingTop + spacing.md }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Tools</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>Network diagnostic toolkit</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {TOOLS.map(card => (
            <ToolCardItem key={card.id} card={card} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  title: { fontSize: typography.xl, fontWeight: typography.black, letterSpacing: -0.5 },
  subtitle: { fontSize: typography.sm, marginTop: 2 },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cardWrap: { width: '48.5%' },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
    minHeight: 150,
  },
  iconBox: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  cardText: { flex: 1, gap: 3 },
  cardTitle: { fontSize: typography.sm, fontWeight: typography.bold },
  cardDesc: { fontSize: 11, lineHeight: 15 },
  cardArrow: {
    alignSelf: 'flex-end',
    width: 28, height: 28, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
});
