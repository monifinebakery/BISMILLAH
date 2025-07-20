// src/contexts/ActivityContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Activity } from '@/types/activity'; // Pastikan path ke tipe data Anda benar
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// --- DEPENDENCIES ---
import { useAuth } from './AuthContext';

// --- INTERFACE & CONTEXT ---
// Interface diperbarui, loading ditambahkan, dan tipe parameter addActivity disederhanakan
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

  // --- REALTIME & FETCH EFFECT ---
  // Hook ini sekarang menangani pengambilan data awal dan subscription realtime
  useEffect(() => {
    // Jangan lakukan apa pun jika pengguna belum login
    if (!session?.user?.id) {
      setLoading(false);
      setActivities([]); // Kosongkan aktivitas jika logout
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
        .limit(100); // Batasi pengambilan awal

      if (error) {
        toast.error('Gagal memuat riwayat aktivitas.');
        console.error("Error fetching activities:", error);
      } else {
        setActivities(data || []);
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
          filter: `user_id=eq.${userId}`, // Hanya dengarkan perubahan untuk user ini
        },
        (payload) => {
          console.log('Activity baru diterima via realtime:', payload);
          const newActivity = payload.new as Activity;
          
          // Tambahkan ke state dan pastikan tidak melebihi batas
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

  }, [session]); // Jalankan ulang effect ini jika sesi pengguna berubah (login/logout)


  // --- FUNGSI ---
  // Fungsi addActivity sekarang jauh lebih sederhana.
  // Tugasnya hanya mengirim data ke DB. UI akan di-update oleh listener realtime.
  const addActivity = async (activityData: Omit<Activity, 'id' | 'timestamp' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<void> => {
    if (!session) {
      console.warn("Gagal menambah aktivitas: Pengguna tidak login.");
      return;
    }

    const activityToInsert = {
      ...activityData,
      value: activityData.value ?? null,
      user_id: session.user.id,
      // 'id', 'created_at', 'updated_at' akan di-generate oleh database
    };

    const { error } = await supabase.from('activities').insert(activityToInsert);
    
    if (error) {
      // Karena ini operasi latar belakang, cukup log error.
      // Jika ingin lebih robust, bisa tampilkan toast error.
      console.error('Gagal mengirim aktivitas ke DB:', error.message);
      // toast.error('Gagal menyimpan aktivitas.'); // Opsional
    }
    // Tidak perlu `setActivities` di sini!
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