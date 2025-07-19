// src/contexts/ActivityContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Activity } from '@/types/activity'; // Pastikan path ke tipe data Anda benar
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateUUID } from '@/utils/uuid';
import { toSafeISOString, safeParseDate } from '@/utils/dateUtils';

// --- DEPENDENCIES ---
import { useAuth } from './AuthContext';

// --- INTERFACE & CONTEXT ---
interface ActivityContextType {
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

// --- CONSTANTS ---
const STORAGE_KEY = 'hpp_app_activities';

// --- PROVIDER COMPONENT ---
export const ActivityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- LOCAL STATE ---
  const [activities, setActivities] = useState<Activity[]>([]);

  // --- DEPENDENCY HOOKS ---
  const { session } = useAuth();

  // --- LOAD & SAVE EFFECTS ---
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored).map((item: any) => ({
          ...item,
          timestamp: safeParseDate(item.timestamp),
          createdAt: safeParseDate(item.createdAt),
          updatedAt: safeParseDate(item.updatedAt),
        }));
        setActivities(parsed);
      }
    } catch (error) {
      console.error("Gagal memuat aktivitas dari localStorage:", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
  }, [activities]);

  // --- FUNCTIONS ---
  const addActivity = async (activity: Omit<Activity, 'id' | 'timestamp' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    if (!session) {
      // Aktivitas tidak bisa ditambahkan jika tidak login, tapi jangan blokir UI dengan error
      console.warn("Gagal menambah aktivitas: Pengguna tidak login.");
      return;
    }

    const newActivity: Activity = {
      ...activity,
      id: generateUUID(),
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const activityToInsert = {
      id: newActivity.id,
      title: newActivity.title,
      description: newActivity.description,
      type: newActivity.type,
      value: newActivity.value ?? null,
      user_id: session.user.id,
      created_at: toSafeISOString(newActivity.createdAt),
      updated_at: toSafeISOString(newActivity.updatedAt),
    };

    const { error } = await supabase.from('activities').insert([activityToInsert]);
    if (error) {
      // Ini adalah operasi latar belakang, jadi cukup log error di konsol
      console.error('Error adding activity to DB:', error);
      // Jangan tampilkan toast error untuk ini agar tidak mengganggu pengguna
    }

    // Tambahkan ke state dan batasi jumlahnya agar tidak terlalu besar
    setActivities(prev => [newActivity, ...prev].slice(0, 100));
  };

  const value: ActivityContextType = {
    activities,
    addActivity,
  };

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
};

// --- CUSTOM HOOK ---
export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
};