// Debug script untuk mendiagnosis masalah akses aplikasi
// Jalankan di browser console: node debug-access-issue.js

console.log('🔍 Memulai diagnosis masalah akses aplikasi...');

// 1. Cek status server
fetch('http://localhost:5173/')
  .then(response => {
    console.log('✅ Server Status:', response.status, response.statusText);
    return response.text();
  })
  .then(html => {
    console.log('✅ HTML Response Length:', html.length);
    console.log('✅ Contains React Root:', html.includes('id="root"'));
  })
  .catch(error => {
    console.error('❌ Server Error:', error.message);
  });

// 2. Cek Supabase connection
fetch('https://kewhzkfvswbimmwtpymw.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtld2h6a2Z2c3diaW1td3RweW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MzI4MTcsImV4cCI6MjA2NjQwODgxN30.Pz3Q7ll6qHKUFkSJTvaa0Aqgk0Jh_T6G_qFTaEDn33w'
  }
})
  .then(response => {
    console.log('✅ Supabase Status:', response.status, response.statusText);
  })
  .catch(error => {
    console.error('❌ Supabase Error:', error.message);
  });

// 3. Cek localStorage dan sessionStorage
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
  console.log('✅ localStorage: Available');
} catch (e) {
  console.error('❌ localStorage: Not available -', e.message);
}

try {
  sessionStorage.setItem('test', 'test');
  sessionStorage.removeItem('test');
  console.log('✅ sessionStorage: Available');
} catch (e) {
  console.error('❌ sessionStorage: Not available -', e.message);
}

// 4. Cek Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('🔧 Service Workers:', registrations.length);
    registrations.forEach((registration, index) => {
      console.log(`  SW ${index + 1}:`, registration.scope);
    });
  });
} else {
  console.log('❌ Service Worker: Not supported');
}

// 5. Cek Network Connection
if ('connection' in navigator) {
  const connection = navigator.connection;
  console.log('🌐 Network:', {
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt
  });
} else {
  console.log('🌐 Network: Connection API not supported');
}

// 6. Cek User Agent
console.log('🖥️ User Agent:', navigator.userAgent);

// 7. Cek Current URL dan History
console.log('🔗 Current URL:', window.location.href);
console.log('🔗 History Length:', window.history.length);

console.log('\n🔍 Diagnosis selesai. Periksa hasil di atas untuk mengidentifikasi masalah.');
console.log('\n💡 Solusi yang bisa dicoba:');
console.log('1. Hard refresh: Cmd+Shift+R (Mac) atau Ctrl+Shift+R (Windows)');
console.log('2. Clear browser data: Developer Tools → Application → Clear Storage');
console.log('3. Disable service worker: Developer Tools → Application → Service Workers → Unregister');
console.log('4. Try incognito mode');
console.log('5. Check browser console for JavaScript errors');