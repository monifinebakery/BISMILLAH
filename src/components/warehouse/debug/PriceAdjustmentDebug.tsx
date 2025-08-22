// Debug component for manual price adjustment testing
// src/components/warehouse/debug/PriceAdjustmentDebug.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

interface PriceDebugResult {
  totalItems: number;
  itemsNeedingAdjustment: number;
  itemsWithPurchaseHistory: number;
  adjustmentResults: Array<{
    nama: string;
    kategori: string;
    oldHarga: number;
    oldWac: number;
    newHarga: number;
    newWac: number;
    method: 'purchase_history' | 'category_default';
    purchaseRecords: number;
  }>;
}

export const PriceAdjustmentDebug: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PriceDebugResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runPriceAdjustmentTest = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      logger.info('🧪 Starting manual price adjustment test');

      // Fetch current warehouse items
      const { data: items, error: itemsError } = await supabase
        .from('bahan_baku')
        .select('id, nama, kategori, harga_satuan, stok, supplier')
        .eq('user_id', user.id)
        .order('nama');

      if (itemsError) throw itemsError;

      logger.info(`📦 Found ${items.length} warehouse items`);

      // Find items needing price adjustment
      const itemsNeedingAdjustment = items.filter(item => 
        (item.harga_satuan || 0) === 0
      );

      logger.info(`⚠️ ${itemsNeedingAdjustment.length} items need price adjustment`);

      // Get purchase history
      const { data: purchases, error: purchaseError } = await supabase
        .from('purchases')
        .select('id, items, created_at, supplier')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(50);

      if (purchaseError) throw purchaseError;

      logger.info(`💰 Found ${purchases.length} completed purchases`);

      const adjustmentResults = [];
      const itemsWithPurchaseHistory = new Set();

      // Process each item needing adjustment
      for (const item of itemsNeedingAdjustment) {
        const oldHarga = item.harga_satuan || 0;
        
        let newHarga = oldHarga;
        let method: 'purchase_history' | 'category_default' = 'category_default';
        let purchaseRecords = 0;
        let totalQuantity = 0;
        let totalValue = 0;

        // Calculate average price from purchase history
        purchases.forEach(purchase => {
          if (purchase.items && Array.isArray(purchase.items)) {
            purchase.items.forEach((purchaseItem: any) => {
              const itemMatches = (
                purchaseItem.bahan_baku_id === item.id ||
                purchaseItem.bahanBakuId === item.id ||
                purchaseItem.id === item.id
              );

              if (itemMatches) {
                itemsWithPurchaseHistory.add(item.id);
                const qty = Number(
                  purchaseItem.jumlah || 
                  purchaseItem.kuantitas || 
                  purchaseItem.quantity || 0
                );
                const price = Number(
                  purchaseItem.harga_satuan || 
                  purchaseItem.hargaSatuan ||
                  purchaseItem.unit_price ||
                  purchaseItem.price || 0
                );

                if (qty > 0 && price > 0) {
                  totalQuantity += qty;
                  totalValue += qty * price;
                  purchaseRecords++;
                }
              }
            });
          }
        });

        if (totalQuantity > 0 && totalValue > 0) {
          const calculatedAvg = totalValue / totalQuantity;
          newHarga = oldHarga === 0 ? calculatedAvg : oldHarga;
          method = 'purchase_history';
        } else {
          // Category-based defaults
          const categoryDefaults: { [key: string]: number } = {
            'Daging': 50000,
            'Seafood': 40000,
            'Sayuran': 15000,
            'Buah': 20000,
            'Bumbu': 10000,
            'Minyak': 25000,
            'Tepung': 8000,
            'Gula': 12000,
            'Garam': 5000,
            'Susu': 15000,
            'Telur': 25000
          };
          
          const defaultPrice = categoryDefaults[item.kategori] || 5000;
          newHarga = oldHarga === 0 ? defaultPrice : oldHarga;
          method = 'category_default';
        }

        adjustmentResults.push({
          nama: item.nama,
          kategori: item.kategori,
          oldHarga,
          oldWac: 0, // No WAC column available
          newHarga,
          newWac: method === 'purchase_history' ? newHarga : 0,
          method,
          purchaseRecords
        });
      }

      setResult({
        totalItems: items.length,
        itemsNeedingAdjustment: itemsNeedingAdjustment.length,
        itemsWithPurchaseHistory: itemsWithPurchaseHistory.size,
        adjustmentResults
      });

      logger.info('✅ Price adjustment test completed successfully');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      logger.error('❌ Price adjustment test failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerActualAdjustment = async () => {
    if (!user?.id || !result) return;

    setIsLoading(true);
    try {
      // Apply the actual price adjustments
      for (const adjustment of result.adjustmentResults) {
        const updateData: any = {
          updated_at: new Date().toISOString()
        };

        if (adjustment.oldHarga === 0) {
          updateData.harga_satuan = adjustment.newHarga;
        }

        const { error: updateError } = await supabase
          .from('bahan_baku')
          .update(updateData)
          .eq('nama', adjustment.nama)
          .eq('user_id', user.id);

        if (updateError) {
          logger.error(`Failed to update ${adjustment.nama}:`, updateError);
        } else {
          logger.info(`✅ Updated ${adjustment.nama}: Harga: Rp ${adjustment.newHarga.toLocaleString()}`);
        }
      }

      // Re-run the test to show the results
      await runPriceAdjustmentTest();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Price Adjustment Debug Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runPriceAdjustmentTest}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Analyze Prices
          </Button>
          
          {result && result.itemsNeedingAdjustment > 0 && (
            <Button 
              onClick={triggerActualAdjustment}
              disabled={isLoading}
              variant="default"
            >
              Apply Adjustments
            </Button>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Error:</p>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{result.totalItems}</div>
                <div className="text-blue-600">Total Items</div>
              </div>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-2xl font-bold text-yellow-700">{result.itemsNeedingAdjustment}</div>
                <div className="text-yellow-600">Need Adjustment</div>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{result.itemsWithPurchaseHistory}</div>
                <div className="text-green-600">With Purchase History</div>
              </div>
            </div>

            {result.adjustmentResults.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Items Requiring Price Adjustment:</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {result.adjustmentResults.map((adjustment, index) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{adjustment.nama}</span>
                        <Badge variant={adjustment.method === 'purchase_history' ? 'default' : 'secondary'}>
                          {adjustment.method === 'purchase_history' ? 'WAC' : 'Category Default'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>Category: {adjustment.kategori}</div>
                        <div>Old: Harga Rp {adjustment.oldHarga.toLocaleString()}, WAC Rp {adjustment.oldWac.toLocaleString()}</div>
                        <div>New: Harga Rp {adjustment.newHarga.toLocaleString()}, WAC Rp {adjustment.newWac.toLocaleString()}</div>
                        {adjustment.method === 'purchase_history' && (
                          <div>Based on {adjustment.purchaseRecords} purchase records</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.itemsNeedingAdjustment === 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-medium">All items have valid prices! 🎉</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};