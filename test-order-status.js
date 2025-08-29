// Test script to debug order status update issue
// Run this in the browser console on your orders page

console.log('🔧 Order Status Update Debug Test');

// Helper function to test parameter types
function testParameterPassing() {
  console.log('Testing parameter type validation...');
  
  // Test cases that might cause the "[object Object]" error
  const testCases = [
    {
      name: 'Correct parameters (strings)',
      orderId: 'some-uuid-string',
      status: 'confirmed'
    },
    {
      name: 'Object as orderId (problematic)',
      orderId: { id: 'some-uuid-string' },
      status: 'confirmed'
    },
    {
      name: 'Object as status (problematic)', 
      orderId: 'some-uuid-string',
      status: { status: 'confirmed' }
    }
  ];
  
  testCases.forEach(testCase => {
    console.log(`\n📋 Testing: ${testCase.name}`);
    console.log('- orderId type:', typeof testCase.orderId, 'value:', testCase.orderId);
    console.log('- status type:', typeof testCase.status, 'value:', testCase.status);
    
    // Simulate parameter validation from our fix
    const orderIdStr = typeof testCase.orderId === 'object' && testCase.orderId !== null && 'id' in testCase.orderId 
      ? testCase.orderId.id 
      : String(testCase.orderId);
    const statusStr = typeof testCase.status === 'object' && testCase.status !== null && 'status' in testCase.status 
      ? testCase.status.status 
      : String(testCase.status);
      
    console.log('✅ After validation - orderId:', orderIdStr, 'status:', statusStr);
  });
}

// Test the updateOrderStatus function if available
async function testUpdateOrderStatus() {
  console.log('\n🧪 Testing updateOrderStatus function...');
  
  // Check if we can access the order context
  if (typeof window !== 'undefined' && window.React) {
    console.log('React is available, checking for order context...');
    // This would need to be adapted based on how your context is exposed
  }
  
  // Test direct supabase call
  if (typeof supabase !== 'undefined') {
    try {
      console.log('Testing Supabase connection...');
      const { data: user } = await supabase.auth.getUser();
      console.log('✅ User authenticated:', !!user.user);
      
      if (user.user) {
        // Get a test order
        const { data: orders, error } = await supabase
          .from('orders')
          .select('id, status, nomor_pesanan')
          .eq('user_id', user.user.id)
          .limit(1);
          
        if (orders && orders.length > 0) {
          const testOrder = orders[0];
          console.log('📦 Found test order:', {
            id: testOrder.id,
            status: testOrder.status,
            orderNumber: testOrder.nomor_pesanan
          });
          
          // Log the types to verify they're strings
          console.log('Parameter types:', {
            orderId: typeof testOrder.id,
            userId: typeof user.user.id
          });
          
          console.log('✅ Ready for testing - parameters are correct types');
        } else {
          console.log('⚠️  No orders found for testing');
        }
      }
    } catch (error) {
      console.error('❌ Error testing Supabase:', error);
    }
  } else {
    console.log('⚠️  Supabase not available in global scope');
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Order Status Update Debug Tests\n');
  
  testParameterPassing();
  await testUpdateOrderStatus();
  
  console.log('\n✨ Tests completed! Check the logs above for any issues.');
  console.log('\n💡 If you see "[object Object]" errors, the issue is likely:');
  console.log('   1. Passing objects instead of strings to updateOrderStatus');
  console.log('   2. The parameter validation fixes should resolve this');
}

// Auto-run the tests
runTests().catch(console.error);
