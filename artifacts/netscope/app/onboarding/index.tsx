import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  ScrollView, Platform, ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, withSpring, Easing, FadeIn, FadeInDown,
} from 'react-native-reanimated';
import Svg, { Line, Circle as SvgCircle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { setOnboardingDone } from '@/services/storageService';
import {
  WifiIcon, RadarIcon, ShieldIcon, ZapIcon, ServerIcon, GlobeIcon,
  CheckCircleIcon, XCircleIcon,
} from '@/components/icons/Icons';

const { width: W, height: H } = Dimensions.get('window');

// ── Spider-Web Background (Page 1) ────────────────────────────────────────────
const WEB_RED = '#CC0000';
const SPOKES = Array.from({ length: 14 }, (_, i) => (i * Math.PI * 2) / 14);
const RINGS1 = [70, 150, 240, 340, 450];
const RINGS2 = [50, 110, 190, 280];

function SpiderWebBg() {
  const cx1 = W * 0.92, cy1 = -H * 0.02;
  const cx2 = W * 0.08, cy2 = H * 1.02;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        {SPOKES.map((a, i) => (
          <Line
            key={`s1-${i}`}
            x1={cx1} y1={cy1}
            x2={cx1 + Math.cos(a) * 520} y2={cy1 + Math.sin(a) * 520}
            stroke={`${WEB_RED}22`} strokeWidth={1}
          />
        ))}
        {RINGS1.map((r, i) => (
          <SvgCircle key={`r1-${i}`} cx={cx1} cy={cy1} r={r}
            fill="none" stroke={`${WEB_RED}${i === 0 ? '40' : '18'}`} strokeWidth={1} />
        ))}
        {SPOKES.map((a, i) => (
          <Line
            key={`s2-${i}`}
            x1={cx2} y1={cy2}
            x2={cx2 + Math.cos(a) * 420} y2={cy2 + Math.sin(a) * 420}
            stroke={`${WEB_RED}15`} strokeWidth={1}
          />
        ))}
        {RINGS2.map((r, i) => (
          <SvgCircle key={`r2-${i}`} cx={cx2} cy={cy2} r={r}
            fill="none" stroke={`${WEB_RED}12`} strokeWidth={1} />
        ))}
        {/* Halftone dots */}
        {Array.from({ length: 14 }, (_, xi) =>
          Array.from({ length: 26 }, (_, yi) => {
            const x = xi * 28 + 14, y = yi * 28 + 14;
            const dx = x - W / 2, dy = y - H / 2;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const r = Math.max(0.4, 2.2 - dist / 180);
            return <SvgCircle key={`d-${xi}-${yi}`} cx={x} cy={y} r={r} fill={`${WEB_RED}12`} />;
          })
        )}
      </Svg>
    </View>
  );
}

// ── Circuit Node (Pages 2 & 3) ────────────────────────────────────────────────
function CircuitNode({ x, y, size = 6, color, delay = 0 }: {
  x: number; y: number; size?: number; color: string; delay?: number;
}) {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    setTimeout(() => {
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        ), -1, false,
      );
    }, delay);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[style, {
      position: 'absolute', left: x - size / 2, top: y - size / 2,
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color,
      shadowColor: color, shadowOpacity: 0.9, shadowRadius: size, shadowOffset: { width: 0, height: 0 },
    }]} />
  );
}

function DataPacket({ from, to, color, duration = 2000, delay = 0 }: {
  from: { x: number; y: number }; to: { x: number; y: number };
  color: string; duration?: number; delay?: number;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    setTimeout(() => {
      t.value = withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false);
    }, delay);
  }, []);
  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: from.x + (to.x - from.x) * t.value - 3,
    top: from.y + (to.y - from.y) * t.value - 3,
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: color,
    opacity: Math.sin(t.value * Math.PI) * 0.9 + 0.1,
    shadowColor: color, shadowOpacity: 1, shadowRadius: 4, shadowOffset: { width: 0, height: 0 },
  }));
  return <Animated.View style={style} />;
}

