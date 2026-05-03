import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, Dimensions, Platform, BackHandler, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useTheme } from '@/contexts/ThemeContext';
import { useActivity } from '@/contexts/ActivityContext';
import { ActivityEntry, ActivityType } from '@/types';
import { typography, spacing, radius } from '@/constants/theme';
import {
  ZapIcon, ActivityIcon, ServerIcon, GlobeIcon, TrendingDownIcon,
  MapIcon, SearchIcon, ClockIcon, RadarIcon, ShieldIcon, XIcon,
  CheckCircleIcon, TrashIcon,
} from '@/components/icons/Icons';

const { height: SCREEN_H } = Dimensions.get('window');
const DRAWER_H = SCREEN_H * 0.78;

function getTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 10) return 'Just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function getExactTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function getExactDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

type IconConfig = { Icon: React.ComponentType<any>; color: string };

const TYPE_MAP: Record<ActivityType, IconConfig> = {
  speed_test:     { Icon: ZapIcon,          color: '#FFBE5C' },
  ping:           { Icon: ActivityIcon,     color: '#4F87FF' },
  port_scan:      { Icon: ServerIcon,       color: '#FF5C5C' },
  dns:            { Icon: GlobeIcon,        color: '#00D4FF' },
  packet_loss:    { Icon: TrendingDownIcon, color: '#FF8C5C' },
  ip_info:        { Icon: MapIcon,          color: '#00E5A0' },
  whois:          { Icon: SearchIcon,       color: '#A855F7' },
  latency:        { Icon: ClockIcon,        color: '#00D4FF' },
  network_scan:   { Icon: RadarIcon,        color: '#4F87FF' },
  security_audit: { Icon: ShieldIcon,       color: '#00E5A0' },
};

