// src/components/warehouse/components/ZeroPriceFixDialog.tsx
// Debug component to fix zero prices in bahan baku

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, CheckCircle, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { diagnoseZeroPrices, fixZeroPrices, quickFixZeroPrices, type ZeroPriceDiagnostic, type FixResults } from '@/utils/fixZeroPrices';

interface ZeroPriceFixDialogProps {
  onFixComplete?: () => void;
}

export const ZeroPriceFixDialog: React.FC<ZeroPriceFixDialogProps> = ({ onFixComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [diagnostic, setDiagnostic] = useState<ZeroPriceDiagnostic | null>(null);
  const [fixResults, setFixResults] = useState<FixResults | null>(null);

  const handleDiagnose = async () => {
    setIsDiagnosing(true);
    setFixResults(null);
    
    try {
      const result = await diagnoseZeroPrices();
      setDiagnostic(result);
      
      if (result.zeroPriceItems === 0) {
        toast.success('Semua harga sudah terisi dengan benar!');
      } else {
        toast.warning(`Ditemukan ${result.zeroPriceItems} item dengan harga 0`);
      }
    } catch (error) {
      console.error('Error diagnosing:', error);
      toast.error('Gagal melakukan diagnosis: ' + (error as Error).message);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleFix = async () => {
    setIsFixing(true);
    
    try {
      const result = await fixZeroPrices();
      setFixResults(result);
      
      if (result.totalFixed > 0) {
        toast.success(`Berhasil memperbaiki ${result.totalFixed} item!`);
        onFixComplete?.();
        
        // Re-diagnose to show updated status
        const newDiagnostic = await diagnoseZeroPrices();
        setDiagnostic(newDiagnostic);
      } else {
        toast.info('Tidak ada item yang perlu diperbaiki');
      }
    } catch (error) {
      console.error('Error fixing:', error);
      toast.error('Gagal memperbaiki harga: ' + (error as Error).message);
    } finally {
      setIsFixing(false);
    }
  };

  const handleQuickFix = async () => {
    setIsDiagnosing(true);
    setIsFixing(true);
    
    try {
      const result = await quickFixZeroPrices();
      setDiagnostic(result.diagnostic);
      setFixResults(result.fixResults);
      
      if (result.fixResults.totalFixed > 0) {
        toast.success(`Quick fix berhasil! ${result.fixResults.totalFixed} item diperbaiki`);
        onFixComplete?.();
      } else {
        toast.info('Tidak ada masalah harga yang ditemukan');
      }
    } catch (error) {
      console.error('Error in quick fix:', error);
      toast.error('Quick fix gagal: ' + (error as Error).message);
    } finally {
      setIsDiagnosing(false);
      setIsFixing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50">
          <Wrench className="w-4 h-4 mr-2" />
          Fix Harga 0
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-orange-600" />
            Perbaiki Harga Bahan Baku
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleDiagnose}
              disabled={isDiagnosing || isFixing}
              variant="outline"
            >
              {isDiagnosing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <AlertTriangle className="w-4 h-4 mr-2" />
              )}
              Diagnosa
            </Button>
            
            <Button
              onClick={handleQuickFix}
              disabled={isDiagnosing || isFixing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {(isDiagnosing || isFixing) ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Quick Fix
            </Button>

            {diagnostic && diagnostic.fixableItems > 0 && (
              <Button
                onClick={handleFix}
                disabled={isDiagnosing || isFixing}
                variant="secondary"
              >
                {isFixing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Wrench className="w-4 h-4 mr-2" />
                )}
                Perbaiki Manual
              </Button>
            )}
          </div>

          {/* Diagnostic Results */}
          {diagnostic && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Hasil Diagnosis</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{diagnostic.totalItems}</div>
                  <div className="text-sm text-blue-800">Total Bahan Baku</div>
                </div>
                
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{diagnostic.zeroPriceItems}</div>
                  <div className="text-sm text-red-800">Harga = 0</div>
                </div>
                
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{diagnostic.missingWacItems}</div>
                  <div className="text-sm text-yellow-800">Tanpa WAC</div>
                </div>
                
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{diagnostic.fixableItems}</div>
                  <div className="text-sm text-green-800">Bisa Diperbaiki</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Punya riwayat pembelian:</span>
                  <Badge variant="secondary">{diagnostic.itemsWithPurchaseHistory}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Tanpa riwayat pembelian:</span>
                  <Badge variant="outline">{diagnostic.itemsWithoutPurchaseHistory}</Badge>
                </div>
              </div>

              {diagnostic.zeroPriceItems > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Ditemukan {diagnostic.zeroPriceItems} item dengan harga 0. 
                    {diagnostic.fixableItems > 0 && ` ${diagnostic.fixableItems} item bisa diperbaiki otomatis dengan menghitung WAC dari riwayat pembelian.`}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Fix Results */}
          {fixResults && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Hasil Perbaikan</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{fixResults.totalFixed}</div>
                  <div className="text-sm text-green-800">Total Diperbaiki</div>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{fixResults.fixedViaWacRecalculation}</div>
                  <div className="text-sm text-blue-800">Via WAC</div>
                </div>
                
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{fixResults.fixedViaDefaultPrice}</div>
                  <div className="text-sm text-purple-800">Harga Default</div>
                </div>
              </div>

              {fixResults.errors.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">Error yang terjadi:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {fixResults.errors.map((error, index) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {fixResults.totalFixed > 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Perbaikan berhasil! Refresh halaman untuk melihat perubahan harga.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Information */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-medium mb-2">Cara Kerja:</h4>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• <strong>Diagnosa:</strong> Menganalisis item dengan harga 0</li>
              <li>• <strong>Quick Fix:</strong> Otomatis mendiagnosa dan memperbaiki</li>
              <li>• <strong>WAC:</strong> Menghitung rata-rata tertimbang dari riwayat pembelian</li>
              <li>• <strong>Default:</strong> Memberikan harga Rp 1.000 untuk item tanpa riwayat</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};