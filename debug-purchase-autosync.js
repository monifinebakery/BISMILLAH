#!/usr/bin/env node

// Debug script for Purchase Auto-sync to Warehouse
// Run this to test if auto-sync is working correctly

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_USER_ID = 'test-user-debug'; // Replace with actual user ID if testing

async function debugPurchaseAutoSync() {
  console.log('🔍 Debug: Purchase Auto-sync to Warehouse');
  console.log('==========================================\n');

  try {
    // Step 1: Check recent purchases
    console.log('📋 Step 1: Checking recent purchases...');
    const { data: purchases, error: purchaseError } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .order('created_at', { ascending: false })
      .limit(5);

    if (purchaseError) {
      console.error('❌ Error fetching purchases:', purchaseError);
      return;
    }

    console.log(`   Found ${purchases?.length || 0} recent purchases`);
    
    if (purchases && purchases.length > 0) {
      purchases.forEach((purchase, index) => {
        console.log(`   ${index + 1}. ID: ${purchase.id}`);
        console.log(`      Supplier: ${purchase.supplier}`);
        console.log(`      Status: ${purchase.status}`);
        console.log(`      Items: ${purchase.items?.length || 0}`);
        console.log(`      Created: ${new Date(purchase.created_at).toLocaleString()}\n`);
      });
    }

    // Step 2: Check warehouse items
    console.log('📦 Step 2: Checking warehouse items...');
    const { data: warehouseItems, error: warehouseError } = await supabase
      .from('bahan_baku')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (warehouseError) {
      console.error('❌ Error fetching warehouse items:', warehouseError);
      return;
    }

    console.log(`   Found ${warehouseItems?.length || 0} warehouse items`);
    
    if (warehouseItems && warehouseItems.length > 0) {
      warehouseItems.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.nama}`);
        console.log(`      Stock: ${item.stok} ${item.satuan}`);
        console.log(`      WAC: ${item.harga_rata_rata}`);
        console.log(`      Unit Price: ${item.harga_satuan}`);
        console.log(`      Supplier: ${item.supplier || 'N/A'}`);
        console.log(`      Updated: ${new Date(item.updated_at).toLocaleString()}\n`);
      });
    }

    // Step 3: Check if any purchase items exist in warehouse
    if (purchases && purchases.length > 0 && warehouseItems && warehouseItems.length > 0) {
      console.log('🔄 Step 3: Analyzing purchase-warehouse synchronization...');
      
      const latestPurchase = purchases[0];
      console.log(`   Analyzing latest purchase: ${latestPurchase.id}`);
      
      if (latestPurchase.items && Array.isArray(latestPurchase.items)) {
        latestPurchase.items.forEach((purchaseItem, index) => {
          const itemName = purchaseItem.nama || purchaseItem.namaBarang || 'Unknown';
          const matchingWarehouseItem = warehouseItems.find(w => 
            w.nama.toLowerCase().includes(itemName.toLowerCase()) ||
            itemName.toLowerCase().includes(w.nama.toLowerCase())
          );
          
          console.log(`   Purchase Item ${index + 1}: ${itemName}`);
          console.log(`     Quantity: ${purchaseItem.quantity || purchaseItem.jumlah || 0}`);
          console.log(`     Unit Price: ${purchaseItem.unitPrice || purchaseItem.harga_per_satuan || 0}`);
          
          if (matchingWarehouseItem) {
            console.log(`     ✅ Found in warehouse: ${matchingWarehouseItem.nama}`);
            console.log(`        Warehouse Stock: ${matchingWarehouseItem.stok}`);
            console.log(`        Warehouse WAC: ${matchingWarehouseItem.harga_rata_rata}`);
          } else {
            console.log(`     ❌ NOT found in warehouse`);
          }
          console.log('');
        });
      }
    }

    // Step 4: Provide debugging recommendations
    console.log('💡 Step 4: Debugging Recommendations');
    console.log('=====================================');
    
    if (!purchases || purchases.length === 0) {
      console.log('   • No purchases found. Create a test purchase first.');
    } else if (!warehouseItems || warehouseItems.length === 0) {
      console.log('   • No warehouse items found. Auto-sync might not be working.');
      console.log('   • Check browser console for auto-sync errors when creating purchases.');
    } else {
      console.log('   • Both purchases and warehouse items exist.');
      console.log('   • Check if recent purchases have matching warehouse items.');
      console.log('   • Look for timing issues - warehouse updates might take a moment.');
    }

    console.log('\n🚀 Next Steps:');
    console.log('   1. Create a new purchase in the UI');
    console.log('   2. Check browser console for auto-sync logs');
    console.log('   3. Run this script again to see if warehouse updated');
    console.log('   4. Check the auto-sync service logs in purchaseAutoSync.ts');

  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

// Simple test to create a test purchase (optional)
async function createTestPurchase() {
  console.log('🧪 Creating test purchase for debugging...');
  
  const testPurchase = {
    user_id: TEST_USER_ID,
    supplier: 'Test Supplier Debug',
    tanggal: new Date().toISOString().split('T')[0],
    total_nilai: 25000,
    status: 'pending',
    items: [
      {
        nama: 'Test Material Debug',
        quantity: 5,
        satuan: 'kg',
        unitPrice: 5000,
        subtotal: 25000
      }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('purchases')
    .insert(testPurchase)
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating test purchase:', error);
    return null;
  }

  console.log('✅ Test purchase created:', data.id);
  return data;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--create-test')) {
    await createTestPurchase();
  }
  
  await debugPurchaseAutoSync();
}

main().catch(console.error);