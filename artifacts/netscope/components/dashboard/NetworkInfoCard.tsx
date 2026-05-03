import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import GlassCard from '@/components/ui/GlassCard';
import { useTheme } from '@/contexts/ThemeContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { useSettings } from '@/contexts/SettingsContext';
import { typography, spacing } from '@/constants/theme';
import { InfoIcon } from '@/components/icons/Icons';

function maskValue(val: string, enabled: boolean): string {
  if (!enabled) return val;
  return val.replace(/\d+/g, '●●●');
}

interface FieldProps { label: string; value: string; onInfo?: () => void; }
function Field({ label, value, onInfo }: FieldProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{label}</Text>
        {onInfo && (
          <TouchableOpacity onPress={onInfo}>
            <InfoIcon size={12} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={[styles.fieldValue, { color: theme.textPrimary }]} numberOfLines={1}>{value || '—'}</Text>
    </View>
  );
}

export default function NetworkInfoCard() {
  const { theme } = useTheme();
  const { networkInfo } = useNetwork();
  const { settings } = useSettings();
  const mask = settings.privacyMode;

  const fields = [
    { label: 'SSID',       value: networkInfo?.ssid      || '—' },
    { label: 'Local IP',   value: maskValue(networkInfo?.localIP  || '—', mask) },
    { label: 'Public IP',  value: maskValue(networkInfo?.publicIP || '—', mask) },
    { label: 'Gateway',    value: maskValue(networkInfo?.gateway  || '—', mask) },
    { label: 'ISP',        value: networkInfo?.isp        || '—' },
    { label: 'Location',   value: networkInfo ? `${networkInfo.city}, ${networkInfo.country}` : '—' },
    { label: 'Frequency',  value: networkInfo?.frequency  || '—' },
    { label: 'ASN',        value: networkInfo?.asn        || '—' },
  ];

  return (
    <GlassCard>
      <Text style={[styles.title, { color: theme.textPrimary }]}>Network Info</Text>
      <View style={styles.grid}>
        {fields.map(f => <Field key={f.label} label={f.label} value={f.value} />)}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: typography.md, fontWeight: typography.semibold, marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  field: { width: '45%' },
  fieldHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  fieldLabel: { fontSize: typography.xs, fontWeight: typography.medium, letterSpacing: 0.5 },
  fieldValue: { fontSize: typography.sm, fontWeight: typography.semibold },
});