const CIRCUIT_NODES = [
  { x: W * 0.1, y: H * 0.12 }, { x: W * 0.5, y: H * 0.08 }, { x: W * 0.85, y: H * 0.15 },
  { x: W * 0.25, y: H * 0.30 }, { x: W * 0.75, y: H * 0.28 }, { x: W * 0.5, y: H * 0.42 },
  { x: W * 0.15, y: H * 0.55 }, { x: W * 0.85, y: H * 0.50 }, { x: W * 0.35, y: H * 0.68 },
  { x: W * 0.65, y: H * 0.70 }, { x: W * 0.5, y: H * 0.85 },
];
const CIRCUIT_LINES = [
  [0, 1], [1, 2], [0, 3], [2, 4], [1, 5], [3, 5], [4, 5],
  [3, 6], [4, 7], [5, 8], [5, 9], [6, 8], [7, 9], [8, 10], [9, 10],
];

function CircuitBoard({ theme }: { theme: any }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        {CIRCUIT_LINES.map(([a, b], i) => {
          const A = CIRCUIT_NODES[a], B = CIRCUIT_NODES[b];
          return <Line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={`${theme.primary}18`} strokeWidth={1} />;
        })}
      </Svg>
      {CIRCUIT_NODES.map((n, i) => (
        <CircuitNode key={i} x={n.x} y={n.y} color={`${theme.primary}70`} delay={i * 200} size={i % 3 === 0 ? 8 : 5} />
      ))}
      {CIRCUIT_LINES.slice(0, 6).map(([a, b], i) => (
        <DataPacket key={i} from={CIRCUIT_NODES[a]} to={CIRCUIT_NODES[b]}
          color={i % 2 === 0 ? theme.primary : theme.accent}
          duration={2000 + i * 400} delay={i * 600}
        />
      ))}
    </View>
  );
}

// ── Spider-Verse Radar (Page 1) ───────────────────────────────────────────────
function SpiderScopeAnim() {
  const rotate = useSharedValue(0);
  const pulse1 = useSharedValue(0);
  const pulse2 = useSharedValue(0);
  const webSpin = useSharedValue(0);

  useEffect(() => {
    rotate.value = withRepeat(withTiming(360, { duration: 2800, easing: Easing.linear }), -1, false);
    pulse1.value = withRepeat(withSequence(withTiming(1, { duration: 1600 }), withTiming(0, { duration: 600 })), -1, false);
    setTimeout(() => {
      pulse2.value = withRepeat(withSequence(withTiming(1, { duration: 1600 }), withTiming(0, { duration: 600 })), -1, false);
    }, 800);
    webSpin.value = withRepeat(withTiming(360, { duration: 18000, easing: Easing.linear }), -1, false);
  }, []);

  const rotStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value}deg` }] }));
  const pulse1Style = useAnimatedStyle(() => ({ opacity: pulse1.value * 0.45, transform: [{ scale: 1 + pulse1.value * 0.6 }] }));
  const pulse2Style = useAnimatedStyle(() => ({ opacity: pulse2.value * 0.28, transform: [{ scale: 1 + pulse2.value * 0.9 }] }));
  const webStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${webSpin.value}deg` }] }));

  return (
    <View style={styles.scopeWrap}>
      {/* Pulsing outer rings in crimson */}
      <Animated.View style={[styles.pulseRing, pulse2Style, { width: 240, height: 240, borderRadius: 120, borderColor: '#CC000035' }]} />
      <Animated.View style={[styles.pulseRing, pulse1Style, { width: 180, height: 180, borderRadius: 90, borderColor: '#E6242950' }]} />

      {/* Static rings */}
      <View style={[styles.staticRing, { width: 140, height: 140, borderRadius: 70, borderColor: '#CC000030' }]} />
      <View style={[styles.staticRing, { width: 96, height: 96, borderRadius: 48, borderColor: '#CC000045' }]} />

      {/* Slow-rotating web pattern */}
      <Animated.View style={[StyleSheet.absoluteFill, webStyle, { alignItems: 'center', justifyContent: 'center' }]}>
        <Svg width={140} height={140} viewBox="0 0 140 140">
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i * Math.PI) / 3;
            return (
              <Line key={i} x1={70} y1={70}
                x2={70 + Math.cos(a) * 70} y2={70 + Math.sin(a) * 70}
                stroke="#CC000025" strokeWidth={1}
              />
            );
          })}
        </Svg>
      </Animated.View>

      {/* Rotating sweep arm in crimson */}
      <Animated.View style={[StyleSheet.absoluteFill, rotStyle, { alignItems: 'center', justifyContent: 'flex-start', paddingTop: 6 }]}>
        <Svg width={70} height={70} viewBox="0 0 70 70">
          <Path d="M 35 35 L 35 6" stroke="#E62429" strokeWidth={2.5} strokeLinecap="round" opacity={0.9} />
          <Path d="M 35 35 L 35 6" stroke="#FF6B6B" strokeWidth={1} strokeLinecap="round" opacity={0.5} />
        </Svg>
      </Animated.View>

      {/* Core orb — crimson */}
      <LinearGradient
        colors={['#E62429', '#8B0000'] as [string, string]}
        style={styles.scopeCore}
      >
        <RadarIcon size={28} color="#FFFFFF" />
      </LinearGradient>
    </View>
  );
}

