#!/usr/bin/env node

// Simple script to check purchase item field structure

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPurchaseFields() {
  console.log('🔍 Debug: Purchase Item Field Structure');
  console.log('==========================================\n');

  try {
    // Get a recent purchase with items
    const { data: purchases, error } = await supabase
      .from('purchases')
      .select('*')
      .not('items', 'is', null)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      console.error('❌ Error fetching purchases:', error);
      return;
    }

    if (!purchases || purchases.length === 0) {
      console.log('📋 No purchases found with items');
      return;
    }

    console.log(`Found ${purchases.length} recent purchases with items:\n`);

    purchases.forEach((purchase, index) => {
      console.log(`🛒 Purchase ${index + 1}: ${purchase.id}`);
      console.log(`   Supplier: ${purchase.supplier}`);
      console.log(`   Status: ${purchase.status}`);
      console.log(`   Created: ${new Date(purchase.created_at).toLocaleString()}\n`);

      if (purchase.items && Array.isArray(purchase.items)) {
        console.log(`   📦 Items (${purchase.items.length}):`);
        
        purchase.items.forEach((item, itemIndex) => {
          console.log(`   ${itemIndex + 1}. Item Analysis:`);
          console.log(`      Raw item:`, JSON.stringify(item, null, 6));
          
          // Check all possible quantity field names
          const quantityFields = ['quantity', 'jumlah', 'kuantitas', 'qty', 'qty_base'];
          const unitPriceFields = ['unitPrice', 'unit_price', 'harga_per_satuan', 'harga_satuan', 'hargaSatuan'];
          const nameFields = ['nama', 'namaBarang', 'nama_barang', 'name'];
          
          console.log(`      Quantity field analysis:`);
          quantityFields.forEach(field => {
            if (field in item) {
              console.log(`        ✅ ${field}: ${item[field]} (type: ${typeof item[field]})`);
            } else {
              console.log(`        ❌ ${field}: not found`);
            }
          });
          
          console.log(`      Unit price field analysis:`);
          unitPriceFields.forEach(field => {
            if (field in item) {
              console.log(`        ✅ ${field}: ${item[field]} (type: ${typeof item[field]})`);
            } else {
              console.log(`        ❌ ${field}: not found`);
            }
          });
          
          console.log(`      Name field analysis:`);
          nameFields.forEach(field => {
            if (field in item) {
              console.log(`        ✅ ${field}: ${item[field]} (type: ${typeof item[field]})`);
            } else {
              console.log(`        ❌ ${field}: not found`);
            }
          });
          
          console.log(`      Other fields:`, Object.keys(item).filter(key => 
            ![...quantityFields, ...unitPriceFields, ...nameFields, 'subtotal', 'satuan', 'keterangan', 'bahan_baku_id', 'bahanBakuId'].includes(key)
          ));
          
          console.log('');
        });
      } else {
        console.log(`   ❌ Items field is not a valid array: ${typeof purchase.items}`);
      }
      
      console.log('----------------------------------------\n');
    });

  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

debugPurchaseFields().catch(console.error);