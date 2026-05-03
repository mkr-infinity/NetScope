import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { typography, spacing, radius } from '@/constants/theme';
import { HelpCircleIcon, ZapIcon } from '@/components/icons/Icons';

export interface LearnSection {
  title: string;
  items: string[];
  color: string;
}

interface ToolLearnCardProps {
  tool: string;
  tagline: string;
  sections: LearnSection[];
}

export default function ToolLearnCard({ tool, tagline, sections }: ToolLearnCardProps) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
        style={[styles.trigger, { backgroundColor: theme.bgSurface, borderColor: `${theme.primary}30` }]}
      >
        <LinearGradient
          colors={[theme.primary, theme.accent] as [string, string]}
          style={styles.triggerIcon}
        >
          <HelpCircleIcon size={14} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
        <View style={[styles.sheet, { backgroundColor: theme.bgSurface }]}>
          <View style={[styles.sheetHandle, { backgroundColor: `${theme.primary}30` }]} />

          <View style={styles.sheetHeader}>
            <LinearGradient
              colors={[theme.primary, theme.accent] as [string, string]}
              style={styles.sheetHeaderIcon}
            >
              <HelpCircleIcon size={16} color="#FFFFFF" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>Learn: {tool}</Text>
              <Text style={[styles.sheetTagline, { color: theme.textMuted }]}>{tagline}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setVisible(false)}
              style={[styles.closeBtn, { backgroundColor: `${theme.primary}12`, borderColor: `${theme.primary}20` }]}
            >
              <Text style={[styles.closeBtnText, { color: theme.primary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: `${theme.primary}15` }]} />

          <ScrollView
            contentContainerStyle={styles.sheetContent}
            showsVerticalScrollIndicator={false}
          >
            {sections.map((sec, si) => (
              <View key={si} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionDot, { backgroundColor: sec.color }]} />
                  <Text style={[styles.sectionTitle, { color: sec.color }]}>{sec.title.toUpperCase()}</Text>
                </View>
                {sec.items.map((item, ii) => (
                  <View key={ii} style={styles.itemRow}>
                    <View style={[styles.bullet, { backgroundColor: `${sec.color}60` }]} />
                    <Text style={[styles.itemText, { color: theme.textSecondary }]}>{item}</Text>
                  </View>
                ))}
              </View>
            ))}

            <LinearGradient
              colors={[`${theme.warning}12`, `${theme.warning}06`] as [string, string]}
              style={[styles.ethicalNote, { borderColor: `${theme.warning}25` }]}
            >
              <ZapIcon size={12} color={theme.warning} />
              <Text style={[styles.ethicalText, { color: theme.textSecondary }]}>
                Only use these tools on networks and systems you own or have explicit written permission to test.
              </Text>
            </LinearGradient>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  triggerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  sheetHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: { fontSize: typography.md, fontWeight: typography.bold },
  sheetTagline: { fontSize: 11, marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  closeBtnText: { fontSize: 14, fontWeight: '700', lineHeight: 18 },
  divider: { height: 1, marginHorizontal: spacing.lg, marginBottom: spacing.md },
  sheetContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md },
  section: { gap: 7 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sectionDot: { width: 6, height: 6, borderRadius: 3 },
  sectionTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingLeft: 4 },
  bullet: { width: 4, height: 4, borderRadius: 2, marginTop: 6 },
  itemText: { flex: 1, fontSize: 12, lineHeight: 18 },
  ethicalNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  ethicalText: { flex: 1, fontSize: 11, lineHeight: 16 },
});
