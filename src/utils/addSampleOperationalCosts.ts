// Utility to add sample operational costs for testing profit analysis
// Run this in browser console when logged in to add sample data

import { supabase } from '@/integrations/supabase/client';

export interface SampleOperationalCost {
  nama_biaya: string;
  jumlah_per_bulan: number;
  jenis: 'tetap' | 'variabel';
  status: 'aktif' | 'nonaktif';
  deskripsi?: string;
  group: 'operasional' | 'hpp';
}

const sampleCosts: SampleOperationalCost[] = [
  {
    nama_biaya: 'Gas Oven',
    jumlah_per_bulan: 500000, // Rp 500,000
    jenis: 'variabel',
    status: 'aktif',
    deskripsi: 'Biaya gas untuk oven dapur',
    group: 'operasional'
  },
  {
    nama_biaya: 'Sewa Tempat', 
    jumlah_per_bulan: 2000000, // Rp 2,000,000
    jenis: 'tetap',
    status: 'aktif',
    deskripsi: 'Sewa warung/toko bulanan',
    group: 'operasional'
  },
  {
    nama_biaya: 'Admin/Kasir',
    jumlah_per_bulan: 1500000, // Rp 1,500,000
    jenis: 'tetap', 
    status: 'aktif',
    deskripsi: 'Gaji admin dan kasir',
    group: 'operasional'
  },
  {
    nama_biaya: 'Listrik & Air',
    jumlah_per_bulan: 800000, // Rp 800,000
    jenis: 'tetap',
    status: 'aktif',
    deskripsi: 'Biaya listrik dan air bulanan',
    group: 'operasional'
  },
  {
    nama_biaya: 'Promosi & Iklan',
    jumlah_per_bulan: 300000, // Rp 300,000
    jenis: 'variabel',
    status: 'aktif', 
    deskripsi: 'Biaya marketing dan promosi',
    group: 'operasional'
  }
];

export async function addSampleOperationalCosts(): Promise<void> {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    console.log('🔐 Adding operational costs for user:', user.id);

    // Check if costs already exist
    const { data: existingCosts, error: checkError } = await supabase
      .from('operational_costs')
      .select('nama_biaya')
      .eq('user_id', user.id);
      
    if (checkError) throw checkError;
    
    if (existingCosts && existingCosts.length > 0) {
      console.log('⚠️ Some operational costs already exist:', existingCosts.map(c => c.nama_biaya));
      const proceed = confirm('Some operational costs already exist. Do you want to add more sample costs?');
      if (!proceed) return;
    }

    // Add timestamp fields
    const costsWithTimestamps = sampleCosts.map(cost => ({
      ...cost,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Insert costs
    const { data, error } = await supabase
      .from('operational_costs')
      .insert(costsWithTimestamps)
      .select();

    if (error) throw error;

    console.log('✅ Successfully added operational costs:', data);
    console.log('📊 Total monthly operational costs:', 
      sampleCosts.reduce((sum, cost) => sum + cost.jumlah_per_bulan, 0).toLocaleString('id-ID')
    );

    // Show summary
    const summary = sampleCosts.map(cost => 
      `• ${cost.nama_biaya}: Rp ${cost.jumlah_per_bulan.toLocaleString('id-ID')} (${cost.jenis})`
    ).join('\n');

    console.log('📋 Added costs:\n' + summary);
    
    alert(`✅ Berhasil menambahkan ${sampleCosts.length} biaya operasional!\n\nTotal: Rp ${sampleCosts.reduce((sum, cost) => sum + cost.jumlah_per_bulan, 0).toLocaleString('id-ID')}/bulan\n\nSilakan refresh halaman untuk melihat perubahan di profit analysis.`);

  } catch (error) {
    console.error('❌ Error adding operational costs:', error);
    alert('❌ Gagal menambahkan biaya operasional. Lihat console untuk detail error.');
  }
}

// Export for global access in browser console
(window as any).addSampleOperationalCosts = addSampleOperationalCosts;

console.log('🔧 Utility loaded! Run addSampleOperationalCosts() in console to add sample operational costs.');
