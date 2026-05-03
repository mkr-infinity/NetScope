import React, { useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { typography, spacing, radius } from '@/constants/theme';
import { exportNetworkReport, ReportData } from '@/services/pdfExportService';

interface Props {
  data: ReportData;
  label?: string;
}

export default function ToolExportButton({ data, label = 'Export PDF Report' }: Props) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handle = async () => {
    if (loading) return;
    setLoading(true);
    const result = await exportNetworkReport(data, 'pdf');
    setLoading(false);
    if (result.success) {
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    }
  };

  return (
    <TouchableOpacity onPress={handle} activeOpacity={0.85} disabled={loading}>
      <LinearGradient
        colors={done
          ? ['#00E5A0', '#00C580'] as [string, string]
          : [theme.primary, theme.accent] as [string, string]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.btn}
      >
        {loading ? (
          <ActivityIndicator size={16} color="#FFFFFF" />
        ) : (
          <Text style={styles.icon}>{done ? '✓' : '⬇'}</Text>
        )}
        <View>
          <Text style={styles.label}>{loading ? 'Generating PDF…' : done ? 'PDF Exported!' : label}</Text>
          <Text style={styles.sub}>Includes educational explanations</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: radius.xl,
  },
  icon: { fontSize: 18, color: '#FFFFFF' },
  label: { color: '#FFFFFF', fontSize: typography.sm, fontWeight: typography.bold },
  sub: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 1 },
});
