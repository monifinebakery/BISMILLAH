// components/WebhookAutoLinkIntegration.jsx
// Komponen ringan untuk mengintegrasikan auto-linking dengan app yang sudah ada
import React from 'react';
import AutoLinkingPopup from './AutoLinkingPopup';
import { useUnlinkedPayments } from '../hooks/useUnlinkedPayments';
import { supabase } from '@/integrations/supabase/client';

const WebhookAutoLinkIntegration = ({ currentUser }) => {
  const {
    unlinkedPayments,
    isLoading,
    error,
    showAutoLinkPopup,
    setShowAutoLinkPopup,
    refetch,
    unlinkedCount
  } = useUnlinkedPayments(supabase, currentUser);

  // Return indicator untuk UI yang sudah ada
  const AutoLinkIndicator = () => {
    if (!currentUser || unlinkedCount === 0) return null;
    
    return (
      <button
        onClick={() => setShowAutoLinkPopup(true)}
        className="relative inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200 transition-colors"
        title={`${unlinkedCount} webhook payments detected and ready for auto-linking`}
      >
        <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
        🔗 {unlinkedCount}
      </button>
    );
  };

  return (
    <>
      {/* Export indicator untuk digunakan di header/navbar */}
      <WebhookAutoLinkIntegration.Indicator />
      
      {/* Auto-linking popup */}
      <AutoLinkingPopup
        isOpen={showAutoLinkPopup}
        onClose={() => setShowAutoLinkPopup(false)}
        unlinkedPayments={unlinkedPayments}
        currentUser={currentUser}
        supabaseClient={supabase}
      />
    </>
  );
};

// Export indicator sebagai static component untuk flexibility
WebhookAutoLinkIntegration.Indicator = ({ currentUser }) => {
  const { unlinkedCount } = useUnlinkedPayments(supabase, currentUser);
  
  if (!currentUser || unlinkedCount === 0) return null;
  
  return (
    <button
      onClick={() => {
        // Trigger show popup - you can customize this
        console.log('Auto-link indicator clicked');
        // You might want to dispatch an event or use a context here
      }}
      className="relative inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200 transition-colors"
      title={`${unlinkedCount} webhook payments ready for auto-linking`}
    >
      <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
      🔗 {unlinkedCount}
    </button>
  );
};

export default WebhookAutoLinkIntegration;

// ==============================================================
// INTEGRATION GUIDE untuk App.tsx yang sudah ada:
// ==============================================================

/*

1. TAMBAHKAN di PaymentContext.tsx (recommended):

import { useUnlinkedPayments } from './hooks/useUnlinkedPayments';

// Di dalam PaymentContextProvider, tambahkan:
const {
  unlinkedPayments,
  showAutoLinkPopup,
  setShowAutoLinkPopup,
  unlinkedCount
} = useUnlinkedPayments(supabase, user);

// Export dalam context value:
return (
  <PaymentContext.Provider
    value={{
      // ... existing values
      unlinkedPayments,
      showAutoLinkPopup,
      setShowAutoLinkPopup,
      unlinkedCount,
    }}
  >

2. GUNAKAN di App.tsx header (seperti yang sudah ada):

// Tambah import
import AutoLinkingPopup from '@/components/AutoLinkingPopup';

// Di dalam renderOrderLinkButton, tambahkan indikator auto-link:
{unlinkedCount > 0 && (
  <button
    onClick={() => setShowAutoLinkPopup(true)}
    className="ml-2 relative inline-flex items-center px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded"
  >
    🔗 Auto ({unlinkedCount})
  </button>
)}

// Tambahkan popup di akhir AppLayout:
<AutoLinkingPopup
  isOpen={showAutoLinkPopup}
  onClose={() => setShowAutoLinkPopup(false)}
  unlinkedPayments={unlinkedPayments}
  currentUser={currentUser}
  supabaseClient={supabase}
/>

3. ALTERNATIF: Jika tidak ingin ubah PaymentContext, bisa langsung gunakan:

import WebhookAutoLinkIntegration from '@/components/WebhookAutoLinkIntegration';

// Di AppLayout:
<WebhookAutoLinkIntegration currentUser={currentUser} />

*/