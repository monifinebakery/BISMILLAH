// Client-side utility to fix applied_at field issue
// This can be run from the browser console

export const callDatabaseFix = async () => {
  try {
    console.log('🔧 Calling database fix endpoint...');
    
    // Get the current Supabase URL from the environment or use the known URL
    const supabaseUrl = 'https://kewhzkfvswbimmwtpymw.supabase.co';
    const endpoint = `${supabaseUrl}/functions/v1/admin-api/fix-applied-at`;
    
    // Get the auth token from the current session
    const token = localStorage.getItem('sb-kewhzkfvswbimmwtpymw-auth-token');
    let authHeader = '';
    
    if (token) {
      try {
        const tokenData = JSON.parse(token);
        const accessToken = tokenData?.access_token;
        if (accessToken) {
          authHeader = `Bearer ${accessToken}`;
        }
      } catch (e) {
        console.warn('Could not parse auth token, proceeding without auth');
      }
    }
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtld2h6a2Z2c3diaW1td3RweW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5MzQ1MDAsImV4cCI6MjA0OTUxMDUwMH0.1u8R_MBgN3O6d0kh_K2PgVOLW_LMWRM0A5dXhGJVdUE'
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Database fix completed successfully:', result);
      
      if (result.data?.testUpdate?.stillHasAppliedAtIssue) {
        console.warn('⚠️ Applied_at issue still persists after fix');
      } else if (result.data?.testUpdate?.success) {
        console.log('🎉 Applied_at issue appears to be resolved!');
      }
      
      return result;
    } else {
      console.error('❌ Database fix failed:', result);
      return result;
    }
    
  } catch (error) {
    console.error('❌ Error calling database fix:', error);
    return { success: false, error: error.message };
  }
};

// Make it available globally for console use
if (typeof window !== 'undefined') {
  (window as any).callDatabaseFix = callDatabaseFix;
  console.log('🔧 Database fix utility loaded. Run callDatabaseFix() to execute.');
}

// Also export a simple test function
export const testPurchaseUpdate = async () => {
  try {
    console.log('🧪 Testing purchase update...');
    
    // This will test if the applied_at error still occurs
    const response = await fetch('/api/purchases/test-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    console.log('Test result:', result);
    return result;
    
  } catch (error) {
    console.error('Test failed:', error);
    return { success: false, error: error.message };
  }
};