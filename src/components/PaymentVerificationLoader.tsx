// src/components/PaymentVerificationLoader.tsx
// Modern unified loading component untuk payment verification
import React, { useState, useEffect } from 'react';
import { Crown, Shield, CheckCircle2, CreditCard, Clock } from 'lucide-react';

interface PaymentVerificationLoaderProps {
  message?: string;
  stage?: 'checking' | 'verifying' | 'linking' | 'complete' | 'timeout';
  progress?: number;
  showProgress?: boolean;
  timeout?: number;
  onTimeout?: () => void;
}

const PaymentVerificationLoader: React.FC<PaymentVerificationLoaderProps> = ({
  message,
  stage = 'checking',
  progress = 0,
  showProgress = true,
  timeout = 15000, // 15 seconds default - mobile optimized
  onTimeout
}) => {
  const [timeLeft, setTimeLeft] = useState(Math.ceil(timeout / 1000));
  const [currentProgress, setCurrentProgress] = useState(0);

  // Auto-increment progress based on stage
  useEffect(() => {
    const progressMap = {
      'checking': 25,
      'verifying': 50,  
      'linking': 75,
      'complete': 100,
      'timeout': 0
    };

    const targetProgress = progress || progressMap[stage];
    
    if (currentProgress < targetProgress) {
      const interval = setInterval(() => {
        setCurrentProgress(prev => {
          const increment = Math.max(1, Math.floor((targetProgress - prev) / 10));
          return Math.min(targetProgress, prev + increment);
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [stage, progress, currentProgress]);

  // Countdown timer
  useEffect(() => {
    if (timeout && stage !== 'complete') {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            onTimeout?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeout, stage, onTimeout]);

  // Stage configuration
  const stageConfig = {
    checking: {
      icon: <CreditCard className="w-8 h-8 text-blue-500" />,
      title: 'Mengecek Status Pembayaran',
      subtitle: 'Memverifikasi akses premium Anda...',
      color: 'blue',
      animation: 'pulse'
    },
    verifying: {
      icon: <Shield className="w-8 h-8 text-orange-500" />,
      title: 'Memverifikasi Pembayaran',
      subtitle: 'Menghubungkan dengan sistem pembayaran...',
      color: 'orange', 
      animation: 'bounce'
    },
    linking: {
      icon: <Crown className="w-8 h-8 text-purple-500" />,
      title: 'Mengaktifkan Premium',
      subtitle: 'Menghubungkan pembayaran ke akun Anda...',
      color: 'purple',
      animation: 'spin'
    },
    complete: {
      icon: <CheckCircle2 className="w-8 h-8 text-green-500" />,
      title: 'Verifikasi Selesai!',
      subtitle: 'Akun premium telah diaktifkan',
      color: 'green',
      animation: 'none'
    },
    timeout: {
      icon: <Clock className="w-8 h-8 text-red-500" />,
      title: 'Verifikasi Timeout',
      subtitle: 'Tidak dapat memverifikasi dalam waktu yang ditentukan',
      color: 'red',
      animation: 'none'
    }
  };

  const config = stageConfig[stage];
  const shouldShowTimer = stage !== 'complete' && stage !== 'timeout' && timeout > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl">
        <div className="p-8 text-center">
          {/* Main Icon with Animation */}
          <div className={`mx-auto mb-6 relative ${config.animation === 'spin' ? 'animate-spin' : config.animation === 'bounce' ? 'animate-bounce' : config.animation === 'pulse' ? 'animate-pulse' : ''}`}>
            <div className={`w-16 h-16 bg-gradient-to-br from-${config.color}-100 to-${config.color}-200 rounded-full flex items-center justify-center`}>
              {config.icon}
            </div>
            
            {/* Pulse ring animation for active states */}
            {['checking', 'verifying', 'linking'].includes(stage) && (
              <div className={`absolute inset-0 w-16 h-16 bg-${config.color}-200 rounded-full animate-ping opacity-20`}></div>
            )}
          </div>

          {/* Title and Subtitle */}
          <h1 className={`text-xl font-bold text-gray-800 mb-2`}>
            {message || config.title}
          </h1>
          <p className="text-gray-600 mb-6">
            {config.subtitle}
          </p>

          {/* Progress Bar */}
          {showProgress && stage !== 'timeout' && (
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Progress</span>
                <span>{currentProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-2 bg-gradient-to-r from-${config.color}-400 to-${config.color}-600 transition-all duration-300 ease-out`}
                  style={{ width: `${currentProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Timer */}
          {shouldShowTimer && (
            <div className={`inline-flex items-center gap-2 px-4 py-2 bg-${config.color}-50 border border-${config.color}-200 rounded-full text-sm text-${config.color}-700`}>
              <Clock className="w-4 h-4" />
              <span>{timeLeft} detik tersisa</span>
            </div>
          )}

          {/* Success Message */}
          {stage === 'complete' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <Crown className="w-5 h-5" />
                <span className="font-semibold">Premium Active!</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {stage === 'timeout' && (
            <div className="mt-4 space-y-3">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">
                  Verifikasi memakan waktu lebih lama dari biasanya
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Coba Lagi
                </button>
                <button 
                  onClick={() => onTimeout?.()}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Lewati
                </button>
              </div>
            </div>
          )}

          {/* Loading Stages Indicator */}
          {stage !== 'timeout' && stage !== 'complete' && (
            <div className="mt-6 flex justify-center gap-2">
              {['checking', 'verifying', 'linking'].map((stageKey, index) => {
                const isActive = stage === stageKey;
                const isCompleted = ['checking', 'verifying', 'linking'].indexOf(stage) > index;
                
                return (
                  <div 
                    key={stageKey}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      isCompleted ? 'bg-green-500' : 
                      isActive ? `bg-${config.color}-500 animate-pulse` : 
                      'bg-gray-300'
                    }`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentVerificationLoader;
