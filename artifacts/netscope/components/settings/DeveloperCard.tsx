import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { typography, spacing, radius } from '@/constants/theme';
import { openGitHub, openWebsite, openInstagram, openTelegram } from '@/services/githubService';
import { GlobeIcon, TerminalIcon, GitHubIcon, TelegramIcon, InstagramIcon } from '@/components/icons/Icons';

function TerminalAvatar() {
  const { theme } = useTheme();
  return (
    <View style={[styles.avatar, { backgroundColor: '#0D1117', borderColor: `${theme.primary}30` }]}>
      <TerminalIcon size={26} color={theme.primary} />
    </View>
  );
}

const SOCIALS = [
  {
    id: 'github',
    label: 'GitHub',
    value: 'mkr-infinity',
    color: '#E6EDF3',
    bg: '#161B22',
    Icon: GitHubIcon,
    onPress: openGitHub,
  },
  {
    id: 'website',
    label: 'Website',
    value: 'mkr-infinity.github.io',
    color: '#00D4FF',
    bg: '#001A22',
    Icon: GlobeIcon,
    onPress: openWebsite,
  },
  {
    id: 'telegram',
    label: 'Telegram',
    value: '@mkr_infinity',
    color: '#29B6F6',
    bg: '#001A2E',
    Icon: TelegramIcon,
    onPress: openTelegram,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    value: '@mkr_infinity',
    color: '#E1306C',
    bg: '#1A0010',
    Icon: InstagramIcon,
    onPress: openInstagram,
  },
];

function SocialCard({ item }: { item: typeof SOCIALS[0] }) {
  const { theme } = useTheme();
  const { Icon, color, bg, label, value, onPress } = item;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ flex: 1 }}>
      <View style={[styles.socialCard, { backgroundColor: bg, borderColor: `${color}20` }]}>
        <View style={[styles.socialIconWrap, { backgroundColor: `${color}18`, borderColor: `${color}30` }]}>
          <Icon size={14} color={color} />
        </View>
        <Text style={[styles.socialLabel, { color }]}>{label}</Text>
        <Text style={[styles.socialValue, { color: theme.textSecondary }]} numberOfLines={1}>{value}</Text>
        <View style={[styles.socialArrow, { backgroundColor: `${color}15` }]}>
          <Text style={{ color, fontSize: 9, fontWeight: '800' }}>↗</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function DeveloperCard() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
      <LinearGradient
        colors={[`${theme.primary}08`, `${theme.secondary}06`, 'transparent'] as [string, string, string]}
        style={[StyleSheet.absoluteFill, { borderRadius: radius.xl }]}
      />

      {/* Profile Header */}
      <View style={[styles.profileHeader, { borderBottomColor: `${theme.primary}12` }]}>
        <TerminalAvatar />
        <View style={{ flex: 1 }}>
          <Text style={[styles.devName, { color: theme.textPrimary }]}>Mohammad Kaif Raja</Text>
          <View style={styles.tagsRow}>
            {['React Native', 'Expo', 'TypeScript'].map(t => (
              <View key={t} style={[styles.tag, { backgroundColor: `${theme.primary}10`, borderColor: `${theme.primary}18` }]}>
                <Text style={[styles.tagText, { color: theme.textMuted }]}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Social Cards 2x2 */}
      <View style={styles.socialGrid}>
        <View style={styles.socialRow}>
          <SocialCard item={SOCIALS[0]} />
          <SocialCard item={SOCIALS[1]} />
        </View>
        <View style={styles.socialRow}>
          <SocialCard item={SOCIALS[2]} />
          <SocialCard item={SOCIALS[3]} />
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: `${theme.primary}10` }]}>
        <Text style={[styles.footerText, { color: theme.textMuted }]}>com.mkrinfinity.netscope · v1.0.0</Text>
        <View style={[styles.footerBadge, { backgroundColor: `${theme.success}12`, borderColor: `${theme.success}25` }]}>
          <Text style={[styles.footerBadgeText, { color: theme.success }]}>OPEN SOURCE</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: radius.xl, borderWidth: 1, overflow: 'hidden' },
  profileHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, borderBottomWidth: 1,
  },
  avatar: {
    width: 62, height: 62, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, elevation: 4,
  },
  devName: { fontSize: typography.base, fontWeight: typography.bold },
  tagsRow: { flexDirection: 'row', gap: 5, marginTop: 6, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, borderWidth: 1 },
  tagText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  socialGrid: { padding: spacing.md, gap: spacing.sm },
  socialRow: { flexDirection: 'row', gap: spacing.sm },
  socialCard: {
    flex: 1, borderRadius: radius.lg, borderWidth: 1,
    padding: spacing.sm, gap: 4, overflow: 'hidden',
  },
  socialIconWrap: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  socialLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  socialValue: { fontSize: 10, lineHeight: 13 },
  socialArrow: {
    position: 'absolute', top: 7, right: 7,
    width: 18, height: 18, borderRadius: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: 10, borderTopWidth: 1,
  },
  footerText: { fontSize: 10 },
  footerBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, borderWidth: 1 },
  footerBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
});
