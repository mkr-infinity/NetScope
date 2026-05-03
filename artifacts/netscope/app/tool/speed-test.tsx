import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform,
} from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence,
  useAnimatedProps, Easing, interpolate, cancelAnimation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useTheme } from '@/contexts/ThemeContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { typography, spacing, radius } from '@/constants/theme';
import {
  ArrowLeftIcon, DownloadIcon, UploadIcon, ZapIcon, ActivityIcon,
  WifiIcon, ServerIcon, GlobeIcon,
} from '@/components/icons/Icons';
import { measureDownload, measureUpload, measurePing } from '@/services/speedService';
import ToolLearnCard from '@/components/ui/ToolLearnCard';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CX = 140;
const CY = 140;
const R = 110;
const START_ANGLE = 215;
const ARC_SPAN = 270;

function polarToXY(angleDeg: number, r = R) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function makeArcPath(startAngle: number, endAngle: number) {
  'worklet';
  const toRad = (a: number) => (a - 90) * Math.PI / 180;
  const r = 110;
  const cx = 140;
  const cy = 140;
  const sx = cx + r * Math.cos(toRad(startAngle));
  const sy = cy + r * Math.sin(toRad(startAngle));
  const ex = cx + r * Math.cos(toRad(endAngle));
  const ey = cy + r * Math.sin(toRad(endAngle));
  const span = endAngle - startAngle;
  if (span < 0.5) return `M ${sx.toFixed(2)} ${sy.toFixed(2)}`;
  const large = span > 180 ? 1 : 0;
  return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
}

const bgStart = polarToXY(START_ANGLE);
const bgEnd = polarToXY(START_ANGLE + ARC_SPAN);
const BG_PATH = `M ${bgStart.x.toFixed(2)} ${bgStart.y.toFixed(2)} A ${R} ${R} 0 1 1 ${bgEnd.x.toFixed(2)} ${bgEnd.y.toFixed(2)}`;

// Tick marks
const TICKS = Array.from({ length: 19 }).map((_, i) => {
  const angle = START_ANGLE + (i / 18) * ARC_SPAN;
  const isMajor = i % 6 === 0;
  const inner = polarToXY(angle, R - 6);
  const outer = polarToXY(angle, R + (isMajor ? 14 : 8));
  return { angle, inner, outer, isMajor };
});

type Phase = 'idle' | 'ping' | 'download' | 'upload' | 'done';

const PHASE_COLORS: Record<Phase, string> = {
  idle: '#4F87FF',
  ping: '#00E5A0',
  download: '#4F87FF',
  upload: '#A855F7',
  done: '#00E5A0',
};

function StatCard({ label, value, unit, icon, color, active }: {
  label: string; value: string; unit: string; icon: React.ReactNode; color: string; active?: boolean;
}) {
  const { theme } = useTheme();
  const glow = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    glow.value = withTiming(active ? 1 : 0, { duration: 400 });
  }, [active]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(glow.value, [0, 1], [0, 0.5]),
    shadowRadius: interpolate(glow.value, [0, 1], [0, 20]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1, 1.02]) }],
  }));

  return (
    <Animated.View style={[
      styles.statCard,
      { backgroundColor: theme.bgSurface, borderColor: active ? `${color}50` : `${color}20`, shadowColor: color },
      glowStyle,
    ]}>
      <LinearGradient colors={[`${color}${active ? '20' : '10'}`, 'transparent'] as [string, string]} style={[StyleSheet.absoluteFill, { borderRadius: radius.xl }]} />
      <View style={[styles.statIcon, { backgroundColor: `${color}${active ? '30' : '18'}` }]}>{icon}</View>
      <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
        <Text style={[styles.statValue, { color: active ? color : theme.textPrimary }]}>{value}</Text>
        <Text style={[styles.statUnit, { color }]}>{unit}</Text>
      </View>
    </Animated.View>
  );
}

function NetInfoRow({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.netRow, { borderBottomColor: theme.border }]}>
      <View style={[styles.netRowIcon, { backgroundColor: `${color}15` }]}>{icon}</View>
      <Text style={[styles.netRowLabel, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.netRowValue, { color: theme.textPrimary }]} numberOfLines={1}>{value || '—'}</Text>
    </View>
  );
}

