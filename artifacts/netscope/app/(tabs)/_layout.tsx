import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useHaptics } from '@/hooks/useHaptics';
import { radius } from '@/constants/theme';
import {
  HouseIcon, RadarIcon, WrenchIcon, ShieldIcon, GearIcon,
} from '@/components/icons/Icons';

const { width: W } = Dimensions.get('window');

const ALL_TABS = [
  { name: 'dashboard', label: 'Home',     Icon: HouseIcon  },
  { name: 'scanner',   label: 'Scan',     Icon: RadarIcon  },
  { name: 'tools',     label: 'Tools',    Icon: WrenchIcon },
  { name: 'security',  label: 'Security', Icon: ShieldIcon },
  { name: 'settings',  label: 'Settings', Icon: GearIcon   },
];

type NavStyle = 'floating' | 'bar' | 'compact' | 'minimal' | 'bubble' | 'underline';

// ─── Telegram-style tab item (default "floating") ────────────────────────────
// Matches Telegram Android nav: top indicator pill + colored icon + colored label
function TabItemTelegram({
  tab, isFocused, onPress, theme,
}: { tab: typeof ALL_TABS[0]; isFocused: boolean; onPress: () => void; theme: any }) {
  const { Icon } = tab;
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isFocused ? 1.08 : 1, { stiffness: 300, damping: 20 }) }],
  }));

  const handlePress = () => {
    scale.value = withTiming(0.9, { duration: 80 }, () => {
      scale.value = withSpring(1, { stiffness: 400, damping: 18 });
    });
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.tgTab} activeOpacity={1}>
      {/* Top indicator bar — Telegram signature */}
      {isFocused ? (
        <LinearGradient
          colors={[theme.primary, theme.accent] as [string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.tgIndicator}
        />
      ) : (
        <View style={styles.tgIndicatorGhost} />
      )}

      <Animated.View style={[animStyle, styles.tgIconWrap]}>
        <Icon size={23} color={isFocused ? theme.primary : theme.textMuted} />
      </Animated.View>

      <Text style={[
        styles.tgLabel,
        { color: isFocused ? theme.primary : theme.textMuted },
        isFocused && styles.tgLabelActive,
      ]}>
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Full-label floating pill (kept as "bar" option) ─────────────────────────
function TabItemFull({
  tab, isFocused, onPress, theme,
}: { tab: typeof ALL_TABS[0]; isFocused: boolean; onPress: () => void; theme: any }) {
  const { Icon } = tab;
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isFocused ? 1.08 : 1, { stiffness: 280, damping: 18 }) }],
  }));
  return (
    <TouchableOpacity onPress={onPress} style={styles.tabItem} activeOpacity={1}>
      <Animated.View style={animStyle}>
        {isFocused ? (
          <LinearGradient
            colors={[theme.primary, theme.accent] as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.activeIconBg}
          >
            <Icon size={20} color="#FFFFFF" />
          </LinearGradient>
        ) : (
          <View style={styles.inactiveIconBg}>
            <Icon size={20} color={theme.textMuted} />
          </View>
        )}
      </Animated.View>
      <Text style={[styles.label, { color: isFocused ? theme.primary : theme.textMuted }, isFocused && styles.labelActive]}>
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
}

