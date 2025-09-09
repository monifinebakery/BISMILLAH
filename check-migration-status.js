// Check Migration Status - Jalankan di browser console
console.log('🔍 Checking Migration Status...');

async function checkMigrationStatus() {
  try {
    // 1. Check if migrations table exists and get latest migration
    console.log('📋 Checking schema_migrations...');
    
    const { data: migrations, error: migrationError } = await supabase
      .from('supabase_migrations')
      .select('*')
      .order('version', { ascending: false })
      .limit(10);
    
    if (migrationError) {
      console.error('❌ Cannot access migrations table:', migrationError);
      
      // Try alternative migration table name
      const { data: altMigrations, error: altError } = await supabase
        .from('schema_migrations')
        .select('*')
        .order('version', { ascending: false })
        .limit(10);
        
      if (altError) {
        console.error('❌ Cannot access schema_migrations either:', altError);
      } else {
        console.log('✅ Found schema_migrations:', altMigrations);
      }
    } else {
      console.log('✅ Latest migrations:', migrations);
      
      // Check for our specific migration
      const orderWorkflowMigration = migrations.find(m => 
        m.version?.includes('20250909161445') || 
        m.version?.includes('order_workflow')
      );
      
      if (orderWorkflowMigration) {
        console.log('✅ Order workflow migration found:', orderWorkflowMigration);
      } else {
        console.warn('⚠️ Order workflow migration (20250909161445) not found');
      }
    }

    // 2. Test if RPC functions exist by calling them
    console.log('\n🔧 Testing RPC functions...');
    
    const testFunctions = [
      'get_recipe_ingredients_for_order',
      'can_complete_order', 
      'complete_order_and_deduct_stock',
      'reverse_order_completion'
    ];
    
    for (const funcName of testFunctions) {
      try {
        // Call with a dummy UUID to test if function exists
        const { data, error } = await supabase.rpc(funcName, {
          order_id: '00000000-0000-0000-0000-000000000000'
        });
        
        if (error) {
          if (error.code === '42883') {
            console.error(`❌ Function ${funcName} does not exist`);
          } else {
            console.log(`✅ Function ${funcName} exists (got expected error: ${error.message})`);
          }
        } else {
          console.log(`✅ Function ${funcName} exists and returned data`);
        }
      } catch (err) {
        console.error(`❌ Error testing ${funcName}:`, err);
      }
    }

    // 3. Check table structures
    console.log('\n📊 Checking table structures...');
    
    const requiredTables = [
      'orders',
      'bahan_baku', 
      'hpp_recipes',
      'financial_transactions',
      'pemakaian_bahan',
      'activities'
    ];
    
    for (const tableName of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(0); // Just test structure, don't fetch data
        
        if (error) {
          console.error(`❌ Table ${tableName} not accessible:`, error.message);
        } else {
          console.log(`✅ Table ${tableName} accessible`);
        }
      } catch (err) {
        console.error(`❌ Error checking table ${tableName}:`, err);
      }
    }

    console.log('\n🏁 Migration check completed.');
    console.log('\n💡 If any functions are missing, you need to:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Run the migration file: 20250909161445_order_workflow_reapply.sql');
    console.log('3. Or run: npx supabase db push (if using local development)');

  } catch (error) {
    console.error('❌ Migration check failed:', error);
  }
}

// Run the check
checkMigrationStatus();