const LEARN_SECTIONS = [
  {
    title: 'Bandwidth Basics',
    color: '#4F87FF',
    items: [
      'Download: data flowing to your device (streaming, browsing, updates)',
      'Upload: data leaving your device (video calls, cloud backups, posts)',
      'Bandwidth is shared — peak hours (7-11pm) are typically slower',
      'Wi-Fi theoretical vs real: 100Mbps plan delivers ~60-80Mbps over Wi-Fi',
    ],
  },
  {
    title: 'Interpreting Results',
    color: '#00E5A0',
    items: [
      '<10 Mbps: Basic browsing & SD video (1 device)',
      '25 Mbps: HD streaming (Netflix requires 25 Mbps for 4K)',
      '100 Mbps: Multi-device household, HD calls, gaming',
      '500+ Mbps: Server workloads, large file transfers, gaming servers',
      '>1 Gbps: Fiber gigabit — future-proof for any use case',
    ],
  },
  {
    title: 'Latency & Jitter',
    color: '#A855F7',
    items: [
      'Ping: round-trip time to server (lower = more responsive)',
      'Jitter: variance in ping — high jitter = choppy VoIP/gaming',
      '<20ms ping: excellent for gaming and video calls',
      'Bufferbloat: high ping during downloads — fix with QoS on router',
      'VPN adds 20-80ms latency via encryption overhead',
    ],
  },
];

