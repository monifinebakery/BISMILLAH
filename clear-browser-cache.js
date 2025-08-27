// Script untuk membersihkan cache browser dan data yang mungkin menyebabkan masalah
// Jalankan di browser console atau copy-paste ke Developer Tools

console.log('🧹 Memulai pembersihan cache dan data browser...');

// 1. Clear localStorage
try {
  const localStorageKeys = Object.keys(localStorage);
  console.log('🗂️ localStorage items sebelum dibersihkan:', localStorageKeys.length);
  localStorageKeys.forEach(key => {
    console.log('  - Menghapus:', key);
  });
  localStorage.clear();
  console.log('✅ localStorage berhasil dibersihkan');
} catch (e) {
  console.error('❌ Error membersihkan localStorage:', e.message);
}

// 2. Clear sessionStorage
try {
  const sessionStorageKeys = Object.keys(sessionStorage);
  console.log('🗂️ sessionStorage items sebelum dibersihkan:', sessionStorageKeys.length);
  sessionStorageKeys.forEach(key => {
    console.log('  - Menghapus:', key);
  });
  sessionStorage.clear();
  console.log('✅ sessionStorage berhasil dibersihkan');
} catch (e) {
  console.error('❌ Error membersihkan sessionStorage:', e.message);
}

// 3. Clear IndexedDB
if ('indexedDB' in window) {
  indexedDB.databases().then(databases => {
    console.log('🗄️ IndexedDB databases ditemukan:', databases.length);
    databases.forEach(db => {
      console.log('  - Database:', db.name, 'Version:', db.version);
      const deleteReq = indexedDB.deleteDatabase(db.name);
      deleteReq.onsuccess = () => {
        console.log('✅ IndexedDB berhasil dihapus:', db.name);
      };
      deleteReq.onerror = () => {
        console.error('❌ Error menghapus IndexedDB:', db.name);
      };
    });
  }).catch(e => {
    console.error('❌ Error mengakses IndexedDB:', e.message);
  });
} else {
  console.log('❌ IndexedDB tidak didukung');
}

// 4. Unregister Service Workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('🔧 Service Workers ditemukan:', registrations.length);
    registrations.forEach((registration, index) => {
      console.log(`  - SW ${index + 1}:`, registration.scope);
      registration.unregister().then(success => {
        if (success) {
          console.log('✅ Service Worker berhasil di-unregister:', registration.scope);
        } else {
          console.error('❌ Gagal unregister Service Worker:', registration.scope);
        }
      });
    });
  });
} else {
  console.log('❌ Service Worker tidak didukung');
}

// 5. Clear Cache API
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    console.log('💾 Cache API ditemukan:', cacheNames.length);
    cacheNames.forEach(cacheName => {
      console.log('  - Cache:', cacheName);
      caches.delete(cacheName).then(success => {
        if (success) {
          console.log('✅ Cache berhasil dihapus:', cacheName);
        } else {
          console.error('❌ Gagal menghapus cache:', cacheName);
        }
      });
    });
  });
} else {
  console.log('❌ Cache API tidak didukung');
}

// 6. Clear cookies untuk domain saat ini
try {
  const cookies = document.cookie.split(';');
  console.log('🍪 Cookies ditemukan:', cookies.length);
  cookies.forEach(cookie => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    if (name) {
      console.log('  - Menghapus cookie:', name);
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
    }
  });
  console.log('✅ Cookies berhasil dibersihkan');
} catch (e) {
  console.error('❌ Error membersihkan cookies:', e.message);
}

console.log('\n🧹 Pembersihan selesai!');
console.log('\n💡 Langkah selanjutnya:');
console.log('1. Tutup semua tab aplikasi');
console.log('2. Restart browser');
console.log('3. Buka aplikasi di tab baru');
console.log('4. Jika masih bermasalah, coba mode incognito');

// 7. Reload halaman setelah pembersihan
setTimeout(() => {
  console.log('🔄 Memuat ulang halaman dalam 3 detik...');
  setTimeout(() => {
    window.location.reload(true);
  }, 3000);
}, 1000);