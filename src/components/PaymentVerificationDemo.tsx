// src/components/PaymentVerificationDemo.tsx
// Demo/example component menampilkan berbagai stage payment verification
import React, { useState } from 'react';
import PaymentVerificationLoader from './PaymentVerificationLoader';
import { Button } from '@/components/ui/button';

type Stage = 'checking' | 'verifying' | 'linking' | 'complete' | 'timeout';

const PaymentVerificationDemo: React.FC = () => {
  const [currentStage, setCurrentStage] = useState<Stage>('checking');
  const [showDemo, setShowDemo] = useState(false);

  const stages: { stage: Stage; label: string }[] = [
    { stage: 'checking', label: 'Mengecek Status' },
    { stage: 'verifying', label: 'Memverifikasi Pembayaran' },
    { stage: 'linking', label: 'Menghubungkan Akun' },
    { stage: 'complete', label: 'Selesai' },
    { stage: 'timeout', label: 'Timeout' },
  ];

  if (showDemo) {
    return (
      <PaymentVerificationLoader
        stage={currentStage}
        timeout={currentStage === 'complete' ? 0 : 15000}
        onTimeout={() => {
          setCurrentStage('timeout');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-center mb-6">
          Payment Verification Loader Demo
        </h2>
        
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700">Pilih Stage:</h3>
          
          <div className="grid grid-cols-2 gap-2">
            {stages.map(({ stage, label }) => (
              <button
                key={stage}
                onClick={() => setCurrentStage(stage)}
                className={`p-3 rounded-lg border text-sm transition-colors ${
                  currentStage === stage
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <Button 
            onClick={() => setShowDemo(true)}
            className="w-full mt-6"
          >
            Demo Stage: {stages.find(s => s.stage === currentStage)?.label}
          </Button>

          <div className="text-xs text-gray-500 mt-4">
            <p className="font-semibold mb-2">Features:</p>
            <ul className="space-y-1">
              <li>• Auto progress animation</li>
              <li>• Countdown timer</li>
              <li>• Stage-specific icons & colors</li>
              <li>• Smooth transitions</li>
              <li>• Timeout handling</li>
              <li>• Modern glassmorphism design</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentVerificationDemo;
