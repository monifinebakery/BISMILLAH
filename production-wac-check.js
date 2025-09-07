// PRODUCTION WAC CHECK - Copy paste ke browser console di production
console.log('🚀 PRODUCTION WAC CHECK...');

async function productionWacCheck() {
  try {
    // Direct check - production should have supabase ready
    if (!window.supabase) {
      console.error('❌ Supabase not found');
      console.log('💡 Make sure you are on the actual application page');
      return;
    }
    
    console.log('✅ Supabase found!');
    
    // Get user
    const { data: { user }, error: userError } = await window.supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ Authentication failed:', userError);
      console.log('💡 Please login to your account');
      return;
    }
    
    console.log(`✅ Logged in as: ${user.email}`);
    
    // Check completed purchases
    const { data: purchases } = await window.supabase
      .from('purchases')
      .select('id, supplier, items, tanggal')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .limit(10);
    
    // Check warehouse items
    const { data: warehouse } = await window.supabase
      .from('bahan_baku')
      .select('id, nama, harga_rata_rata, stok')
      .eq('user_id', user.id)
      .limit(20);
    
    console.log(`\n📊 QUICK STATUS:`);
    console.log(`   📦 Completed purchases: ${purchases?.length || 0}`);
    console.log(`   🏪 Warehouse items: ${warehouse?.length || 0}`);
    
    if (!purchases || purchases.length === 0) {
      console.log('⚠️ No completed purchases - WAC cannot be calculated');
      return;
    }
    
    if (!warehouse || warehouse.length === 0) {
      console.log('⚠️ No warehouse items found');
      return;
    }
    
    // WAC Analysis
    const zeroWac = warehouse.filter(i => !i.harga_rata_rata || i.harga_rata_rata === 0);
    const validWac = warehouse.filter(i => i.harga_rata_rata && i.harga_rata_rata > 0);
    
    console.log(`\n💰 WAC STATUS:`);
    console.log(`   ✅ Valid WAC: ${validWac.length} items`);
    console.log(`   ❌ Zero WAC: ${zeroWac.length} items`);
    
    if (zeroWac.length > 0) {
      console.log(`\n⚠️ Items needing fix:`);
      zeroWac.slice(0, 5).forEach(item => {
        console.log(`   • ${item.nama}: WAC = ${item.harga_rata_rata || 0}`);
      });
      
      // Create fix function
      window.fixProductionWac = async () => {
        console.log(`🔄 Fixing ${zeroWac.length} items...`);
        
        let fixed = 0;
        
        for (const item of zeroWac) {
          let totalQty = 0;
          let totalValue = 0;
          
          // Calculate WAC from purchases
          purchases.forEach(purchase => {
            if (Array.isArray(purchase.items)) {
              purchase.items.forEach(pItem => {
                const itemId = pItem.bahanBakuId || pItem.bahan_baku_id || pItem.id;
                
                if (itemId === item.id) {
                  const qty = Number(pItem.kuantitas || pItem.jumlah || 0);
                  const price = Number(pItem.hargaSatuan || pItem.harga_per_satuan || pItem.harga_satuan || 0);
                  
                  if (qty > 0 && price > 0) {
                    totalQty += qty;
                    totalValue += qty * price;
                  }
                }
              });
            }
          });
          
          if (totalQty > 0) {
            const newWac = totalValue / totalQty;
            
            const { error } = await window.supabase
              .from('bahan_baku')
              .update({ harga_rata_rata: newWac })
              .eq('id', item.id)
              .eq('user_id', user.id);
            
            if (!error) {
              console.log(`✅ ${item.nama}: WAC = Rp${newWac.toLocaleString()}`);
              fixed++;
            }
          }
        }
        
        console.log(`\n🎯 Fixed ${fixed}/${zeroWac.length} items!`);
        console.log(`💡 Refresh your Profit Analysis page to see changes`);
      };
      
      console.log(`\n🔧 Run: fixProductionWac() to fix all items`);
    } else {
      console.log(`\n🎉 All WAC values are good!`);
    }
    
    const healthScore = warehouse.length > 0 ? Math.round((validWac.length / warehouse.length) * 100) : 0;
    console.log(`\n🏥 WAC Health: ${healthScore}%`);
    
  } catch (error) {
    console.error('❌ Production check failed:', error);
  }
}

// Run check
productionWacCheck();
