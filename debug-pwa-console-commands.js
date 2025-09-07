// PWA Debug Console Commands - Quick copy-paste commands for testing
console.log('🚀 PWA Debug Console Commands Loaded');

// Quick status check
window.checkPWAStatus = () => {
  console.log('📊 PWA Status Check:');
  console.log('Is PWA:', window.matchMedia('(display-mode: standalone)').matches);
  console.log('Current Path:', window.location.pathname);
  console.log('Auth User:', window.__DEBUG_AUTH_USER__ ? 'Logged in' : 'Not logged in');
  console.log('Auth Ready:', window.__DEBUG_AUTH_READY__);
  console.log('Auth Loading:', window.__DEBUG_AUTH_LOADING__);
  console.log('Payment Status:', window.__DEBUG_PAYMENT_IS_PAID__);
};

// Force redirect to main page
window.forceGoToMain = () => {
  console.log('🚀 Forcing redirect to main page...');
  window.location.href = '/';
};

// Clear everything and refresh
window.clearAndRefresh = () => {
  console.log('🗑️ Clearing all data and refreshing...');
  localStorage.clear();
  sessionStorage.clear();
  window.location.reload();
};

// Emergency bypass
window.emergencyBypass = () => {
  console.log('🆘 Activating emergency bypass...');
  sessionStorage.setItem('pwa_emergency_bypass', 'true');
  sessionStorage.setItem('pwa_emergency_bypass_time', Date.now().toString());
  window.location.href = '/';
};

// Check stuck state
window.checkStuckState = () => {
  console.log('🔍 Checking stuck state...');
  if (window.PWA_CHECK_STUCK) {
    const state = window.PWA_CHECK_STUCK();
    console.log('Stuck State:', state);
    return state;
  } else {
    console.log('⚠️ PWA_CHECK_STUCK not available');
  }
};

// Quick payment debug
window.debugPayment = async () => {
  console.log('💳 Payment Debug:');
  if (!window.supabase) {
    console.log('❌ Supabase not found');
    return;
  }
  
  const { data: { user }, error } = await window.supabase.auth.getUser();
  if (error || !user) {
    console.log('❌ User not found:', error);
    return;
  }
  
  console.log('👤 User:', user.email);
  
  // Check linked payments
  const { data: payments } = await window.supabase
    .from('user_payments')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_paid', true);
    
  console.log('💰 Linked Payments:', payments?.length || 0);
  
  // Check unlinked payments  
  const { data: unlinked } = await window.supabase
    .from('user_payments')
    .select('*')
    .is('user_id', null)
    .eq('email', user.email)
    .eq('is_paid', true);
    
  console.log('🔗 Unlinked Payments:', unlinked?.length || 0);
  
  if (unlinked?.length > 0) {
    console.log('🔧 Fix: Link payment by running linkPayment("' + unlinked[0].id + '")');
  }
};

// Link payment
window.linkPayment = async (paymentId) => {
  console.log('🔗 Linking payment:', paymentId);
  if (!window.supabase) {
    console.log('❌ Supabase not found');
    return;
  }
  
  const { data: { user } } = await window.supabase.auth.getUser();
  if (!user) {
    console.log('❌ User not found');
    return;
  }
  
  const { data, error } = await window.supabase
    .from('user_payments')
    .update({ user_id: user.id })
    .eq('id', paymentId)
    .select('*');
    
  if (error) {
    console.log('❌ Error linking payment:', error);
  } else {
    console.log('✅ Payment linked successfully:', data[0]);
    // Refresh payment status
    if (window.__DEBUG_PAYMENT_REFETCH__) {
      await window.__DEBUG_PAYMENT_REFETCH__();
    }
  }
};

// Show all available commands
window.showPWACommands = () => {
  console.log('\n🔧 Available PWA Debug Commands:');
  console.log('checkPWAStatus() - Check current PWA and auth status');
  console.log('forceGoToMain() - Force redirect to main page');
  console.log('clearAndRefresh() - Clear all data and refresh');
  console.log('emergencyBypass() - Activate emergency bypass');
  console.log('checkStuckState() - Check if PWA is stuck');
  console.log('debugPayment() - Debug payment status');
  console.log('linkPayment(id) - Link payment to user');
  console.log('showPWACommands() - Show this help');
};

// Auto-run status check
console.log('\n🚀 PWA Debug loaded! Run showPWACommands() for help');
window.checkPWAStatus();
