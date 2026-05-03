import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { typography, spacing, radius } from '@/constants/theme';
import { RadarIcon, ZapIcon, SearchIcon, ClockIcon, ShieldIcon, TerminalIcon } from '@/components/icons/Icons';

interface Action {
  id: string;
  label: string;
  icon: typeof RadarIcon;
  color?: string;
  onPress: () => void;
}

interface QuickActionsProps {
  onScanNetwork: () => void;
  onSpeedTest: () => void;
  onPortScan: () => void;
  onPing: () => void;
  onSecurityAudit: () => void;
  onDeepAnalysis: () => void;
}

export default function QuickActions({ onScanNetwork, onSpeedTest, onPortScan, onPing, onSecurityAudit, onDeepAnalysis }: QuickActionsProps) {
  const { theme } = useTheme();

  const actions: Action[] = [
    { id: 'scan',  label: 'Scan Network',  icon: RadarIcon,    onPress: onScanNetwork   },
    { id: 'speed', label: 'Speed Test',    icon: ZapIcon,      onPress: onSpeedTest     },
    { id: 'port',  label: 'Port Scan',     icon: SearchIcon,   onPress: onPortScan      },
    { id: 'ping',  label: 'Ping',          icon: ClockIcon,    onPress: onPing          },
    { id: 'sec',   label: 'Security',      icon: ShieldIcon,   onPress: onSecurityAudit },
    { id: 'deep',  label: 'Deep Analysis', icon: TerminalIcon, color: theme.accent, onPress: onDeepAnalysis },
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {actions.map(a => {
        const Icon = a.icon;
        const isAccent = !!a.color;
        return (
          <TouchableOpacity key={a.id} onPress={a.onPress} style={styles.pill}>
            {isAccent ? (
              <LinearGradient
                colors={[theme.primary, theme.accent] as [string, string]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.pillInner}
              >
                <Icon size={14} color="#FFFFFF" />
                <Text style={[styles.label, { color: '#FFFFFF' }]}>{a.label}</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.pillInner, { backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.glassBorder }]}>
                <Icon size={14} color={theme.primary} />
                <Text style={[styles.label, { color: theme.textPrimary }]}>{a.label}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, gap: spacing.sm, flexDirection: 'row' },
  pill: {},
  pillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  label: { fontSize: typography.sm, fontWeight: typography.semibold },
});