function TabItemCompact({
  tab, isFocused, onPress, theme,
}: { tab: typeof ALL_TABS[0]; isFocused: boolean; onPress: () => void; theme: any }) {
  const { Icon } = tab;
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isFocused ? 1.12 : 1, { stiffness: 300, damping: 18 }) }],
  }));
  return (
    <TouchableOpacity onPress={onPress} style={styles.tabItemCompact} activeOpacity={1}>
      <Animated.View style={animStyle}>
        {isFocused ? (
          <LinearGradient colors={[theme.primary, theme.accent] as [string, string]} style={styles.activeIconBgSm}>
            <Icon size={17} color="#FFFFFF" />
          </LinearGradient>
        ) : (
          <View style={styles.inactiveIconBgSm}>
            <Icon size={17} color={theme.textMuted} />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

function TabItemMinimal({
  tab, isFocused, onPress, theme,
}: { tab: typeof ALL_TABS[0]; isFocused: boolean; onPress: () => void; theme: any }) {
  const { Icon } = tab;
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isFocused ? 1.1 : 1, { stiffness: 300, damping: 20 }) }],
  }));
  return (
    <TouchableOpacity onPress={onPress} style={styles.tabItemMinimal} activeOpacity={1}>
      <Animated.View style={animStyle}>
        <Icon size={22} color={isFocused ? theme.primary : theme.textMuted} />
        {isFocused && (
          <View style={[styles.minimalDot, { backgroundColor: theme.primary }]} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

function TabItemBar({
  tab, isFocused, onPress, theme,
}: { tab: typeof ALL_TABS[0]; isFocused: boolean; onPress: () => void; theme: any }) {
  const { Icon } = tab;
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isFocused ? 1.06 : 1, { stiffness: 280, damping: 18 }) }],
  }));
  return (
    <TouchableOpacity onPress={onPress} style={styles.tabItemBar} activeOpacity={1}>
      <Animated.View style={[styles.barInner, isFocused && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}>
        <Icon size={20} color={isFocused ? theme.primary : theme.textMuted} />
        <Text style={[styles.labelBar, { color: isFocused ? theme.primary : theme.textMuted }, isFocused && { fontWeight: '700' }]}>
          {tab.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function TabItemBubble({
  tab, isFocused, onPress, theme,
}: { tab: typeof ALL_TABS[0]; isFocused: boolean; onPress: () => void; theme: any }) {
  const { Icon } = tab;
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isFocused ? 1.05 : 1, { stiffness: 300, damping: 20 }) }],
  }));
  return (
    <TouchableOpacity onPress={onPress} style={styles.tabItemBubble} activeOpacity={1}>
      <Animated.View style={[animStyle, styles.bubbleInner, isFocused && { backgroundColor: `${theme.primary}22` }]}>
        <Icon size={19} color={isFocused ? theme.primary : theme.textMuted} />
        <Text style={[styles.bubbleLabel, { color: isFocused ? theme.primary : theme.textMuted, fontWeight: isFocused ? '700' : '500' }]}>
          {tab.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function TabItemUnderline({
  tab, isFocused, onPress, theme,
}: { tab: typeof ALL_TABS[0]; isFocused: boolean; onPress: () => void; theme: any }) {
  const { Icon } = tab;
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isFocused ? 1.04 : 1, { stiffness: 280, damping: 18 }) }],
  }));
  return (
    <TouchableOpacity onPress={onPress} style={styles.tabItemUnderline} activeOpacity={1}>
      <Animated.View style={[animStyle, styles.underlineInner]}>
        <Icon size={20} color={isFocused ? theme.primary : theme.textMuted} />
        <Text style={[styles.underlineLabel, { color: isFocused ? theme.primary : theme.textMuted, fontWeight: isFocused ? '700' : '500' }]}>
          {tab.label}
        </Text>
        {isFocused && (
          <LinearGradient
            colors={[theme.primary, theme.accent] as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.underlineLine}
          />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

function FloatingTabBar({ state, navigation }: any) {
  const { theme, isDark } = useTheme();
  const { settings } = useSettings();
  const { light } = useHaptics();
  const insets = useSafeAreaInsets();

  const hiddenTabs = settings?.hiddenTabs ?? [];
  const navStyle: NavStyle = (settings?.navStyle as NavStyle) ?? 'floating';
  const visibleTabs = ALL_TABS.filter(t => t.name === 'settings' || !hiddenTabs.includes(t.name));

  const safeBottom = Math.max(insets.bottom, 16);

  const makePress = (routeIndex: number) => () => {
    light();
    const event = navigation.emit({
      type: 'tabPress',
      target: state.routes[routeIndex].key,
      canPreventDefault: true,
    });
    if (state.index !== routeIndex && !event.defaultPrevented) {
      navigation.navigate(state.routes[routeIndex].name);
    }
  };

  const tabItems = visibleTabs.map(tab => {
    const routeIndex = state.routes.findIndex((r: any) => r.name === tab.name);
    if (routeIndex < 0) return null;
    const isFocused = state.index === routeIndex;
    return { tab, isFocused, onPress: makePress(routeIndex) };
  }).filter(Boolean) as { tab: typeof ALL_TABS[0]; isFocused: boolean; onPress: () => void }[];

  // ── Telegram-style (default "floating") ─────────────────────────────────────
  if (navStyle === 'floating') {
    const bgColor = isDark ? 'rgba(10,12,28,0.97)' : 'rgba(248,249,255,0.97)';
    const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
    return (
      <BlurView
        intensity={80}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.tgBar,
          {
            paddingBottom: safeBottom,
            backgroundColor: bgColor,
            borderTopColor: borderColor,
          },
        ]}
      >
        {tabItems.map(({ tab, isFocused, onPress }) => (
          <TabItemTelegram key={tab.name} tab={tab} isFocused={isFocused} onPress={onPress} theme={theme} />
        ))}
      </BlurView>
    );
  }

  // ── Full-label floating pill ("bar") ─────────────────────────────────────────
  if (navStyle === 'bar') {
    const TAB_BAR_WIDTH = Math.min(W * (visibleTabs.length < 4 ? 0.80 : 0.94), 430);
    return (
      <View style={[styles.outerWrapper, { bottom: safeBottom + 10, width: TAB_BAR_WIDTH }]}>
        <BlurView
          intensity={85}
          tint={isDark ? 'dark' : 'light'}
          style={[styles.tabBar, {
            borderColor: theme.glassBorder,
            backgroundColor: isDark ? 'rgba(5,8,22,0.78)' : 'rgba(240,244,255,0.85)',
          }]}
        >
          {tabItems.map(({ tab, isFocused, onPress }) => (
            <TabItemFull key={tab.name} tab={tab} isFocused={isFocused} onPress={onPress} theme={theme} />
          ))}
        </BlurView>
      </View>
    );
  }

  if (navStyle === 'compact') {
    const W_PILL = Math.min(visibleTabs.length * 52 + 24, 340);
    return (
      <View style={[styles.outerWrapper, { bottom: safeBottom + 8, width: W_PILL }]}>
        <BlurView
          intensity={85}
          tint={isDark ? 'dark' : 'light'}
          style={[styles.tabBarCompact, {
            borderColor: theme.glassBorder,
            backgroundColor: isDark ? 'rgba(5,8,22,0.82)' : 'rgba(240,244,255,0.88)',
          }]}
        >
          {tabItems.map(({ tab, isFocused, onPress }) => (
            <TabItemCompact key={tab.name} tab={tab} isFocused={isFocused} onPress={onPress} theme={theme} />
          ))}
        </BlurView>
      </View>
    );
  }

  if (navStyle === 'minimal') {
    return (
      <View style={[styles.minimalWrapper, {
        paddingBottom: safeBottom,
        backgroundColor: isDark ? 'rgba(5,8,22,0.60)' : 'rgba(240,244,255,0.60)',
        borderTopColor: theme.glassBorder,
      }]}>
        {tabItems.map(({ tab, isFocused, onPress }) => (
          <TabItemMinimal key={tab.name} tab={tab} isFocused={isFocused} onPress={onPress} theme={theme} />
        ))}
      </View>
    );
  }

  if (navStyle === 'bubble') {
    return (
      <BlurView
        intensity={95}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.barWrapper,
          {
            borderTopColor: theme.glassBorder,
            backgroundColor: isDark ? 'rgba(5,8,22,0.95)' : 'rgba(245,248,255,0.95)',
            paddingBottom: safeBottom,
          },
        ]}
      >
        {tabItems.map(({ tab, isFocused, onPress }) => (
          <TabItemBubble key={tab.name} tab={tab} isFocused={isFocused} onPress={onPress} theme={theme} />
        ))}
      </BlurView>
    );
  }

  if (navStyle === 'underline') {
    return (
      <BlurView
        intensity={95}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.barWrapper,
          {
            borderTopColor: theme.glassBorder,
            backgroundColor: isDark ? 'rgba(5,8,22,0.95)' : 'rgba(245,248,255,0.95)',
            paddingBottom: safeBottom,
          },
        ]}
      >
        {tabItems.map(({ tab, isFocused, onPress }) => (
          <TabItemUnderline key={tab.name} tab={tab} isFocused={isFocused} onPress={onPress} theme={theme} />
        ))}
      </BlurView>
    );
  }

  return null;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={props => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="scanner" />
      <Tabs.Screen name="tools" />
      <Tabs.Screen name="security" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // ── Telegram-style full-width bar ──────────────────────────────────────────
  tgBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    zIndex: 100,
    ...Platform.select({ android: { elevation: 20 } }),
  },
  tgTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 0,
    paddingBottom: 6,
    position: 'relative',
    gap: 3,
  },
  tgIndicator: {
    position: 'absolute',
    top: 0,
    height: 3,
    width: 36,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  tgIndicatorGhost: {
    position: 'absolute',
    top: 0,
    height: 3,
    width: 36,
  },
  tgIconWrap: {
    width: 40,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  tgLabel: {
    fontSize: 9.5,
    letterSpacing: 0.1,
    marginBottom: 2,
  },
  tgLabelActive: {
    fontWeight: '700',
  },

  // ── Floating pill (bar style) ──────────────────────────────────────────────
  outerWrapper: {
    position: 'absolute', alignSelf: 'center', zIndex: 100,
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 }, elevation: 24,
  },
  tabBar: {
    height: 68, borderRadius: radius.full,
    flexDirection: 'row', borderWidth: 1, overflow: 'hidden',
    ...Platform.select({ android: { elevation: 24 } }),
  },
  tabBarCompact: {
    height: 58, borderRadius: radius.full,
    flexDirection: 'row', borderWidth: 1, overflow: 'hidden',
    ...Platform.select({ android: { elevation: 24 } }),
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabItemCompact: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  tabItemBar: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 10, paddingBottom: 2 },
  barInner: { alignItems: 'center', gap: 3, paddingBottom: 4 },
  labelBar: { fontSize: 9, fontWeight: '600', letterSpacing: 0.2 },
  tabItemMinimal: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 3 },
  minimalDot: { width: 4, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 2 },
  tabItemBubble: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  bubbleInner: { alignItems: 'center', gap: 3, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 14 },
  bubbleLabel: { fontSize: 9, letterSpacing: 0.2 },
  tabItemUnderline: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  underlineInner: { alignItems: 'center', gap: 3, paddingBottom: 4, position: 'relative' },
  underlineLabel: { fontSize: 9, letterSpacing: 0.2 },
  underlineLine: { position: 'absolute', bottom: -6, left: -8, right: -8, height: 2.5, borderRadius: 2 },
  barWrapper: {
    flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth,
    ...Platform.select({ android: { elevation: 24 } }),
  },
  minimalWrapper: {
    position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    zIndex: 100,
  },
  activeIconBg: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  inactiveIconBg: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  activeIconBgSm: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  inactiveIconBgSm: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 9, fontWeight: '600', letterSpacing: 0.2 },
  labelActive: { fontWeight: '700' },
});
