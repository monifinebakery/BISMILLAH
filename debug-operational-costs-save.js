// DEBUG SCRIPT: Operational Costs Save Operation
// Run this in browser console when on operational costs page to debug save issues
// Make sure you're logged in first

async function debugOperationalCostSave() {
  console.log('🔍 [DEBUG] Starting operational cost save debug...');
  
  // 1. Check authentication
  console.log('Step 1: Checking authentication...');
  const { data: { user }, error: authError } = await window.supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('❌ Authentication failed:', authError);
    return;
  }
  
  console.log('✅ User authenticated:', { id: user.id, email: user.email });
  
  // 2. Check database connectivity
  console.log('Step 2: Testing database connectivity...');
  
  try {
    const { data, error } = await window.supabase
      .from('operational_costs')
      .select('count(*)')
      .eq('user_id', user.id);
      
    if (error) {
      console.error('❌ Database connectivity failed:', error);
      return;
    }
    
    console.log('✅ Database connectivity OK:', data);
  } catch (err) {
    console.error('❌ Database connectivity error:', err);
    return;
  }
  
  // 3. Test create operation with minimal data
  console.log('Step 3: Testing create operation...');
  
  const testCost = {
    nama_biaya: 'Test Cost ' + Date.now(),
    jumlah_per_bulan: 100000,
    jenis: 'tetap',
    group: 'operasional',
    status: 'aktif',
    user_id: user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  console.log('Testing with data:', testCost);
  
  try {
    const { data: insertData, error: insertError } = await window.supabase
      .from('operational_costs')
      .insert(testCost)
      .select()
      .single();
      
    if (insertError) {
      console.error('❌ Insert failed:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
      
      // Common error analysis
      if (insertError.code === '42501') {
        console.log('🔍 Analysis: Permission denied - check RLS policies');
      } else if (insertError.code === '23505') {
        console.log('🔍 Analysis: Duplicate key violation');
      } else if (insertError.code === '23502') {
        console.log('🔍 Analysis: NOT NULL constraint violation');
      } else if (insertError.code === '42703') {
        console.log('🔍 Analysis: Column does not exist');
      }
      
      return;
    }
    
    console.log('✅ Insert successful:', insertData);
    
    // 4. Clean up - delete test record
    await window.supabase
      .from('operational_costs')
      .delete()
      .eq('id', insertData.id);
    
    console.log('✅ Test record cleaned up');
    console.log('🎉 All tests passed! The save operation should work.');
    
  } catch (err) {
    console.error('❌ Unexpected error during insert:', err);
  }
}

// 5. Check database schema
async function checkSchema() {
  console.log('🔍 [SCHEMA] Checking operational_costs table schema...');
  
  try {
    const { data, error } = await window.supabase
      .from('operational_costs')
      .select('*')
      .limit(1);
      
    if (data && data.length > 0) {
      console.log('✅ Schema check - sample record:', data[0]);
      console.log('📋 Available columns:', Object.keys(data[0]));
    } else {
      console.log('ℹ️ Table exists but no records found');
    }
  } catch (err) {
    console.error('❌ Schema check failed:', err);
  }
}

// 6. Check RLS policies
async function checkRLSPolicies() {
  console.log('🔍 [RLS] Checking Row Level Security policies...');
  
  const { data: { user } } = await window.supabase.auth.getUser();
  
  if (!user) {
    console.error('❌ No user found for RLS check');
    return;
  }
  
  // Test select permission
  try {
    const { data, error } = await window.supabase
      .from('operational_costs')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);
      
    if (error) {
      console.error('❌ RLS SELECT permission failed:', error);
    } else {
      console.log('✅ RLS SELECT permission OK');
    }
  } catch (err) {
    console.error('❌ RLS SELECT test error:', err);
  }
  
  // Test insert permission (without actually inserting)
  // This is tricky to test without side effects, so we'll rely on the main test
}

// Run all tests
console.log('🚀 Starting comprehensive operational costs debug...');
console.log('Make sure you are logged in and on the operational costs page');

// Make supabase globally available if not already
if (typeof window !== 'undefined' && !window.supabase) {
  console.log('⚠️ Supabase not found in global scope. Try running this from the app.');
}

// Export functions to global scope
window.debugOperationalCostSave = debugOperationalCostSave;
window.checkSchema = checkSchema;
window.checkRLSPolicies = checkRLSPolicies;

console.log(`
🔧 Debug functions available:
- debugOperationalCostSave() - Main debug function
- checkSchema() - Check table schema
- checkRLSPolicies() - Check permissions

Run: debugOperationalCostSave()
`);
