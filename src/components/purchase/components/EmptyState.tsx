// src/components/purchase/components/EmptyState.tsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShoppingCart, Plus, Users, FileText, Upload, Zap } from 'lucide-react';
import { SupplierDialog } from '@/components/supplier';

interface EmptyStateProps {
  onAddPurchase: () => void;
  hasSuppliers: boolean;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  onAddPurchase,
  hasSuppliers,
  className = '',
}) => {
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);

  return (
    <Card className={`relative p-16 text-center bg-gradient-to-b from-emerald-50 to-green-50 border-2 border-dashed border-emerald-200 shadow-xl overflow-hidden ${className}`}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-emerald-100 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-green-100 rounded-full opacity-20 animate-bounce" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="relative max-w-2xl mx-auto">
        {/* Enhanced Icon */}
        <div className="relative mb-8">
          <div className="mx-auto flex items-center justify-center h-24 w-24 md:h-32 md:w-32 rounded-full bg-gradient-to-br from-emerald-100 to-green-200 shadow-lg animate-bounce">
            <div className="text-4xl md:text-5xl animate-pulse">🛍️</div>
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center animate-ping">
            <Plus className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </div>
        </div>

        {/* Enhanced Main content */}
        <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
          🎆 Siap Mulai Catat Pembelian?
        </h3>
        <p className="text-base md:text-lg text-gray-600 mb-8 max-w-xl mx-auto leading-relaxed">
          Belum ada pembelian bahan baku yang tercatat. Mari mulai dengan membuat pembelian pertama dari supplier Anda!
        </p>
        
        {/* Feature highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
          {[
            { icon: '📄', name: 'Catat dari Nota' },
            { icon: '📊', name: 'Update Stok Otomatis' },
            { icon: '💰', name: 'Hitung HPP Akurat' }
          ].map((item, index) => (
            <div 
              key={item.name}
              className="flex flex-col items-center gap-2 text-sm bg-white bg-opacity-60 px-4 py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105 border border-emerald-100"
              style={{animationDelay: `${index * 150}ms`}}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium text-gray-700">{item.name}</span>
            </div>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            onClick={onAddPurchase} 
            size="lg"
            className="group bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <FileText className="h-6 w-6 mr-3 group-hover:rotate-12 transition-transform duration-300" />
            <span className="font-bold">Buat Pembelian Pertama</span>
          </Button>
        </div>

        {!hasSuppliers && (
          <>
            {/* Enhanced Warning about missing suppliers */}
            <div className="mt-8 mb-6">
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300 p-4 rounded-xl shadow-md">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="p-2 bg-yellow-400 bg-opacity-30 rounded-lg">
                    <Users className="h-5 w-5 text-yellow-600 animate-bounce" />
                  </div>
                  <div>
                    <div className="font-semibold text-yellow-800">
                      🚨 Setup Diperlukan
                    </div>
                    <div className="text-sm text-yellow-700">
                      Tambahkan supplier terlebih dahulu sebelum membuat pembelian
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => setSupplierDialogOpen(true)}
                className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Users className="h-5 w-5 mr-2 group-hover:animate-bounce" />
                <span className="font-semibold">Tambah Supplier Dulu</span>
              </Button>
            </div>

            <SupplierDialog
              open={supplierDialogOpen}
              onOpenChange={setSupplierDialogOpen}
              supplier={null}
            />
          </>
        )}
        
        <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span className="text-lg animate-bounce">💡</span>
            <span>Tip: Catat dari nota fisik untuk akurasi maksimal</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default EmptyState;
