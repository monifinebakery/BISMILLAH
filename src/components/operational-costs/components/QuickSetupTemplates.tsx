// QuickSetupTemplates.tsx - UX Enhancement for faster cost setup

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Store,
  Coffee,
  UtensilsCrossed,
  Truck,
  Package,
  ShoppingCart,
  CheckCircle,
  Plus,
  Zap
} from 'lucide-react';
import { COST_TEMPLATES, getTemplatesForBusiness, formatAmount, type CostTemplate } from '../utils/smartDefaults';
import { toast } from 'sonner';

interface QuickSetupTemplatesProps {
  onAddCosts: (costs: CostTemplate[]) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

const BUSINESS_TYPES = [
  {
    key: 'restaurant',
    name: 'Warung/Restaurant',
    icon: UtensilsCrossed,
    description: 'Makanan & minuman',
    color: 'text-red-600 bg-red-100',
    estimatedTotal: 8500000
  },
  {
    key: 'bakery',
    name: 'Toko Roti/Kue',
    icon: Coffee,
    description: 'Bakery & pastry',
    color: 'text-amber-600 bg-amber-100',
    estimatedTotal: 4200000
  },
  {
    key: 'online_shop',
    name: 'Toko Online',
    icon: ShoppingCart,
    description: 'E-commerce & marketplace',
    color: 'text-blue-600 bg-blue-100',
    estimatedTotal: 3800000
  },
  {
    key: 'general',
    name: 'Usaha Umum',
    icon: Store,
    description: 'Bisnis lainnya',
    color: 'text-gray-600 bg-gray-100',
    estimatedTotal: 4000000
  }
];

export const QuickSetupTemplates: React.FC<QuickSetupTemplatesProps> = ({
  onAddCosts,
  onClose,
  isLoading = false
}) => {
  const [selectedBusinessType, setSelectedBusinessType] = useState<string | null>(null);
  const [selectedCosts, setSelectedCosts] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);

  // Get templates for selected business type
  const availableTemplates = selectedBusinessType 
    ? getTemplatesForBusiness(selectedBusinessType)
    : [];

  // Handle business type selection
  const handleBusinessTypeSelect = (businessType: string) => {
    setSelectedBusinessType(businessType);
    // Auto-select all costs for that business type
    const templates = getTemplatesForBusiness(businessType);
    setSelectedCosts(new Set(templates.map(t => t.name)));
  };

  // Handle individual cost selection
  const toggleCostSelection = (costName: string) => {
    const newSelected = new Set(selectedCosts);
    if (newSelected.has(costName)) {
      newSelected.delete(costName);
    } else {
      newSelected.add(costName);
    }
    setSelectedCosts(newSelected);
  };

  // Handle adding selected costs
  const handleAddSelectedCosts = async () => {
    if (selectedCosts.size === 0) {
      toast.error('Pilih minimal 1 biaya untuk ditambahkan');
      return;
    }

    const costsToAdd = availableTemplates.filter(template => 
      selectedCosts.has(template.name)
    );

    setIsAdding(true);
    try {
      await onAddCosts(costsToAdd);
      toast.success(`${costsToAdd.length} biaya berhasil ditambahkan!`, {
        description: 'Setup biaya operasional selesai'
      });
      onClose();
    } catch (error) {
      toast.error('Gagal menambahkan biaya operasional');
    } finally {
      setIsAdding(false);
    }
  };

  // Calculate total for selected costs
  const totalSelectedAmount = availableTemplates
    .filter(t => selectedCosts.has(t.name))
    .reduce((sum, t) => sum + t.estimatedAmount, 0);

  if (!selectedBusinessType) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Setup Cepat Biaya Operasional
          </h3>
          <p className="text-gray-600 text-sm">
            Pilih jenis usaha Anda untuk mendapatkan template biaya yang sesuai
          </p>
        </div>

        {/* Business Type Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BUSINESS_TYPES.map((businessType) => {
            const Icon = businessType.icon;
            return (
              <Card 
                key={businessType.key}
                className="cursor-pointer hover:shadow-md transition-all hover:border-orange-300 group"
                onClick={() => handleBusinessTypeSelect(businessType.key)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${businessType.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 group-hover:text-orange-600">
                        {businessType.name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {businessType.description}
                      </p>
                      <div className="text-xs text-gray-500">
                        Est. {formatAmount(businessType.estimatedTotal)}/bulan
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info */}
        <Alert>
          <Package className="h-4 w-4" />
          <AlertDescription>
            <strong>💡 Tips:</strong> Template ini sudah disesuaikan dengan jenis usaha Anda. 
            Setelah ditambahkan, Anda bisa menyesuaikan jumlah biaya sesuai kondisi aktual.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Cost selection view
  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setSelectedBusinessType(null)}
          className="text-gray-600"
        >
          ← Kembali
        </Button>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Template Biaya - {BUSINESS_TYPES.find(bt => bt.key === selectedBusinessType)?.name}
          </h3>
          <p className="text-sm text-gray-600">
            Pilih biaya yang sesuai dengan usaha Anda
          </p>
        </div>
      </div>

      {/* Cost templates list */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {availableTemplates.map((template) => {
          const isSelected = selectedCosts.has(template.name);
          return (
            <div
              key={template.name}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                isSelected 
                  ? 'border-orange-300 bg-orange-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => toggleCostSelection(template.name)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isSelected 
                      ? 'border-orange-500 bg-orange-500' 
                      : 'border-gray-300'
                  }`}>
                    {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{template.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={template.jenis === 'tetap' ? 'default' : 'secondary'} className="text-xs">
                        {template.jenis === 'tetap' ? '📍 Tetap' : '📈 Variabel'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {template.group === 'hpp' ? '🏢 HPP' : '📈 Operasional'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    {formatAmount(template.estimatedAmount)}
                  </div>
                  <div className="text-xs text-gray-500">/bulan</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {selectedCosts.size > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-orange-900">
              {selectedCosts.size} biaya dipilih
            </span>
            <span className="font-bold text-orange-900">
              {formatAmount(totalSelectedAmount)}/bulan
            </span>
          </div>
          <p className="text-sm text-orange-700">
            Estimasi total biaya operasional bulanan
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1"
          disabled={isAdding}
        >
          Batal
        </Button>
        <Button
          type="button"
          onClick={handleAddSelectedCosts}
          className="flex-1 bg-orange-600 hover:bg-orange-700"
          disabled={selectedCosts.size === 0 || isAdding || isLoading}
        >
          {isAdding ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Menambahkan...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Tambah {selectedCosts.size} Biaya
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
