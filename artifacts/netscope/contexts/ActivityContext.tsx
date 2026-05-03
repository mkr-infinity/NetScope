import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ActivityEntry, ActivityType } from '@/types';
import { getActivity, saveActivity } from '@/services/storageService';
import { useSettings } from '@/contexts/SettingsContext';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

interface ActivityContextValue {
  entries: ActivityEntry[];
  unreadCount: number;
  logActivity: (type: ActivityType, title: string, detail: string, route: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  clearOldEntries: () => Promise<void>;
  clearAll: () => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}

const ActivityContext = createContext<ActivityContextValue | null>(null);

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const { settings } = useSettings();

  useEffect(() => {
    getActivity().then(loaded => {
      const pruned = loaded.filter(e => {
        const age = Date.now() - new Date(e.timestamp).getTime();
        return age < THIRTY_DAYS_MS;
      });
      setEntries(pruned);
      if (pruned.length !== loaded.length) saveActivity(pruned);
    });
  }, []);

  const logActivity = useCallback(async (
    type: ActivityType,
    title: string,
    detail: string,
    route: string,
  ) => {
    if (!settings.trackActivity) return;
    const entry: ActivityEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      title,
      detail,
      route,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setEntries(prev => {
      const next = [entry, ...prev].slice(0, 100);
      saveActivity(next);
      return next;
    });
  }, [settings.trackActivity]);

  const markAllRead = useCallback(async () => {
    setEntries(prev => {
      const next = prev.map(e => ({ ...e, read: true }));
      saveActivity(next);
      return next;
    });
  }, []);

  const clearOldEntries = useCallback(async () => {
    setEntries(prev => {
      const next = prev.filter(e => Date.now() - new Date(e.timestamp).getTime() < THIRTY_DAYS_MS);
      saveActivity(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(async () => {
    setEntries([]);
    saveActivity([]);
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    setEntries(prev => {
      const next = prev.filter(e => e.id !== id);
      saveActivity(next);
      return next;
    });
  }, []);

  const unreadCount = entries.filter(e => !e.read).length;

  return (
    <ActivityContext.Provider value={{ entries, unreadCount, logActivity, markAllRead, clearOldEntries, clearAll, deleteEntry }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error('useActivity must be used within ActivityProvider');
  return ctx;
}
