#!/usr/bin/env node

// Script untuk add sample bahan_baku data untuk test chatbot
// Jalankan dengan: node add-sample-bahan-baku.cjs

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
let SUPABASE_URL = process.env.VITE_SUPABASE_URL;
let SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// If not in environment, try to read from .env files
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const envFiles = ['.env', '.env.development', '.env.local'];

  for (const envFile of envFiles) {
    try {
      const envPath = path.join(__dirname, envFile);
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');

        envContent.split('\n').forEach(line => {
          if (line.trim() && !line.startsWith('#')) {
            const [key, ...valueParts] = line.split('=');
            const value = valueParts.join('=').trim();

            if (key === 'VITE_SUPABASE_URL') SUPABASE_URL = value.replace(/['"]/g, '');
            if (key === 'VITE_SUPABASE_ANON_KEY') SUPABASE_ANON_KEY = value.replace(/['"]/g, '');
          }
        });

        if (SUPABASE_URL && SUPABASE_ANON_KEY) break;
      }
    } catch (error) {
      // Continue to next file
    }
  }
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🍞 Adding Sample Bahan Baku Data for Chatbot Testing\n');

// Sample bahan baku data
const sampleBahanBaku = [
  {
    nama: 'Tepung Terigu',
    kategori: 'Bahan Pokok',
    stok: 50,
    satuan: 'kg',
    minimum: 10,
    harga_satuan: 15000,
    supplier: 'PT. Indofood',
    user_id: '23f1793f-070f-47b3-b5e9-71e28f50070b'
  },
  {
    nama: 'Gula Pasir',
    kategori: 'Bahan Pokok',
    stok: 25,
    satuan: 'kg',
    minimum: 5,
    harga_satuan: 12000,
    supplier: 'PT. Sugar Corp',
    user_id: '23f1793f-070f-47b3-b5e9-71e28f50070b'
  },
  {
    nama: 'Telur Ayam',
    kategori: 'Bahan Pokok',
    stok: 100,
    satuan: 'butir',
    minimum: 20,
    harga_satuan: 2500,
    supplier: 'Peternak Lokal',
    user_id: '23f1793f-070f-47b3-b5e9-71e28f50070b'
  },
  {
    nama: 'Margarin',
    kategori: 'Bahan Tambahan',
    stok: 15,
    satuan: 'kg',
    minimum: 3,
    harga_satuan: 35000,
    supplier: 'PT. Blue Band',
    user_id: '23f1793f-070f-47b3-b5e9-71e28f50070b'
  },
  {
    nama: 'Ragi Instan',
    kategori: 'Bahan Tambahan',
    stok: 5,
    satuan: 'pak',
    minimum: 1,
    harga_satuan: 5000,
    supplier: 'PT. Ragi Indonesia',
    user_id: '23f1793f-070f-47b3-b5e9-71e28f50070b'
  }
];

async function addSampleData() {
  try {
    console.log('📊 Adding sample bahan baku data...\n');

    for (const bahan of sampleBahanBaku) {
      console.log(`➕ Adding: ${bahan.nama} (${bahan.stok} ${bahan.satuan})`);

      const { data, error } = await supabase
        .from('bahan_baku')
        .insert(bahan)
        .select();

      if (error) {
        console.log(`❌ Error adding ${bahan.nama}:`, error.message);
      } else {
        console.log(`✅ Added ${bahan.nama} successfully`);
      }
    }

    console.log('\n🎉 Sample data addition complete!');
    console.log('💡 Now test the chatbot with: "cek stok bahan baku"');

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

addSampleData();