export default function SpeedTest() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { networkInfo } = useNetwork();
  const [phase, setPhase] = useState<Phase>('idle');
  const [display, setDisplay] = useState(0);
  const [download, setDownload] = useState<number | null>(null);
  const [upload, setUpload] = useState<number | null>(null);
  const [ping, setPing] = useState<number | null>(null);
  const [jitter, setJitter] = useState<number | null>(null);
  const running = useRef(false);
  const displayTarget = useRef(0);
  const displayCurrent = useRef(0);
  const animInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const progress = useSharedValue(0);
  const ring1 = useSharedValue(0);
  const ring2 = useSharedValue(0);
  const ring3 = useSharedValue(0);
  const dotPulse = useSharedValue(1);

  const animatedArcProps = useAnimatedProps(() => {
    const endAngle = START_ANGLE + Math.max(0, Math.min(1, progress.value)) * ARC_SPAN;
    return { d: makeArcPath(START_ANGLE, endAngle) };
  });

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(ring1.value, [0, 1], [0.7, 1.6]) }],
    opacity: interpolate(ring1.value, [0, 0.3, 1], [0, 0.45, 0]),
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(ring2.value, [0, 1], [0.7, 1.8]) }],
    opacity: interpolate(ring2.value, [0, 0.3, 1], [0, 0.3, 0]),
  }));
  const ring3Style = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(ring3.value, [0, 1], [0.7, 2.0]) }],
    opacity: interpolate(ring3.value, [0, 0.3, 1], [0, 0.18, 0]),
  }));
  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotPulse.value }],
    opacity: interpolate(dotPulse.value, [1, 1.4], [0.8, 1]),
  }));

  const startPulse = useCallback((color: string) => {
    ring1.value = 0;
    ring2.value = 0;
    ring3.value = 0;
    ring1.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.cubic) }), -1);
    setTimeout(() => {
      ring2.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.cubic) }), -1);
    }, 600);
    setTimeout(() => {
      ring3.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.cubic) }), -1);
    }, 1200);
    dotPulse.value = withRepeat(withSequence(
      withTiming(1.4, { duration: 600, easing: Easing.inOut(Easing.sin) }),
      withTiming(1.0, { duration: 600, easing: Easing.inOut(Easing.sin) }),
    ), -1);
  }, []);

  const stopPulse = useCallback(() => {
    cancelAnimation(ring1); cancelAnimation(ring2); cancelAnimation(ring3); cancelAnimation(dotPulse);
    ring1.value = withTiming(0, { duration: 400 });
    ring2.value = withTiming(0, { duration: 400 });
    ring3.value = withTiming(0, { duration: 400 });
    dotPulse.value = withTiming(1, { duration: 300 });
  }, []);

  const animateTo = useCallback((target: number) => {
    displayTarget.current = target;
    if (animInterval.current) clearInterval(animInterval.current);
    animInterval.current = setInterval(() => {
      const curr = displayCurrent.current;
      const tgt = displayTarget.current;
      if (Math.abs(curr - tgt) < 0.5) {
        displayCurrent.current = tgt;
        setDisplay(tgt);
        if (animInterval.current) { clearInterval(animInterval.current); animInterval.current = null; }
        return;
      }
      const next = curr + (tgt - curr) * 0.12;
      displayCurrent.current = next;
      setDisplay(next);
    }, 50);
  }, []);

  const runTest = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setDownload(null); setUpload(null); setPing(null); setJitter(null);
    displayCurrent.current = 0;
    displayTarget.current = 0;
    setDisplay(0);
    progress.value = withTiming(0, { duration: 200 });

    // ── Ping phase ────────────────────────────────────────────────────
    setPhase('ping');
    startPulse('#00E5A0');
    progress.value = withTiming(0.15, { duration: 800, easing: Easing.out(Easing.quad) });
    const pingResult = await measurePing(3);
    setPing(pingResult.avg);
    setJitter(pingResult.jitter);
    animateTo(pingResult.avg);

    // ── Download phase ────────────────────────────────────────────────
    setPhase('download');
    startPulse('#4F87FF');
    progress.value = withTiming(0.05, { duration: 300 });
    animateTo(0);
    displayCurrent.current = 0;

    const dlPromise = measureDownload(5);
    let dlRunning = true;
    let dlFakeTarget = 0;

    const dlFakeLoop = setInterval(() => {
      if (!dlRunning) { clearInterval(dlFakeLoop); return; }
      dlFakeTarget = Math.min(dlFakeTarget + 8 + Math.random() * 12, 160);
      animateTo(dlFakeTarget);
      progress.value = withTiming(0.06 + (dlFakeTarget / 200) * 0.65, { duration: 600, easing: Easing.out(Easing.quad) });
    }, 700);

    const dlVal = await dlPromise;
    dlRunning = false;
    clearInterval(dlFakeLoop);
    setDownload(dlVal);
    animateTo(dlVal);
    progress.value = withTiming(Math.min(dlVal / 200, 1), { duration: 600 });
    await new Promise(r => setTimeout(r, 500));

    // ── Upload phase ──────────────────────────────────────────────────
    setPhase('upload');
    startPulse('#A855F7');
    progress.value = withTiming(0.05, { duration: 300 });
    animateTo(0);
    displayCurrent.current = 0;

    const ulPromise = measureUpload();
    let ulRunning = true;
    let ulFakeTarget = 0;

    const ulFakeLoop = setInterval(() => {
      if (!ulRunning) { clearInterval(ulFakeLoop); return; }
      ulFakeTarget = Math.min(ulFakeTarget + 5 + Math.random() * 8, 120);
      animateTo(ulFakeTarget);
      progress.value = withTiming(0.06 + (ulFakeTarget / 150) * 0.6, { duration: 700, easing: Easing.out(Easing.quad) });
    }, 750);

    const ulVal = await ulPromise;
    ulRunning = false;
    clearInterval(ulFakeLoop);
    setUpload(ulVal);
    animateTo(ulVal);
    progress.value = withTiming(Math.min(ulVal / 150, 1), { duration: 600 });
    await new Promise(r => setTimeout(r, 400));

    // ── Done ──────────────────────────────────────────────────────────
    setPhase('done');
    stopPulse();
    running.current = false;
  }, [animateTo, startPulse, stopPulse]);

  useEffect(() => {
    return () => {
      if (animInterval.current) clearInterval(animInterval.current);
    };
  }, []);

  const gaugeColor = PHASE_COLORS[phase];
  const phaseLabel =
    phase === 'idle' ? 'Tap to Start' :
    phase === 'ping' ? 'Measuring Ping...' :
    phase === 'download' ? 'Testing Download...' :
    phase === 'upload' ? 'Testing Upload...' : 'Complete';
  const displayUnit = phase === 'ping' ? 'ms' : 'Mbps';
  const paddingTop = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const signalQuality = networkInfo?.rssi
    ? networkInfo.rssi >= -60 ? 'Excellent' : networkInfo.rssi >= -70 ? 'Good' : networkInfo.rssi >= -80 ? 'Fair' : 'Weak'
    : null;
  const signalColor = networkInfo?.rssi
    ? networkInfo.rssi >= -60 ? '#00E5A0' : networkInfo.rssi >= -70 ? '#4F87FF' : networkInfo.rssi >= -80 ? '#FFBE5C' : '#FF5C5C'
    : theme.textMuted;

  const isActive = phase !== 'idle' && phase !== 'done';

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <LinearGradient colors={theme.gradientBg as [string, string, string]} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={[`${gaugeColor}18`, 'transparent'] as [string, string]} style={styles.topGlow} />

      <View style={[styles.header, { paddingTop: paddingTop + spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <ArrowLeftIcon size={18} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Speed Test</Text>
          <Text style={[styles.pageSubtitle, { color: theme.textMuted }]}>Cloudflare Speed Network</Text>
        </View>
        <ToolLearnCard
          tool="Speed Test"
          tagline="Understand bandwidth, latency & signal quality"
          sections={LEARN_SECTIONS}
        />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]} showsVerticalScrollIndicator={false}>

        {/* ── Gauge ─────────────────────────────────────────────────────── */}
        <View style={styles.gaugeWrapper}>

          {/* Pulse rings */}
          <Animated.View style={[styles.pulseRing, { borderColor: `${gaugeColor}` }, ring1Style]} />
          <Animated.View style={[styles.pulseRing, { borderColor: `${gaugeColor}` }, ring2Style]} />
          <Animated.View style={[styles.pulseRing, { borderColor: `${gaugeColor}` }, ring3Style]} />

          {/* Phase color glow */}
          {isActive && (
            <View style={[styles.gaugeGlow, { backgroundColor: `${gaugeColor}15` }]} />
          )}

          <Svg width={280} height={260} viewBox="0 0 280 260">
            <Defs>
              <SvgGradient id="arcGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor={gaugeColor} stopOpacity="1" />
                <Stop offset="100%" stopColor={phase === 'upload' ? '#00D4FF' : phase === 'ping' ? '#4F87FF' : '#A855F7'} stopOpacity="1" />
              </SvgGradient>
            </Defs>

            {/* Background arc */}
            <Path d={BG_PATH} stroke="rgba(120,140,200,0.12)" strokeWidth={16} strokeLinecap="round" fill="none" />

            {/* Tick marks */}
            {TICKS.map((t, i) => (
              <Path
                key={i}
                d={`M ${t.inner.x.toFixed(1)} ${t.inner.y.toFixed(1)} L ${t.outer.x.toFixed(1)} ${t.outer.y.toFixed(1)}`}
                stroke={t.isMajor ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.07)'}
                strokeWidth={t.isMajor ? 2 : 1} strokeLinecap="round"
              />
            ))}

            {/* Active arc */}
            <AnimatedPath animatedProps={animatedArcProps} stroke="url(#arcGrad)" strokeWidth={16} strokeLinecap="round" fill="none" />

            {/* Center dot */}
            <Circle cx={CX} cy={CY} r={52} fill={`${gaugeColor}06`} />
          </Svg>

          {/* Pulsing center dot indicator */}
          {isActive && (
            <Animated.View style={[styles.centerDot, { backgroundColor: gaugeColor, shadowColor: gaugeColor }, dotStyle]} />
          )}

          {/* Value overlay */}
          <View style={styles.gaugeValueOverlay}>
            <Text style={[styles.gaugeValue, { color: theme.textPrimary }]}>
              {phase === 'idle' ? '—' : display.toFixed(phase === 'ping' ? 0 : 1)}
            </Text>
            <Text style={[styles.gaugeUnit, { color: gaugeColor }]}>
              {phase === 'idle' ? '' : displayUnit}
            </Text>
          </View>

          {/* Phase label below gauge */}
          <View style={[styles.phaseBar, { backgroundColor: `${gaugeColor}12`, borderColor: `${gaugeColor}25` }]}>
            <View style={[styles.phaseDot, { backgroundColor: gaugeColor, shadowColor: gaugeColor }]} />
            <Text style={[styles.phaseLabel, { color: gaugeColor }]}>{phaseLabel}</Text>
          </View>
        </View>

        {/* ── Stat Cards ────────────────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          <StatCard
            label="Download" value={download !== null ? download.toFixed(1) : '—'}
            unit={download !== null ? 'Mbps' : ''} icon={<DownloadIcon size={18} color="#4F87FF" />}
            color="#4F87FF" active={phase === 'download'}
          />
          <StatCard
            label="Upload" value={upload !== null ? upload.toFixed(1) : '—'}
            unit={upload !== null ? 'Mbps' : ''} icon={<UploadIcon size={18} color="#A855F7" />}
            color="#A855F7" active={phase === 'upload'}
          />
          <StatCard
            label="Ping" value={ping !== null ? String(ping) : '—'}
            unit={ping !== null ? 'ms' : ''} icon={<ZapIcon size={18} color="#00E5A0" />}
            color="#00E5A0" active={phase === 'ping'}
          />
          <StatCard
            label="Jitter" value={jitter !== null ? String(jitter) : '—'}
            unit={jitter !== null ? 'ms' : ''} icon={<ActivityIcon size={18} color="#FFBE5C" />}
            color="#FFBE5C" active={false}
          />
        </View>

        {/* ── Network Context ───────────────────────────────────────────── */}
        {networkInfo && (
          <View style={[styles.netCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <View style={styles.netCardHeader}>
              <LinearGradient colors={[theme.primary, theme.accent] as [string, string]} style={styles.netCardIcon}>
                <WifiIcon size={13} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.netCardTitle, { color: theme.textPrimary }]}>Network Context</Text>
              {networkInfo.connectionType && (
                <View style={[styles.connTypeBadge, { backgroundColor: `${theme.primary}15`, borderColor: `${theme.primary}25` }]}>
                  <Text style={[styles.connTypeText, { color: theme.primary }]}>{networkInfo.connectionType.toUpperCase()}</Text>
                </View>
              )}
            </View>
            {networkInfo.ssid && networkInfo.ssid !== '—' && <NetInfoRow icon={<WifiIcon size={13} color="#4F87FF" />} label="SSID" value={networkInfo.ssid} color="#4F87FF" />}
            {networkInfo.isp && networkInfo.isp !== '—' && <NetInfoRow icon={<ServerIcon size={13} color="#00D4FF" />} label="ISP" value={networkInfo.isp} color="#00D4FF" />}
            {networkInfo.localIP && networkInfo.localIP !== '—' && <NetInfoRow icon={<GlobeIcon size={13} color="#A855F7" />} label="Local IP" value={networkInfo.localIP} color="#A855F7" />}
            {networkInfo.publicIP && networkInfo.publicIP !== '—' && <NetInfoRow icon={<GlobeIcon size={13} color="#00E5A0" />} label="Public IP" value={networkInfo.publicIP} color="#00E5A0" />}
            {networkInfo.rssi != null && (
              <NetInfoRow
                icon={<ActivityIcon size={13} color={signalColor} />}
                label="Signal"
                value={`${networkInfo.rssi} dBm · ${signalQuality}`}
                color={signalColor}
              />
            )}
          </View>
        )}

        {/* ── Speed Reference ───────────────────────────────────────────── */}
        <View style={[styles.scaleCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
          <Text style={[styles.scaleTitle, { color: theme.textMuted }]}>SPEED REFERENCE</Text>
          <View style={styles.scaleRow}>
            {[
              { label: 'Streaming', speed: '25', color: '#00E5A0' },
              { label: '4K Video',  speed: '50',  color: '#4F87FF' },
              { label: 'Gaming',    speed: '100', color: '#A855F7' },
              { label: 'Fiber',     speed: '1000',color: '#00D4FF' },
            ].map(item => (
              <View key={item.label} style={styles.scaleItem}>
                <View style={[styles.scaleDot, { backgroundColor: item.color }]} />
                <Text style={[styles.scaleSpeedText, { color: theme.textPrimary }]}>{item.speed}</Text>
                <Text style={[styles.scaleLabelText, { color: theme.textMuted }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Run Button ────────────────────────────────────────────────── */}
        <TouchableOpacity
          onPress={runTest}
          disabled={isActive}
          activeOpacity={0.85}
          style={{ width: '100%' }}
        >
          <LinearGradient
            colors={!isActive
              ? [gaugeColor, phase === 'done' ? '#4F87FF' : '#A855F7'] as [string, string]
              : ['#1A1A2E', '#16213E'] as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.runBtn, !isActive ? { shadowColor: gaugeColor, shadowOpacity: 0.5, shadowRadius: 24, elevation: 14 } : {}]}
          >
            <Text style={[styles.runBtnText, { color: isActive ? theme.textMuted : '#FFFFFF' }]}>
              {phase === 'idle' ? 'Start Speed Test' : phase === 'done' ? 'Run Again' : 'Running...'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const GAUGE_SIZE = 280;

const styles = StyleSheet.create({
  container: { flex: 1 },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 340, opacity: 0.7 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  pageTitle: { fontSize: typography.lg, fontWeight: typography.bold },
  pageSubtitle: { fontSize: typography.xs, marginTop: 1 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.lg, alignItems: 'center' },

  // Gauge
  gaugeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
  },
  gaugeGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  pulseRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1.5,
  },
  centerDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  gaugeValueOverlay: {
    position: 'absolute',
    top: 72,
    alignItems: 'center',
  },
  gaugeValue: { fontSize: 56, fontWeight: '900', letterSpacing: -2, lineHeight: 60 },
  gaugeUnit: { fontSize: typography.md, fontWeight: typography.semibold, marginTop: -2 },
  phaseBar: {
    position: 'absolute',
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  phaseDot: {
    width: 6, height: 6, borderRadius: 3,
    shadowOpacity: 0.8, shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  phaseLabel: { fontSize: typography.xs, fontWeight: typography.semibold, letterSpacing: 0.3 },

  // Stat cards
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, width: '100%' },
  statCard: {
    flex: 1, minWidth: '46%', borderRadius: radius.xl, borderWidth: 1,
    padding: spacing.md, gap: spacing.xs, overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: typography.xs, letterSpacing: 0.5, fontWeight: '600' },
  statValue: { fontSize: typography.xl, fontWeight: typography.black, letterSpacing: -0.5 },
  statUnit: { fontSize: typography.xs, fontWeight: typography.semibold },

  // Network card
  netCard: { width: '100%', borderRadius: radius.xl, borderWidth: 1, overflow: 'hidden' },
  netCardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  netCardIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  netCardTitle: { flex: 1, fontSize: typography.sm, fontWeight: typography.bold },
  connTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, borderWidth: 1 },
  connTypeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  netRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  netRowIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  netRowLabel: { fontSize: typography.xs, fontWeight: '600', width: 72 },
  netRowValue: { flex: 1, fontSize: typography.sm, fontWeight: typography.semibold, textAlign: 'right' },

  // Scale card
  scaleCard: { width: '100%', borderRadius: radius.xl, borderWidth: 1, padding: spacing.md, gap: spacing.sm },
  scaleTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  scaleItem: { alignItems: 'center', gap: 4 },
  scaleDot: { width: 8, height: 8, borderRadius: 4 },
  scaleSpeedText: { fontSize: 13, fontWeight: '700' },
  scaleLabelText: { fontSize: 10 },

  // Run button
  runBtn: {
    width: '100%', height: 58, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
  },
  runBtnText: { fontSize: typography.md, fontWeight: typography.bold, letterSpacing: 0.3 },
});
