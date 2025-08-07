// src/contexts/ActivityContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Activity } from '@/types/activity'; 
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// --- DEPENDENCIES ---
import { useAuth } from './AuthContext';
import { safeParseDate } from '@/utils/unifiedDateUtils'; // Pastikan safeParseDate diimpor

// --- INTERFACE & CONTEXT ---
interface ActivityContextType {
  activities: Activity[];
  loading: boolean;
  addActivity: (activityData: Omit<Activity, 'id' | 'timestamp' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const ActivityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- LOCAL STATE ---
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // --- DEPENDENCY HOOKS ---
  const { session } = useAuth();

  // --- HELPER FUNCTION: Untuk transformasi data dari DB ---
  const transformActivityFromDB = (dbItem: any): Activity => ({
    id: dbItem.id,
    title: dbItem.title,
    description: dbItem.description,
    type: dbItem.type,
    value: dbItem.value,
    // PENTING: Gunakan safeParseDate untuk mengubah string ISO ke Date object
    timestamp: safeParseDate(dbItem.created_at), // Asumsi Anda menggunakan 'created_at' sebagai 'timestamp' di Activity type
    userId: dbItem.user_id,
    createdAt: safeParseDate(dbItem.created_at),
    updatedAt: safeParseDate(dbItem.updated_at),
  });


  // --- REALTIME & FETCH EFFECT ---
  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      setActivities([]); 
      return;
    }

    const userId = session.user.id;

    // 1. Fungsi untuk mengambil data awal
    const fetchInitialActivities = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100); 

      if (error) {
        toast.error('Gagal memuat riwayat aktivitas.');
        logger.error("Error fetching activities:", error);
      } else {
        // PENTING: Transformasi data setelah pengambilan awal
        setActivities(data ? data.map(transformActivityFromDB) : []);
      }
      setLoading(false);
    };

    fetchInitialActivities();

    // 2. Setup Realtime Subscription
    const channel = supabase
      .channel(`realtime-activities-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
          filter: `user_id=eq.${userId}`, 
        },
        (payload) => {
          logger.context('ActivityContext', 'Activity baru diterima via realtime:', payload);
          // PENTING: Transformasi data dari payload realtime
          const newActivity = transformActivityFromDB(payload.new);
          
          setActivities(currentActivities => 
            [newActivity, ...currentActivities].slice(0, 100)
          );
        }
      )
      .subscribe();

    // 3. Cleanup: Wajib untuk unsubscribe saat komponen tidak lagi digunakan
    return () => {
      supabase.removeChannel(channel);
    };

  }, [session]);


  // --- FUNGSI ---
  const addActivity = async (activityData: Omit<Activity, 'id' | 'timestamp' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<void> => {
    if (!session) {
      logger.warn("Gagal menambah aktivitas: Pengguna tidak login.");
      return;
    }

    const activityToInsert = {
      ...activityData,
      value: activityData.value ?? null,
      user_id: session.user.id,
    };

    const { error } = await supabase.from('activities').insert(activityToInsert);
    
    if (error) {
      logger.error('Gagal mengirim aktivitas ke DB:', error.message);
    }
  };

  const value: ActivityContextType = {
    activities,
    loading,
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