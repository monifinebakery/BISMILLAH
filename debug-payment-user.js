// Payment Debug Script untuk User Tertentu
// Usage: Jalankan di browser console saat user login

console.log('💳 Payment Debug Script Starting...');

async function debugUserPayment() {
  // Get current user info
  const { data: { user }, error } = await window.supabase.auth.getUser();
  
  if (error || !user) {
    console.error('❌ No user found or error:', error);
    return;
  }
  
  console.log('👤 Current User:', {
    id: user.id,
    email: user.email,
    created_at: user.created_at
  });
  
  // Check all payment records for this user
  console.log('\n🔍 Checking payment records...');
  
  // 1. LINKED payments (user_id matches)
  const { data: linkedPayments, error: linkedError } = await window.supabase
    .from('user_payments')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });
  
  console.log('\n📊 LINKED Payments (user_id matches):');
  if (linkedError) {
    console.error('❌ Error:', linkedError);
  } else if (!linkedPayments?.length) {
    console.log('📭 No linked payments found');
  } else {
    linkedPayments.forEach((payment, index) => {
      console.log(`   ${index + 1}. Order: ${payment.order_id}`);
      console.log(`      Email: ${payment.email}`);
      console.log(`      Status: ${payment.payment_status}`);
      console.log(`      Paid: ${payment.is_paid}`);
      console.log(`      User ID: ${payment.user_id}`);
      console.log(`      Created: ${payment.created_at}`);
      console.log(`      Updated: ${payment.updated_at}`);
      console.log('      ---');
    });
  }
  
  // 2. UNLINKED payments by email
  const { data: unlinkedPayments, error: unlinkedError } = await window.supabase
    .from('user_payments')
    .select('*')
    .is('user_id', null)
    .eq('email', user.email)
    .order('updated_at', { ascending: false });
  
  console.log('\n📊 UNLINKED Payments (by email, no user_id):');
  if (unlinkedError) {
    console.error('❌ Error:', unlinkedError);
  } else if (!unlinkedPayments?.length) {
    console.log('📭 No unlinked payments found');
  } else {
    unlinkedPayments.forEach((payment, index) => {
      console.log(`   ${index + 1}. Order: ${payment.order_id}`);
      console.log(`      Email: ${payment.email}`);
      console.log(`      Status: ${payment.payment_status}`);
      console.log(`      Paid: ${payment.is_paid}`);
      console.log(`      User ID: ${payment.user_id} (should be null)`);
      console.log(`      Created: ${payment.created_at}`);
      console.log(`      Updated: ${payment.updated_at}`);
      console.log('      ---');
    });
  }
  
  // 3. ALL payments with similar email pattern
  const emailPrefix = user.email.split('@')[0];
  const { data: similarPayments, error: similarError } = await window.supabase
    .from('user_payments')
    .select('*')
    .ilike('email', `${emailPrefix}%`)
    .order('updated_at', { ascending: false })
    .limit(10);
  
  console.log(`\n📊 SIMILAR Email Payments (${emailPrefix}*):`);
  if (similarError) {
    console.error('❌ Error:', similarError);
  } else if (!similarPayments?.length) {
    console.log('📭 No similar payments found');
  } else {
    similarPayments.forEach((payment, index) => {
      console.log(`   ${index + 1}. Order: ${payment.order_id}`);
      console.log(`      Email: ${payment.email} ${payment.email === user.email ? '✅' : '❌'}`);
      console.log(`      Status: ${payment.payment_status}`);
      console.log(`      Paid: ${payment.is_paid}`);
      console.log(`      User ID: ${payment.user_id || 'NULL'}`);
      console.log(`      Created: ${payment.created_at}`);
      console.log('      ---');
    });
  }
  
  // 4. Analyze what usePaymentStatus would return
  console.log('\n🧮 Payment Status Analysis:');
  
  const validLinkedPayment = linkedPayments?.find(p => 
    p.is_paid === true && 
    p.payment_status === 'settled' && 
    p.user_id === user.id
  );
  
  const validUnlinkedPayment = unlinkedPayments?.find(p => 
    p.is_paid === true && 
    p.payment_status === 'settled' && 
    !p.user_id
  );
  
  console.log('   Valid Linked Payment:', !!validLinkedPayment);
  console.log('   Valid Unlinked Payment:', !!validUnlinkedPayment);
  console.log('   Should be isPaid:', !!validLinkedPayment);
  console.log('   Should show MandatoryUpgrade:', !validLinkedPayment);
  console.log('   Needs Order Linking:', !!validUnlinkedPayment && !validLinkedPayment);
  
  // 5. Recommendations
  console.log('\n💡 Recommendations:');
  
  if (validLinkedPayment) {
    console.log('✅ User has valid linked payment - should be considered PAID');
    console.log('   If still showing unpaid, check frontend caching or refresh');
  } else if (validUnlinkedPayment) {
    console.log('⚠️ User has valid payment but NOT LINKED to user_id');
    console.log('   🔧 Fix: Link payment to user');
    console.log(`   SQL: UPDATE user_payments SET user_id = '${user.id}' WHERE id = '${validUnlinkedPayment.id}';`);
  } else {
    console.log('❌ No valid payments found');
    console.log('   User needs to make payment or check payment status');
  }
  
  // 6. Quick fix functions
  console.log('\n🔧 Quick Fix Functions:');
  console.log('   linkPaymentToUser(paymentId) - Link specific payment to current user');
  console.log('   refreshPaymentStatus() - Force refresh payment hook');
  
  // Store results
  window.PAYMENT_DEBUG_RESULTS = {
    user,
    linkedPayments,
    unlinkedPayments,
    similarPayments,
    validLinkedPayment,
    validUnlinkedPayment,
    recommendations: {
      isPaid: !!validLinkedPayment,
      needsLinking: !!validUnlinkedPayment && !validLinkedPayment,
      needsPayment: !validLinkedPayment && !validUnlinkedPayment
    }
  };
  
  return window.PAYMENT_DEBUG_RESULTS;
}

// Quick fix function to link payment
window.linkPaymentToUser = async (paymentId) => {
  const { data: { user } } = await window.supabase.auth.getUser();
  if (!user) {
    console.error('❌ No user found');
    return;
  }
  
  console.log(`🔧 Linking payment ${paymentId} to user ${user.id}...`);
  
  const { data, error } = await window.supabase
    .from('user_payments')
    .update({ user_id: user.id })
    .eq('id', paymentId)
    .select('*');
  
  if (error) {
    console.error('❌ Error linking payment:', error);
  } else {
    console.log('✅ Payment linked successfully:', data[0]);
    console.log('🔄 Refreshing payment status...');
    
    // Trigger payment status refresh
    if (window.__DEBUG_PAYMENT_REFETCH__) {
      await window.__DEBUG_PAYMENT_REFETCH__();
    }
  }
};

// Quick refresh function
window.refreshPaymentStatus = async () => {
  console.log('🔄 Refreshing payment status...');
  if (window.__DEBUG_PAYMENT_REFETCH__) {
    await window.__DEBUG_PAYMENT_REFETCH__();
    console.log('✅ Payment status refreshed');
  } else {
    console.log('⚠️ Payment refetch function not available');
    console.log('   Try: window.location.reload()');
  }
};

// Auto-run
debugUserPayment().then(results => {
  console.log('\n📋 Debug completed. Results stored in: window.PAYMENT_DEBUG_RESULTS');
}).catch(error => {
  console.error('❌ Debug failed:', error);
});
