// Quick Fix for PGRST116 Error in Recipe Section
// Copy and paste this entire script into browser console while logged in

async function quickFixPGRST116() {
  console.log('🔧 Quick Fix: PGRST116 Error in Recipe Section');
  console.log('================================================');

  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await window.supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Please login first before running this fix.');
      return false;
    }

    console.log(`✅ User: ${user.email}`);
    console.log(`🆔 User ID: ${user.id}`);

    // Create default app_settings if missing
    console.log('\n📝 Creating default app settings...');
    
    const defaultSettings = {
      user_id: user.id,
      target_output_monthly: 1000, // Default 1000 pcs per month
      overhead_per_pcs: 0,          // Will be calculated from operational costs
      operasional_per_pcs: 0,       // Will be calculated from operational costs
    };

    const { data: settings, error: settingsError } = await window.supabase
      .from('app_settings')
      .upsert(defaultSettings, { onConflict: 'user_id' })
      .select()
      .single();

    if (settingsError) {
      console.error('❌ Failed to create app settings:', settingsError);
      return false;
    }

    console.log('✅ App settings created/updated:', settings);

    // Optional: Calculate overhead from existing operational costs
    console.log('\n💰 Checking for operational costs...');
    
    const { data: costs, error: costsError } = await window.supabase
      .from('operational_costs')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (costsError) {
      console.log('⚠️ Could not fetch operational costs:', costsError.message);
    } else if (costs && costs.length > 0) {
      // Calculate HPP and OPERASIONAL totals
      const hppTotal = costs
        .filter(cost => cost.group === 'HPP')
        .reduce((sum, cost) => sum + (Number(cost.jumlah_per_bulan) || 0), 0);
        
      const operasionalTotal = costs
        .filter(cost => cost.group === 'OPERASIONAL')
        .reduce((sum, cost) => sum + (Number(cost.jumlah_per_bulan) || 0), 0);

      const targetOutput = settings.target_output_monthly || 1000;
      const overheadPerPcs = targetOutput > 0 ? Math.round(hppTotal / targetOutput) : 0;
      const operasionalPerPcs = targetOutput > 0 ? Math.round(operasionalTotal / targetOutput) : 0;

      console.log(`💡 Found ${costs.length} operational costs`);
      console.log(`💡 HPP total: Rp ${hppTotal.toLocaleString('id-ID')}/month`);
      console.log(`💡 Operational total: Rp ${operasionalTotal.toLocaleString('id-ID')}/month`);
      console.log(`🧮 Calculated overhead per pcs: Rp ${overheadPerPcs}`);
      console.log(`🧮 Calculated operational per pcs: Rp ${operasionalPerPcs}`);

      // Update app_settings with calculated values
      if (overheadPerPcs > 0 || operasionalPerPcs > 0) {
        const { error: updateError } = await window.supabase
          .from('app_settings')
          .update({
            overhead_per_pcs: overheadPerPcs,
            operasional_per_pcs: operasionalPerPcs,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (updateError) {
          console.log('⚠️ Could not update calculated costs:', updateError.message);
        } else {
          console.log('✅ App settings updated with calculated costs');
        }
      }
    } else {
      console.log('💡 No operational costs found. You can add them later in Operational Costs section.');
    }

    console.log('\n🎉 PGRST116 Error Fix Complete!');
    console.log('▪️ Try using the recipe section again');
    console.log('▪️ The Enhanced HPP Calculator should work now');
    console.log('▪️ Add operational costs to get automatic overhead calculation');
    
    return true;

  } catch (error) {
    console.error('❌ Fix failed:', error);
    return false;
  }
}

// Run the fix
quickFixPGRST116();