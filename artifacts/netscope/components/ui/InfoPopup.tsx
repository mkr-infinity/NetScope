import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { typography, spacing, radius } from '@/constants/theme';
import { HelpCircleIcon, XIcon, ZapIcon, InfoIcon, CheckCircleIcon } from '@/components/icons/Icons';

export interface InfoData {
  title: string;
  description: string;
  why: string;
  how: string;
  tip: string;
}

function InfoModal({ visible, onClose, info }: { visible: boolean; onClose: () => void; info: InfoData }) {
  const { theme, isDark } = useTheme();
  if (!visible) return null;
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      </TouchableOpacity>
      <Animated.View entering={SlideInDown.springify().damping(18)} exiting={SlideOutDown} style={[styles.sheet, { backgroundColor: theme.bgElevated, borderColor: theme.border }]}>
        <LinearGradient
          colors={[`${theme.primary}12`, 'transparent'] as [string, string]}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.xxl }]}
        />
        <View style={[styles.handle, { backgroundColor: theme.border }]} />
        <View style={styles.header}>
          <LinearGradient colors={[theme.primary, theme.accent] as [string, string]} style={styles.headerIcon}>
            <InfoIcon size={16} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{info.title}</Text>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <XIcon size={14} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
          <View style={[styles.section, { backgroundColor: theme.bgSurface, borderColor: `${theme.primary}20` }]}>
            <Text style={[styles.sectionLabel, { color: theme.primary }]}>WHAT IT IS</Text>
            <Text style={[styles.sectionText, { color: theme.textSecondary }]}>{info.description}</Text>
          </View>

          <View style={[styles.section, { backgroundColor: theme.bgSurface, borderColor: `${theme.success}20` }]}>
            <Text style={[styles.sectionLabel, { color: theme.success }]}>WHY IT IS USEFUL</Text>
            <Text style={[styles.sectionText, { color: theme.textSecondary }]}>{info.why}</Text>
          </View>

          <View style={[styles.section, { backgroundColor: theme.bgSurface, borderColor: `${theme.accent}20` }]}>
            <Text style={[styles.sectionLabel, { color: theme.accent }]}>HOW IT WORKS</Text>
            <Text style={[styles.sectionText, { color: theme.textSecondary }]}>{info.how}</Text>
          </View>

          <View style={[styles.tipRow, { backgroundColor: `${theme.warning}10`, borderColor: `${theme.warning}25` }]}>
            <ZapIcon size={14} color={theme.warning} />
            <Text style={[styles.tipLabel, { color: theme.warning }]}>TIP</Text>
            <Text style={[styles.tipText, { color: theme.textSecondary }]}>{info.tip}</Text>
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

export default function InfoButton({ info }: { info: InfoData }) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={[styles.infoBtn, { borderColor: `${theme.primary}30`, backgroundColor: `${theme.primary}08` }]}>
        <HelpCircleIcon size={12} color={theme.primary} />
      </TouchableOpacity>
      <InfoModal visible={visible} onClose={() => setVisible(false)} info={info} />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    padding: spacing.xl, gap: spacing.md,
    maxHeight: '75%', overflow: 'hidden',
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  headerIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: typography.md, fontWeight: typography.bold },
  closeBtn: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  section: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, gap: 6 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  sectionText: { fontSize: typography.sm, lineHeight: 20 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, flexWrap: 'wrap' },
  tipLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  tipText: { flex: 1, fontSize: typography.sm, lineHeight: 18 },
  infoBtn: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});