// ── Page 1: Spider-Verse Welcome ──────────────────────────────────────────────
function Page1({ theme }: { theme: any }) {
  return (
    <View style={[styles.page, { width: W, backgroundColor: '#0A0005' }]}>
      <SpiderWebBg />
      <LinearGradient
        colors={['#CC000018', 'transparent'] as [string, string]}
        style={styles.pageTopGlow}
      />
      <LinearGradient
        colors={['transparent', '#0A000580'] as [string, string]}
        style={[styles.pageTopGlow, { top: 'auto', bottom: 0, height: 160 }]}
      />

      <View style={styles.page1Content}>
        <Animated.View entering={FadeIn.duration(700)}>
          <SpiderScopeAnim />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.heroText}>
          <Text style={[styles.brand, { color: '#FFFFFF' }]}>
            Net<Text style={{ color: '#E62429' }}>Scope</Text>
          </Text>
          <Text style={[styles.tagline, { color: '#CBD5E1' }]}>
            Your network. Your rules.
          </Text>
          <Text style={[styles.teachLine, { color: '#94A3B8' }]}>
            Learn real networking skills with pro-grade tools.{'\n'}Understand what others just use.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(420)} style={styles.pillRow}>
          {[
            { label: 'Hands-On Scanning', col: '#E62429' },
            { label: 'Learn Professionally', col: '#FF6B6B' },
            { label: 'Real Network Data', col: '#CC0000' },
          ].map(({ label, col }) => (
            <View
              key={label}
              style={[styles.pill, { borderColor: `${col}35`, backgroundColor: `${col}12` }]}
            >
              <View style={[styles.pillDot, { backgroundColor: col }]} />
              <Text style={[styles.pillText, { color: '#CBD5E1' }]}>{label}</Text>
            </View>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

// ── Page 2: Features ──────────────────────────────────────────────────────────
const FEATURES = [
  { Icon: WifiIcon,   color: '#4F87FF', label: 'WiFi Analysis',   sub: 'Deep scan your network' },
  { Icon: RadarIcon,  color: '#00D4FF', label: 'Device Scanner',  sub: 'Discover LAN devices' },
  { Icon: ShieldIcon, color: '#A855F7', label: 'Security Audit',  sub: 'Detect threats & risks' },
  { Icon: ZapIcon,    color: '#00E5A0', label: 'Speed Test',      sub: 'Real bandwidth test' },
  { Icon: ServerIcon, color: '#FFBE5C', label: 'Port Scanner',    sub: 'Check open services' },
  { Icon: GlobeIcon,  color: '#FF5C8A', label: 'DNS & WHOIS',     sub: 'Domain intelligence' },
];

const MORE_ICONS = [ZapIcon, RadarIcon, GlobeIcon, ShieldIcon, ServerIcon];
const MORE_COLORS = ['#00E5A0', '#00D4FF', '#FF5C8A', '#A855F7', '#FFBE5C'];

function Page2({ theme }: { theme: any }) {
  return (
    <View style={[styles.page, { width: W }]}>
      <CircuitBoard theme={theme} />
      <LinearGradient colors={[`${theme.secondary}15`, 'transparent'] as [string, string]} style={styles.pageTopGlow} />

      <View style={styles.page2Content}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={[styles.pageEyebrow, { color: theme.accent }]}>WHAT'S INSIDE</Text>
          <Text style={[styles.pageHeading, { color: theme.textPrimary }]}>Professional{'\n'}Toolkit</Text>
        </Animated.View>

        <View style={styles.featureGrid}>
          {FEATURES.map(({ Icon, color, label, sub }, i) => (
            <Animated.View
              key={label}
              entering={FadeInDown.duration(400).delay(i * 70)}
              style={[styles.featureCard, { backgroundColor: `${color}0E`, borderColor: `${color}22` }]}
            >
              <LinearGradient
                colors={[`${color}18`, 'transparent'] as [string, string]}
                style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
              />
              <View style={[styles.featureIconBox, { backgroundColor: `${color}20` }]}>
                <Icon size={22} color={color} />
              </View>
              <Text style={[styles.featureLabel, { color: theme.textPrimary }]}>{label}</Text>
              <Text style={[styles.featureSub, { color: theme.textMuted }]}>{sub}</Text>
              <View style={[styles.featureCornerDot, { backgroundColor: `${color}40` }]} />
            </Animated.View>
          ))}
        </View>

        {/* "And much more" card */}
        <Animated.View entering={FadeInDown.duration(400).delay(550)}>
          <LinearGradient
            colors={[`${theme.primary}15`, `${theme.accent}0A`] as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.moreCard, { borderColor: `${theme.primary}25` }]}
          >
            <View style={styles.moreIconRow}>
              {MORE_ICONS.map((Icon, i) => (
                <View key={i} style={[styles.moreIconBox, { backgroundColor: `${MORE_COLORS[i]}20` }]}>
                  <Icon size={15} color={MORE_COLORS[i]} />
                </View>
              ))}
              <View style={[styles.moreIconBox, { backgroundColor: `${theme.primary}15` }]}>
                <Text style={[styles.morePlus, { color: theme.primary }]}>+</Text>
              </View>
            </View>
            <View>
              <Text style={[styles.moreLabel, { color: theme.textPrimary }]}>And 20+ more tools</Text>
              <Text style={[styles.moreSub, { color: theme.textMuted }]}>
                Bluetooth scan · Traceroute · Packet loss · QR scanner · DNS lookup · Ping · WHOIS
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </View>
  );
}

// ── Page 3: Permissions ───────────────────────────────────────────────────────
type PermStatus = 'idle' | 'loading' | 'granted' | 'denied';

interface PermRowProps {
  Icon: React.ComponentType<any>;
  color: string;
  label: string;
  note: string;
  why: string;
  status: PermStatus;
  isInfo?: boolean;
  onGrant?: () => void;
}

function PermRow({ Icon, color, label, note, why, status, isInfo, onGrant }: PermRowProps) {
  const { theme } = useTheme();
  const [showWhy, setShowWhy] = useState(false);

  return (
    <View style={[styles.permRow, {
      backgroundColor: theme.bgSurface,
      borderColor: `${color}25`,
      borderLeftColor: color,
    }]}>
      <LinearGradient
        colors={[`${color}10`, 'transparent'] as [string, string]}
        style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
      />
      <View style={[styles.permIcon, { backgroundColor: `${color}20` }]}>
        <Icon size={18} color={color} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.permLabel, { color: theme.textPrimary }]}>{label}</Text>
        <Text style={[styles.permNote, { color: theme.textMuted }]}>{note}</Text>
        {showWhy && (
          <Text style={[styles.permWhy, { color: theme.textSecondary }]}>{why}</Text>
        )}
        <TouchableOpacity onPress={() => setShowWhy(v => !v)}>
          <Text style={[styles.whyLink, { color: color }]}>
            {showWhy ? 'Hide' : 'Why needed?'}
          </Text>
        </TouchableOpacity>
      </View>
      {isInfo
        ? <CheckCircleIcon size={18} color={theme.success} />
        : status === 'granted'
          ? <CheckCircleIcon size={18} color={theme.success} />
          : status === 'denied'
            ? <XCircleIcon size={18} color={theme.error} />
            : status === 'loading'
              ? <ActivityIndicator size="small" color={color} />
              : (
                <TouchableOpacity
                  onPress={onGrant}
                  style={[styles.grantBtn, { borderColor: color, backgroundColor: `${color}15` }]}
                >
                  <Text style={[styles.grantText, { color }]}>Grant</Text>
                </TouchableOpacity>
              )
      }
    </View>
  );
}