function ActivityRow({
  entry,
  onPress,
  onDelete,
}: {
  entry: ActivityEntry;
  onPress: () => void;
  onDelete: () => void;
}) {
  const { theme } = useTheme();
  const { Icon, color } = TYPE_MAP[entry.type] ?? { Icon: ActivityIcon, color: '#4F87FF' };

  return (
    <View style={[styles.entryRow, { borderBottomColor: theme.border }]}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        style={styles.entryMain}
      >
        <View style={[styles.entryIconWrap, { backgroundColor: `${color}18` }]}>
          <Icon size={18} color={color} />
          {!entry.read && <View style={[styles.unreadDot, { backgroundColor: color }]} />}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.entryTitle, { color: entry.read ? theme.textSecondary : theme.textPrimary }]}>
            {entry.title}
          </Text>
          <Text style={[styles.entryDetail, { color: theme.textMuted }]} numberOfLines={1}>
            {entry.detail}
          </Text>
          <View style={styles.entryMeta}>
            <Text style={[styles.entryTime, { color, opacity: 0.85 }]}>
              {getTimeAgo(entry.timestamp)}
            </Text>
            <Text style={[styles.entryExact, { color: theme.textMuted }]}>
              {getExactDate(entry.timestamp)}  {getExactTime(entry.timestamp)}
            </Text>
          </View>
        </View>
        <View style={[styles.entryArrow, { backgroundColor: `${color}12` }]}>
          <Text style={{ color, fontSize: 13, fontWeight: '700' }}>›</Text>
        </View>
      </TouchableOpacity>

      {/* Per-entry delete button */}
      <TouchableOpacity
        onPress={onDelete}
        activeOpacity={0.7}
        style={[styles.deleteBtn, { backgroundColor: `${theme.error}12`, borderColor: `${theme.error}25` }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <XIcon size={12} color={theme.error} />
      </TouchableOpacity>
    </View>
  );
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationDrawer({ visible, onClose }: Props) {
  const { theme, isDark } = useTheme();
  const { entries, unreadCount, markAllRead, clearAll, deleteEntry } = useActivity();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(DRAWER_H)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;

  // Internal showing state so we can animate OUT before hiding the Modal
  const [showing, setShowing] = useState(false);

  const animateOut = useCallback((cb?: () => void) => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: DRAWER_H, useNativeDriver: true, stiffness: 300, damping: 35 }),
      Animated.timing(bgAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start(() => {
      setShowing(false);
      cb?.();
    });
  }, [slideAnim, bgAnim]);

  const handleClose = useCallback(() => {
    animateOut(onClose);
  }, [animateOut, onClose]);

  useEffect(() => {
    if (visible) {
      setShowing(true);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, stiffness: 280, damping: 30, mass: 0.9 }),
        Animated.timing(bgAnim, { toValue: 1, duration: 220, useNativeDriver: false }),
      ]).start();
    } else if (showing) {
      animateOut();
    }
  }, [visible]);

  // Hardware back button on Android
  useEffect(() => {
    if (!showing) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => sub.remove();
  }, [showing, handleClose]);

  const handleOpen = (entry: ActivityEntry) => {
    markAllRead();
    handleClose();
    setTimeout(() => {
      if (entry.route.startsWith('/(tabs)')) {
        router.navigate(entry.route as any);
      } else {
        router.push(entry.route as any);
      }
    }, 320);
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Activity',
      'This will permanently delete all activity history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => clearAll(),
        },
      ],
    );
  };

  const handleDeleteEntry = (id: string) => {
    deleteEntry(id);
  };

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)'],
  });

  return (
    <Modal
      visible={showing}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { backgroundColor: bgColor as any }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} activeOpacity={1} />
        <Animated.View
          style={[
            styles.drawer,
            {
              backgroundColor: isDark ? theme.bgSurface : theme.bg,
              borderColor: theme.glassBorder,
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateY: slideAnim }],
              height: DRAWER_H,
            },
          ]}
        >
          <LinearGradient
            colors={[`${theme.primary}10`, 'transparent'] as [string, string]}
            style={styles.drawerGlow}
          />

          {/* Handle */}
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: theme.border }]} />
          </View>

          {/* Header */}
          <View style={styles.drawerHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.drawerTitle, { color: theme.textPrimary }]}>Activity</Text>
              <Text style={[styles.drawerSub, { color: theme.textMuted }]}>
                {entries.length === 0
                  ? 'No activity yet'
                  : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}${unreadCount > 0 ? ` · ${unreadCount} unread` : ''}`}
              </Text>
            </View>
            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity
                  onPress={markAllRead}
                  style={[styles.actionBtn, { backgroundColor: `${theme.primary}12`, borderColor: `${theme.primary}25` }]}
                >
                  <CheckCircleIcon size={13} color={theme.primary} />
                  <Text style={[styles.actionBtnText, { color: theme.primary }]}>Read all</Text>
                </TouchableOpacity>
              )}
              {entries.length > 0 && (
                <TouchableOpacity
                  onPress={handleClearAll}
                  style={[styles.actionBtn, { backgroundColor: `${theme.error}10`, borderColor: `${theme.error}20` }]}
                >
                  <TrashIcon size={13} color={theme.error} />
                  <Text style={[styles.actionBtnText, { color: theme.error }]}>Clear all</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleClose}
                style={[styles.closeBtn, { backgroundColor: theme.bgElevated, borderColor: theme.border }]}
              >
                <XIcon size={15} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          {entries.length === 0 ? (
            <View style={styles.emptyWrap}>
              <LinearGradient
                colors={[`${theme.primary}18`, `${theme.accent}08`] as [string, string]}
                style={styles.emptyIconWrap}
              >
                <ActivityIcon size={32} color={theme.textMuted} />
              </LinearGradient>
              <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>No activity yet</Text>
              <Text style={[styles.emptySub, { color: theme.textMuted }]}>
                Run a speed test, ping, or scan to see your history here
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            >
              {entries.map(entry => (
                <ActivityRow
                  key={entry.id}
                  entry={entry}
                  onPress={() => handleOpen(entry)}
                  onDelete={() => handleDeleteEntry(entry.id)}
                />
              ))}
              <View style={styles.listFooter}>
                <Text style={[styles.footerText, { color: theme.textMuted }]}>
                  Entries older than 30 days are removed automatically
                </Text>
              </View>
            </ScrollView>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'flex-end',
  },
  drawer: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
    ...Platform.select({
      android: { elevation: 32 },
      ios: { shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 30, shadowOffset: { width: 0, height: -10 } },
    }),
  },
  drawerGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 120,
  },
  handleWrap: {
    alignItems: 'center', paddingTop: 10, paddingBottom: 4,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
  },
  drawerHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md,
  },
  drawerTitle: {
    fontSize: typography.xl, fontWeight: '900', letterSpacing: -0.5,
  },
  drawerSub: {
    fontSize: typography.xs, marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: radius.full, borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 11, fontWeight: '600',
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 16,
  },
  entryRow: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  entryMain: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingLeft: spacing.lg, paddingRight: spacing.sm, paddingVertical: 13,
  },
  entryIconWrap: {
    width: 44, height: 44, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute', top: 6, right: 6,
    width: 8, height: 8, borderRadius: 4,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
  },
  entryTitle: {
    fontSize: typography.sm, fontWeight: '600',
  },
  entryDetail: {
    fontSize: typography.xs,
  },
  entryMeta: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 1,
  },
  entryTime: {
    fontSize: 10, fontWeight: '700',
  },
  entryExact: {
    fontSize: 10,
  },
  entryArrow: {
    width: 26, height: 26, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtn: {
    width: 28, height: 28, borderRadius: 8, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  emptyWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.xl,
  },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: typography.md, fontWeight: '700',
  },
  emptySub: {
    fontSize: typography.sm, textAlign: 'center', lineHeight: 20,
  },
  listFooter: {
    alignItems: 'center', paddingVertical: spacing.lg, paddingHorizontal: spacing.xl,
  },
  footerText: {
    fontSize: 10, textAlign: 'center', lineHeight: 14,
  },
});
