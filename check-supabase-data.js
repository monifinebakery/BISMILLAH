// Quick Supabase Database Check Script
// Run this in browser console to check actual database state

console.log('🔍 Checking Supabase Database State...');

// Function to check purchases table
const checkPurchasesTable = async () => {
  console.log('\n=== Checking Purchases Table ===');
  
  try {
    // Try to find Supabase client
    const client = window.supabase || window.__SUPABASE_CLIENT__;
    if (!client) {
      console.log('❌ Supabase client not found in window');
      return;
    }
    
    console.log('📡 Supabase client found, querying purchases...');
    
    // Get all purchases for current user
    const { data: purchases, error, count } = await client
      .from('purchases')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching purchases:', error);
      return;
    }
    
    console.log(`📊 Total purchases in database: ${count}`);
    console.log(`📋 Retrieved ${purchases?.length || 0} purchases`);
    
    if (purchases && purchases.length > 0) {
      console.log('\n📝 Sample purchases:');
      purchases.slice(0, 5).forEach((purchase, index) => {
        console.log(`  ${index + 1}. ID: ${purchase.id}`);
        console.log(`     Supplier: ${purchase.supplier}`);
        console.log(`     Status: ${purchase.status}`);
        console.log(`     Total: ${purchase.total_nilai}`);
        console.log(`     Created: ${purchase.created_at}`);
        console.log(`     ---`);
      });
    } else {
      console.log('📭 No purchases found in database');
    }
    
    // Check for recently deleted purchases (if soft delete is used)
    const { data: deletedPurchases, error: deletedError } = await client
      .from('purchases')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
      .limit(5);
    
    if (!deletedError && deletedPurchases && deletedPurchases.length > 0) {
      console.log(`🗑️ Found ${deletedPurchases.length} soft-deleted purchases`);
    }
    
    return { purchases, count };
    
  } catch (error) {
    console.error('❌ Error checking purchases table:', error);
  }
};

// Function to check financial transactions
const checkFinancialTransactions = async () => {
  console.log('\n=== Checking Financial Transactions ===');
  
  try {
    const client = window.supabase || window.__SUPABASE_CLIENT__;
    if (!client) return;
    
    const { data: transactions, error, count } = await client
      .from('financial_transactions')
      .select('*', { count: 'exact' })
      .eq('type', 'expense')
      .eq('category', 'Pembelian Bahan Baku')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Error fetching financial transactions:', error);
      return;
    }
    
    console.log(`💰 Total expense transactions for purchases: ${count}`);
    
    if (transactions && transactions.length > 0) {
      console.log('\n💳 Recent purchase-related transactions:');
      transactions.forEach((tx, index) => {
        console.log(`  ${index + 1}. ID: ${tx.id}`);
        console.log(`     Amount: ${tx.amount}`);
        console.log(`     Description: ${tx.description}`);
        console.log(`     Related Purchase: ${tx.related_id}`);
        console.log(`     Date: ${tx.date}`);
        console.log(`     ---`);
      });
    }
    
    return { transactions, count };
    
  } catch (error) {
    console.error('❌ Error checking financial transactions:', error);
  }
};

// Function to compare UI vs Database
const compareUIvsDatabase = async () => {
  console.log('\n=== Comparing UI vs Database ===');
  
  try {
    // Get purchases from database
    const dbResult = await checkPurchasesTable();
    if (!dbResult) return;
    
    // Get purchases from UI
    const uiRows = document.querySelectorAll('tbody tr');
    const uiCount = uiRows.length;
    
    console.log(`📊 Comparison:`);
    console.log(`   Database: ${dbResult.count} purchases`);
    console.log(`   UI Table: ${uiCount} rows`);
    
    if (dbResult.count !== uiCount) {
      console.log('⚠️ MISMATCH DETECTED!');
      console.log(`   Difference: ${Math.abs(dbResult.count - uiCount)} purchases`);
      
      if (dbResult.count > uiCount) {
        console.log('🔍 Database has more purchases than UI shows');
        console.log('💡 Possible causes: UI filtering, pagination, or display issues');
      } else {
        console.log('🔍 UI shows more purchases than database has');
        console.log('💡 Possible causes: Optimistic updates without actual deletion');
      }
    } else {
      console.log('✅ UI and Database counts match');
    }
    
    return {
      database: dbResult.count,
      ui: uiCount,
      matches: dbResult.count === uiCount
    };
    
  } catch (error) {
    console.error('❌ Error comparing UI vs Database:', error);
  }
};

// Function to test delete operation directly
const testDirectDelete = async (purchaseId) => {
  console.log(`\n=== Testing Direct Delete for Purchase: ${purchaseId} ===`);
  
  try {
    const client = window.supabase || window.__SUPABASE_CLIENT__;
    if (!client) {
      console.log('❌ Supabase client not found');
      return;
    }
    
    // First, check if purchase exists
    const { data: existing, error: fetchError } = await client
      .from('purchases')
      .select('*')
      .eq('id', purchaseId)
      .single();
    
    if (fetchError) {
      console.error(`❌ Error fetching purchase ${purchaseId}:`, fetchError);
      return;
    }
    
    console.log('📋 Purchase found:', existing);
    
    // Try to delete
    console.log(`🗑️ Attempting to delete purchase ${purchaseId}...`);
    const { error: deleteError } = await client
      .from('purchases')  
      .delete()
      .eq('id', purchaseId);
    
    if (deleteError) {
      console.error(`❌ Delete failed:`, deleteError);
      
      // Check if it's RLS policy issue
      if (deleteError.code === '42501' || deleteError.message.includes('policy')) {
        console.log('🚨 This looks like a Row Level Security (RLS) policy issue');
        console.log('💡 Check Supabase RLS policies for purchases table');
      }
    } else {
      console.log('✅ Direct delete successful!');
      
      // Verify deletion
      const { data: verifyData, error: verifyError } = await client
        .from('purchases')
        .select('id')
        .eq('id', purchaseId)
        .single();
      
      if (verifyError && verifyError.code === 'PGRST116') {
        console.log('✅ Verified: Purchase successfully deleted from database');
      } else {
        console.log('⚠️ Purchase still exists in database after delete attempt');
      }
    }
    
  } catch (error) {
    console.error(`❌ Error testing direct delete:`, error);
  }
};

// Main check function
const runDatabaseCheck = async () => {
  const purchasesResult = await checkPurchasesTable();
  const transactionsResult = await checkFinancialTransactions();
  const comparisonResult = await compareUIvsDatabase();
  
  console.log('\n=== SUMMARY ===');
  if (comparisonResult && !comparisonResult.matches) {
    console.log('🚨 ISSUE CONFIRMED: UI and Database are out of sync');
    console.log('💡 This explains why deletes appear to work but data remains');
    
    if (purchasesResult && purchasesResult.purchases.length > 0) {
      const sampleId = purchasesResult.purchases[0].id;
      console.log(`\n🧪 To test direct deletion, run:`);
      console.log(`window.testDirectDelete('${sampleId}')`);
    }
  } else {
    console.log('ℹ️ Database state appears normal');
  }
  
  return {
    purchases: purchasesResult,
    transactions: transactionsResult,
    comparison: comparisonResult
  };
};

// Export functions
window.databaseCheck = {
  checkPurchasesTable,
  checkFinancialTransactions,
  compareUIvsDatabase,
  testDirectDelete,
  runDatabaseCheck
};

window.testDirectDelete = testDirectDelete;

// Auto-run
runDatabaseCheck();

console.log('\n💡 Database check functions available in window.databaseCheck');
console.log('🧪 To test direct delete, use: window.testDirectDelete(\'purchase-id\')');
