// Sample Data Seeder for Profit Analysis Testing
// Run this script to add sample data for profit analysis demonstration

async function seedProfitAnalysisData() {
  console.log('🌱 SEEDING PROFIT ANALYSIS SAMPLE DATA');
  console.log('=====================================');

  // Check authentication first
  const { data: { user }, error: authError } = await window.supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('❌ User not authenticated. Please log in first.');
    return false;
  }

  console.log(`✅ User authenticated: ${user.email}`);
  console.log(`🆔 User ID: ${user.id}`);

  const results = {
    transactions: 0,
    materials: 0,
    costs: 0,
    success: false
  };

  try {
    // 1. Add Sample Financial Transactions (Income)
    console.log('\n1. 💰 Adding Sample Financial Transactions...');
    
    const sampleTransactions = [
      {
        user_id: user.id,
        type: 'income',
        amount: 500000,
        category: 'Penjualan',
        description: 'Penjualan nasi gudeg - 50 porsi',
        transaction_date: '2024-08-24'
      },
      {
        user_id: user.id,
        type: 'income', 
        amount: 350000,
        category: 'Penjualan',
        description: 'Penjualan es teh dan minuman',
        transaction_date: '2024-08-23'
      },
      {
        user_id: user.id,
        type: 'income',
        amount: 750000,
        category: 'Penjualan',
        description: 'Penjualan paket catering',
        transaction_date: '2024-08-22'
      },
      {
        user_id: user.id,
        type: 'income',
        amount: 280000,
        category: 'Penjualan',
        description: 'Penjualan gorengan dan cemilan',
        transaction_date: '2024-08-21'
      }
    ];

    for (const transaction of sampleTransactions) {
      const { error } = await window.supabase
        .from('financial_transactions')
        .insert(transaction);
      
      if (!error) {
        results.transactions++;
        console.log(`   ✅ Added: ${transaction.description} - Rp${transaction.amount.toLocaleString('id-ID')}`);
      } else {
        console.log(`   ❌ Failed: ${transaction.description} - ${error.message}`);
      }
    }

    // 2. Add Sample Materials (Bahan Baku)
    console.log('\n2. 🥘 Adding Sample Materials...');
    
    const sampleMaterials = [
      {
        user_id: user.id,
        nama_bahan: 'Beras',
        harga_satuan: 12000,
        qty: 25,
        satuan: 'kg',
        harga_rata_rata: 12000
      },
      {
        user_id: user.id,
        nama_bahan: 'Ayam',
        harga_satuan: 35000,
        qty: 10,
        satuan: 'kg',
        harga_rata_rata: 35000
      },
      {
        user_id: user.id,
        nama_bahan: 'Santan Kelapa',
        harga_satuan: 8000,
        qty: 15,
        satuan: 'liter',
        harga_rata_rata: 8000
      },
      {
        user_id: user.id,
        nama_bahan: 'Cabai',
        harga_satuan: 25000,
        qty: 5,
        satuan: 'kg',
        harga_rata_rata: 25000
      },
      {
        user_id: user.id,
        nama_bahan: 'Gula Aren',
        harga_satuan: 15000,
        qty: 8,
        satuan: 'kg',
        harga_rata_rata: 15000
      },
      {
        user_id: user.id,
        nama_bahan: 'Teh',
        harga_satuan: 20000,
        qty: 3,
        satuan: 'kg',
        harga_rata_rata: 20000
      }
    ];

    for (const material of sampleMaterials) {
      const { error } = await window.supabase
        .from('bahan_baku')
        .insert(material);
      
      if (!error) {
        results.materials++;
        console.log(`   ✅ Added: ${material.nama_bahan} - ${material.qty} ${material.satuan} @ Rp${material.harga_satuan.toLocaleString('id-ID')}`);
      } else {
        console.log(`   ❌ Failed: ${material.nama_bahan} - ${error.message}`);
      }
    }

    // 3. Add Sample Operational Costs
    console.log('\n3. 🏪 Adding Sample Operational Costs...');
    
    const sampleCosts = [
      {
        user_id: user.id,
        nama_biaya: 'Sewa Warung',
        jumlah_per_bulan: 2000000,
        jenis: 'tetap',
        'group': 'OPERASIONAL'
      },
      {
        user_id: user.id,
        nama_biaya: 'Listrik & Air',
        jumlah_per_bulan: 500000,
        jenis: 'tetap',
        'group': 'OPERASIONAL'
      },
      {
        user_id: user.id,
        nama_biaya: 'Gaji Karyawan',
        jumlah_per_bulan: 3000000,
        jenis: 'tetap',
        'group': 'OPERASIONAL'
      },
      {
        user_id: user.id,
        nama_biaya: 'Gas LPG',
        jumlah_per_bulan: 300000,
        jenis: 'variabel',
        'group': 'HPP'
      },
      {
        user_id: user.id,
        nama_biaya: 'Promosi & Iklan',
        jumlah_per_bulan: 200000,
        jenis: 'variabel',
        'group': 'OPERASIONAL'
      }
    ];

    for (const cost of sampleCosts) {
      const { error } = await window.supabase
        .from('operational_costs')
        .insert(cost);
      
      if (!error) {
        results.costs++;
        console.log(`   ✅ Added: ${cost.nama_biaya} - Rp${cost.jumlah_per_bulan.toLocaleString('id-ID')}/bulan (${cost.jenis})`);
      } else {
        console.log(`   ❌ Failed: ${cost.nama_biaya} - ${error.message}`);
      }
    }

    // 4. Add Sample Usage Data (Pemakaian Bahan)
    console.log('\n4. 📊 Adding Sample Usage Data...');
    
    // Get material IDs for usage tracking
    const { data: materials } = await window.supabase
      .from('bahan_baku')
      .select('id, nama_bahan, harga_rata_rata')
      .eq('user_id', user.id);

    if (materials && materials.length > 0) {
      const sampleUsage = [
        {
          user_id: user.id,
          bahan_baku_id: materials[0].id, // Beras
          qty_base: 5,
          tanggal: '2024-08-24',
          harga_efektif: materials[0].harga_rata_rata,
          hpp_value: 5 * materials[0].harga_rata_rata
        },
        {
          user_id: user.id,
          bahan_baku_id: materials[1]?.id, // Ayam
          qty_base: 3,
          tanggal: '2024-08-24',
          harga_efektif: materials[1]?.harga_rata_rata,
          hpp_value: 3 * (materials[1]?.harga_rata_rata || 0)
        }
      ];

      for (const usage of sampleUsage) {
        if (usage.bahan_baku_id) {
          const { error } = await window.supabase
            .from('pemakaian_bahan')
            .insert(usage);
          
          if (!error) {
            console.log(`   ✅ Added usage: ${usage.qty_base} units - Rp${usage.hpp_value?.toLocaleString('id-ID')}`);
          } else {
            console.log(`   ❌ Usage failed: ${error.message}`);
          }
        }
      }
    }

    // 5. Summary
    console.log('\n5. 📋 Seeding Summary...');
    console.log(`   Transactions added: ${results.transactions}/${sampleTransactions.length}`);
    console.log(`   Materials added: ${results.materials}/${sampleMaterials.length}`);
    console.log(`   Costs added: ${results.costs}/${sampleCosts.length}`);
    
    const totalExpected = sampleTransactions.length + sampleMaterials.length + sampleCosts.length;
    const totalAdded = results.transactions + results.materials + results.costs;
    
    results.success = totalAdded >= (totalExpected * 0.8); // 80% success rate
    
    console.log(`   Overall success: ${results.success ? '✅' : '❌'} (${totalAdded}/${totalExpected})`);

    // 6. Next Steps
    console.log('\n6. 🎯 Next Steps...');
    if (results.success) {
      console.log('   ✅ Sample data seeded successfully!');
      console.log('   🔄 Navigate to profit analysis page: /analisis-profit');
      console.log('   📊 Expected to see data for August 2024');
      console.log('   💡 Revenue: ~Rp1,880,000');
      console.log('   💡 COGS: ~Rp405,000 (materials usage)');
      console.log('   💡 OpEx: ~Rp6,000,000/month (prorated daily)');
    } else {
      console.log('   ❌ Seeding partially failed. Check errors above.');
      console.log('   🔧 Try running diagnostic: diagnoseProfitAnalysisSystem()');
    }

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    results.success = false;
  }

  console.log('\n=====================================');
  console.log('🌱 SEEDING COMPLETE');
  console.log('=====================================');
  
  return results;
}

// Helper function to clear sample data
async function clearSampleData() {
  console.log('🧹 CLEARING SAMPLE DATA');
  console.log('=======================');
  
  const { data: { user } } = await window.supabase.auth.getUser();
  if (!user) {
    console.error('❌ User not authenticated');
    return false;
  }

  try {
    // Clear in reverse order to handle foreign keys
    await window.supabase.from('pemakaian_bahan').delete().eq('user_id', user.id);
    await window.supabase.from('operational_costs').delete().eq('user_id', user.id);
    await window.supabase.from('bahan_baku').delete().eq('user_id', user.id);
    await window.supabase.from('financial_transactions').delete().eq('user_id', user.id);
    
    console.log('✅ Sample data cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear data:', error);
    return false;
  }
}

// Export functions
window.seedProfitAnalysisData = seedProfitAnalysisData;
window.clearSampleData = clearSampleData;

console.log('🌱 Profit Analysis Data Seeder Ready!');
console.log('Usage:');
console.log('  • seedProfitAnalysisData() - Add sample data');
console.log('  • clearSampleData() - Remove all user data');
console.log('  • Run in browser console on any page of the app');