function Page3({ theme, onFinish, onRefreshNetwork }: { theme: any; onFinish: () => void; onRefreshNetwork: () => void }) {
  const [locStatus, setLocStatus] = useState<PermStatus>('idle');
  const btnScale = useSharedValue(1);

  useEffect(() => {
    Location.getForegroundPermissionsAsync()
      .then(({ status }) => {
        if (status === 'granted') setLocStatus('granted');
        else if (status === 'denied') setLocStatus('denied');
      })
      .catch(() => {});
  }, []);

  const requestLocation = async () => {
    setLocStatus('loading');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setLocStatus(granted ? 'granted' : 'denied');
      // Refresh network info now that permission is (possibly) granted so SSID is available
      if (granted) onRefreshNetwork();
    } catch {
      setLocStatus('denied');
    }
  };

  const handleLaunch = () => {
    btnScale.value = withSequence(withSpring(0.95), withSpring(1));
    setTimeout(onFinish, 120);
  };

  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  return (
    <View style={[styles.page, { width: W }]}>
      <CircuitBoard theme={theme} />
      <LinearGradient colors={[`${theme.success}12`, 'transparent'] as [string, string]} style={styles.pageTopGlow} />

      <View style={styles.page3Content}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={[styles.pageEyebrow, { color: theme.success }]}>PERMISSIONS</Text>
          <Text style={[styles.pageHeading, { color: theme.textPrimary }]}>One Last{'\n'}Step</Text>
          <Text style={[styles.page3Sub, { color: theme.textSecondary }]}>
            NetScope needs a few permissions to work properly.{'\n'}All data stays on your device.
          </Text>
        </Animated.View>

        <View style={styles.permList}>
          <Animated.View entering={FadeInDown.duration(400).delay(80)}>
            <PermRow
              Icon={WifiIcon}
              color="#4F87FF"
              label="Location Access"
              note="Required to read your WiFi name (SSID) on Android"
              why="Android requires location permission to display your WiFi network name. Without it, the network name shows as unknown. No GPS location is accessed — this is an Android system restriction."
              status={locStatus}
              onGrant={requestLocation}
            />
          </Animated.View>
          <Animated.View entering={FadeInDown.duration(400).delay(160)}>
            <PermRow
              Icon={RadarIcon}
              color="#00D4FF"
              label="Network Scanning"
              note="Discover & analyze devices on your LAN"
              why="Allows NetScope to probe your local network for connected devices. No data is uploaded — all scanning happens locally on your device."
              status="granted"
              isInfo
            />
          </Animated.View>
          <Animated.View entering={FadeInDown.duration(400).delay(240)}>
            <PermRow
              Icon={ShieldIcon}
              color="#A855F7"
              label="On-Device Privacy"
              note="Zero cloud sync — all analysis runs locally"
              why="NetScope does not collect, upload, or share any of your network data. Everything runs entirely on your device."
              status="granted"
              isInfo
            />
          </Animated.View>
        </View>

        <Animated.View style={[btnStyle, { width: '100%' }]} entering={FadeInDown.duration(400).delay(340)}>
          <TouchableOpacity onPress={handleLaunch} activeOpacity={0.88}>
            <LinearGradient
              colors={[theme.primary, theme.secondary, theme.accent] as [string, string, string]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.launchBtn}
            >
              <Text style={styles.launchText}>
                {locStatus === 'granted' ? 'Start Exploring' : 'Start Exploring'}
              </Text>
              <View style={styles.launchArrow}>
                <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '700' }}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity onPress={onFinish} style={styles.skipLink}>
          <Text style={[styles.skipLinkText, { color: theme.textMuted }]}>
            Skip for now — grant permissions later when needed
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function Onboarding() {
  const { theme } = useTheme();
  const { refresh: refreshNetwork } = useNetwork();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const PAGES = 3;

  const goNext = useCallback(async () => {
    if (page < PAGES - 1) {
      const next = page + 1;
      setPage(next);
      scrollRef.current?.scrollTo({ x: next * W, animated: true });
    } else {
      await setOnboardingDone();
      router.replace('/(tabs)/dashboard');
    }
  }, [page]);

  const goSkip = useCallback(async () => {
    await setOnboardingDone();
    router.replace('/(tabs)/dashboard');
  }, []);

  const handleScroll = useCallback((e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / W);
    setPage(idx);
  }, []);

  const paddingBottom = Math.max(insets.bottom, 20);
  const paddingTop = Platform.OS === 'web' ? Math.max(insets.top, 44) : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: page === 0 ? '#0A0005' : theme.bg }]}>
      {page !== 0 && (
        <LinearGradient colors={theme.gradientBg as [string, string, string]} style={StyleSheet.absoluteFill} />
      )}

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: paddingTop + 8 }]}>
        <LinearGradient
          colors={page === 0 ? ['#E62429', '#8B0000'] : [theme.primary, theme.accent] as [string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.logoMark}
        >
          <Text style={styles.logoMarkText}>N</Text>
        </LinearGradient>
        <Text style={[styles.brandName, { color: page === 0 ? '#FFFFFF' : theme.textPrimary }]}>
          Net<Text style={{ color: page === 0 ? '#E62429' : theme.accent }}>Scope</Text>
        </Text>
        {page < PAGES - 1 && (
          <TouchableOpacity
            onPress={goSkip}
            style={[styles.skipBtn, {
              borderColor: page === 0 ? '#CC000040' : `${theme.primary}30`,
              backgroundColor: page === 0 ? '#CC000012' : `${theme.primary}08`,
            }]}
          >
            <Text style={[styles.skipText, { color: page === 0 ? '#94A3B8' : theme.textMuted }]}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        <Page1 theme={theme} />
        <Page2 theme={theme} />
        <Page3 theme={theme} onFinish={goNext} onRefreshNetwork={refreshNetwork} />
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, {
        paddingBottom: paddingBottom + 8,
        backgroundColor: page === 0 ? 'transparent' : 'transparent',
      }]}>
        <View style={styles.dots}>
          {Array.from({ length: PAGES }).map((_, i) => (
            <LinearGradient
              key={i}
              colors={i === page
                ? (page === 0 ? ['#E62429', '#CC0000'] : [theme.primary, theme.accent]) as [string, string]
                : [theme.bgSurface, theme.bgSurface] as [string, string]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.dot, {
                width: i === page ? 28 : 7,
                borderColor: i === page ? 'transparent' : page === 0 ? '#CC000030' : theme.border,
                borderWidth: i === page ? 0 : 1,
              }]}
            />
          ))}
        </View>

        {page < PAGES - 1 && (
          <TouchableOpacity onPress={goNext} activeOpacity={0.85}>
            <LinearGradient
              colors={page === 0 ? ['#E62429', '#CC0000'] : [theme.primary, theme.accent] as [string, string]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.nextBtn}
            >
              <Text style={styles.nextBtnText}>Next</Text>
              <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 24, paddingBottom: 12, zIndex: 10,
  },
  logoMark: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  logoMarkText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  brandName: { flex: 1, fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
  skipBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  skipText: { fontSize: 13, fontWeight: '500' },

  page: { flex: 1, overflow: 'hidden', justifyContent: 'center' },
  pageTopGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 280, opacity: 0.7 },

  // Page 1
  page1Content: { alignItems: 'center', paddingHorizontal: 26, gap: 24 },
  heroText: { alignItems: 'center', gap: 8 },
  brand: { fontSize: 60, fontWeight: '900', letterSpacing: -2, textAlign: 'center', lineHeight: 64 },
  tagline: { fontSize: 17, textAlign: 'center', fontWeight: '600', letterSpacing: 0.2 },
  teachLine: { fontSize: 13.5, textAlign: 'center', lineHeight: 20, marginTop: 4 },
  pillRow: { gap: 8, width: '100%' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1,
  },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 13, fontWeight: '600' },

  // Spider scope
  scopeWrap: { width: 170, height: 170, alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', borderWidth: 1.5 },
  staticRing: { position: 'absolute', borderWidth: 1 },
  scopeCore: {
    width: 70, height: 70, borderRadius: 35,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#E62429', shadowOpacity: 0.6, shadowRadius: 20, shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },

  // Page 2
  page2Content: { paddingHorizontal: 20, gap: 16 },
  pageEyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  pageHeading: { fontSize: 36, fontWeight: '900', letterSpacing: -1, lineHeight: 40 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  featureCard: {
    width: (W - 40 - 10) / 2 - 1,
    borderRadius: 18, borderWidth: 1, padding: 14, gap: 7, overflow: 'hidden',
  },
  featureIconBox: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  featureLabel: { fontSize: 13, fontWeight: '700', letterSpacing: -0.2 },
  featureSub: { fontSize: 11, lineHeight: 15 },
  featureCornerDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4 },

  // More card
  moreCard: {
    borderRadius: 18, borderWidth: 1, padding: 14, gap: 10,
    flexDirection: 'row', alignItems: 'center',
  },
  moreIconRow: { flexDirection: 'row', gap: 6 },
  moreIconBox: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  morePlus: { fontSize: 16, fontWeight: '800' },
  moreLabel: { fontSize: 13, fontWeight: '700' },
  moreSub: { fontSize: 10, lineHeight: 14, marginTop: 2 },

  // Page 3
  page3Content: { paddingHorizontal: 22, gap: 18 },
  page3Sub: { fontSize: 14, lineHeight: 21, marginTop: 6 },
  permList: { gap: 9 },
  permRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 13,
    borderRadius: 16, borderWidth: 1, borderLeftWidth: 3, overflow: 'hidden',
  },
  permIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  permLabel: { fontSize: 14, fontWeight: '700' },
  permNote: { fontSize: 11, lineHeight: 15 },
  permWhy: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  whyLink: { fontSize: 10, fontWeight: '600', marginTop: 3 },
  grantBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, marginTop: 2,
  },
  grantText: { fontSize: 12, fontWeight: '700' },
  launchBtn: {
    height: 62, borderRadius: 20, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 12,
    elevation: 16, shadowColor: '#4F87FF', shadowOpacity: 0.5, shadowRadius: 24, shadowOffset: { width: 0, height: 10 },
  },
  launchText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: 0.2 },
  launchArrow: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  skipLink: { alignItems: 'center', paddingVertical: 8 },
  skipLinkText: { fontSize: 12, textAlign: 'center', textDecorationLine: 'underline' },

  // Footer
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 14,
  },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { height: 7, borderRadius: 4 },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 28, paddingVertical: 14, borderRadius: 999,
    elevation: 8, shadowColor: '#4F87FF', shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 4 },
  },
  nextBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
