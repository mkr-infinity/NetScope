import React, { useEffect, createContext, useContext, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { typography, spacing, radius } from '@/constants/theme';
import { CheckCircleIcon, XCircleIcon, InfoIcon } from '@/components/icons/Icons';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function useToast() { return useContext(ToastContext); }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={id => setToasts(prev => prev.filter(t => t.id !== id))} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { top: insets.top + 10 }]} pointerEvents="box-none">
      {toasts.map(t => <ToastItem key={t.id} item={t} onDismiss={onDismiss} />)}
    </View>
  );
}

function ToastItem({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const { theme } = useTheme();
  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { stiffness: 200, damping: 20 });
    opacity.value = withTiming(1, { duration: 200 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const iconColors: Record<ToastItem['type'], string> = {
    success: theme.success, error: theme.error, info: theme.primary,
  };
  const bgColors: Record<ToastItem['type'], string> = {
    success: theme.successGlow, error: theme.errorGlow, info: theme.primaryGlow,
  };
  const Icon = item.type === 'success' ? CheckCircleIcon : item.type === 'error' ? XCircleIcon : InfoIcon;

  return (
    <Animated.View style={[animStyle, styles.toast, { backgroundColor: theme.bgSurface, borderColor: bgColors[item.type] }]}>
      <Icon size={16} color={iconColors[item.type]} />
      <Text style={[styles.message, { color: theme.textPrimary }]} numberOfLines={2}>{item.message}</Text>
      <TouchableOpacity onPress={() => onDismiss(item.id)}>
        <Text style={{ color: theme.textMuted, fontSize: 16 }}>×</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  message: {
    flex: 1,
    fontSize: typography.sm,
    fontWeight: typography.medium,
  },
});
