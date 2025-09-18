import React, { useState, useEffect } from 'react';
import { X, Download, Share, MoreVertical, Plus, Chrome } from 'lucide-react';
import { usePWA } from '@/utils/pwaUtils';

interface MobilePWAInstructionsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobilePWAInstructions({ isOpen, onClose }: MobilePWAInstructionsProps) {
  const [deviceType, setDeviceType] = useState<'android' | 'ios' | 'unknown'>('unknown');
  const [browserType, setBrowserType] = useState<'chrome' | 'safari' | 'firefox' | 'other'>('other');
  const { canInstall, install } = usePWA();

  useEffect(() => {
    // Detect device and browser type
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/android/.test(userAgent)) {
      setDeviceType('android');
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceType('ios');
    }

    if (/chrome/.test(userAgent) && !/edg/.test(userAgent)) {
      setBrowserType('chrome');
    } else if (/safari/.test(userAgent) && !/chrome/.test(userAgent)) {
      setBrowserType('safari');
    } else if (/firefox/.test(userAgent)) {
      setBrowserType('firefox');
    }
  }, []);

  const handleInstallClick = async () => {
    if (canInstall) {
      const success = await install();
      if (success) {
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  const renderInstructions = () => {
    if (canInstall && deviceType === 'android' && browserType === 'chrome') {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <Download className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-800">Siap untuk diinstall!</p>
              <p className="text-sm text-green-700">Chrome telah mendeteksi app ini dapat diinstall</p>
            </div>
          </div>
          
          <button
            onClick={handleInstallClick}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
          >
            <Download className="w-5 h-5" />
            Install Aplikasi
          </button>
          
          <p className="text-xs text-gray-600 text-center">
            Atau gunakan instruksi manual di bawah jika tombol tidak muncul
          </p>
        </div>
      );
    }

    // Manual instructions based on device/browser
    if (deviceType === 'android') {
      return (
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Chrome className="w-5 h-5" />
              Untuk Chrome Android:
            </h3>
            
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">1</div>
                <div>
                  <p className="font-medium">Tap menu (⋮) di pojok kanan atas</p>
                  <p className="text-sm text-gray-600">Cari ikon tiga titik vertikal</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">2</div>
                <div>
                  <p className="font-medium">Pilih "Add to Home screen" atau "Install app"</p>
                  <p className="text-sm text-gray-600">Jika ada opsi "Install app", pilih itu</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">3</div>
                <div>
                  <p className="font-medium">Konfirmasi instalasi</p>
                  <p className="text-sm text-gray-600">Tap "Install" atau "Add" untuk menyelesaikan</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>Catatan:</strong> Jika opsi "Install" tidak muncul, pastikan website sudah dimuat penuh dan coba refresh halaman.
            </p>
          </div>
        </div>
      );
    }

    if (deviceType === 'ios') {
      return (
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Untuk Safari iOS:</h3>
            
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">1</div>
                <div>
                  <p className="font-medium">Tap tombol Share (□↑) di bawah</p>
                  <p className="text-sm text-gray-600">Kotak dengan panah ke atas di toolbar Safari</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">2</div>
                <div>
                  <p className="font-medium">Scroll ke bawah dan tap "Add to Home Screen"</p>
                  <p className="text-sm text-gray-600">Ikon dengan tanda plus (+) dan rumah</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">3</div>
                <div>
                  <p className="font-medium">Tap "Add" di pojok kanan atas</p>
                  <p className="text-sm text-gray-600">Aplikasi akan ditambahkan ke home screen</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Tips:</strong> Setelah diinstall, buka dari home screen untuk pengalaman app penuh tanpa browser bar.
            </p>
          </div>
        </div>
      );
    }

    // Generic instructions
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Cara Install App:</h3>
          
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Chrome/Edge Android:</h4>
              <p className="text-sm text-gray-600">Menu (⋮) → "Add to Home screen" atau "Install app"</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Safari iOS:</h4>
              <p className="text-sm text-gray-600">Share (□↑) → "Add to Home Screen"</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Firefox Android:</h4>
              <p className="text-sm text-gray-600">Menu (⋮) → "Install" (jika tersedia)</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Browser terdeteksi:</strong> {browserType} pada {deviceType === 'unknown' ? 'perangkat tidak dikenal' : deviceType}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop that respects safe areas */}
      <div className="absolute inset-0 bg-black/50" style={{paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)'}} onClick={onClose} />
      
      {/* Centered dialog; on very small screens it behaves like a bottom sheet but stays centered within safe areas */}
      <div className="relative bg-white rounded-2xl w-[min(100vw,420px)] max-h-[min(90vh,720px)] h-auto overflow-y-auto shadow-xl m-4">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Install Aplikasi</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center">
              <Download className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Monifine</h3>
            <p className="text-gray-600">Install aplikasi untuk akses cepat dan pengalaman yang lebih baik</p>
          </div>
          
          {renderInstructions()}
          
          <div className="mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="w-full py-2 px-4 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
