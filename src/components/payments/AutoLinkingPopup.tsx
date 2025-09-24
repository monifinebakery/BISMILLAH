import React from 'react';

interface AutoLinkingPopupProps {
  isOpen?: boolean;
  onClose?: () => void;
  payments?: any[];
  onLink?: (paymentId: string) => void;
}

const AutoLinkingPopup: React.FC<AutoLinkingPopupProps> = ({
  isOpen = false,
  onClose,
  payments = [],
  onLink
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Auto Linking Payments</h3>
        <p className="text-gray-600 mb-4">This feature is under development.</p>
        <button 
          onClick={onClose}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default AutoLinkingPopup;
