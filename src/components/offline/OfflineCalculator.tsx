import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  History, 
  Download, 
  Trash2, 
  Copy, 
  Save,
  RefreshCw,
  WifiOff
} from 'lucide-react';
import { calculatorHistory } from '@/utils/offlineStorage';
import { usePWA } from '@/utils/pwaUtils';
import { toast } from 'sonner';

interface CalculationInputs {
  // HPP Calculator
  materialCost?: number;
  laborCost?: number;
  overheadCost?: number;
  quantity?: number;
  
  // Basic Calculator  
  value1?: number;
  value2?: number;
  operation?: '+' | '-' | '*' | '/';
  
  // Profit Calculator
  cost?: number;
  sellingPrice?: number;
  margin?: number;
}

interface CalculationResult {
  type: 'hpp' | 'basic' | 'profit';
  inputs: CalculationInputs;
  result: number;
  formula: string;
  notes: string;
}

export default function OfflineCalculator() {
  const [calculationType, setCalculationType] = useState<'hpp' | 'basic' | 'profit'>('hpp');
  const [inputs, setInputs] = useState<CalculationInputs>({});
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<number | null>(null);
  const [formula, setFormula] = useState<string>('');
  const [history, setHistory] = useState(calculatorHistory.getHistory());
  const [showHistory, setShowHistory] = useState(false);
  const { isOnline } = usePWA();

  // Load history on mount
  useEffect(() => {
    setHistory(calculatorHistory.getHistory());
  }, []);

  const calculateHPP = (): CalculationResult | null => {
    const { materialCost = 0, laborCost = 0, overheadCost = 0, quantity = 1 } = inputs;
    
    if (quantity <= 0) {
      toast.error('Kuantitas harus lebih dari 0');
      return null;
    }

    const totalCost = materialCost + laborCost + overheadCost;
    const hppPerUnit = totalCost / quantity;
    
    return {
      type: 'hpp',
      inputs: { materialCost, laborCost, overheadCost, quantity },
      result: hppPerUnit,
      formula: `HPP = (${materialCost} + ${laborCost} + ${overheadCost}) / ${quantity} = ${hppPerUnit.toFixed(2)}`,
      notes
    };
  };

  const calculateBasic = (): CalculationResult | null => {
    const { value1 = 0, value2 = 0, operation = '+' } = inputs;
    
    let result: number;
    let formula: string;

    switch (operation) {
      case '+':
        result = value1 + value2;
        formula = `${value1} + ${value2} = ${result}`;
        break;
      case '-':
        result = value1 - value2;
        formula = `${value1} - ${value2} = ${result}`;
        break;
      case '*':
        result = value1 * value2;
        formula = `${value1} × ${value2} = ${result}`;
        break;
      case '/':
        if (value2 === 0) {
          toast.error('Tidak bisa membagi dengan nol');
          return null;
        }
        result = value1 / value2;
        formula = `${value1} ÷ ${value2} = ${result.toFixed(4)}`;
        break;
      default:
        return null;
    }

    return {
      type: 'basic',
      inputs: { value1, value2, operation },
      result,
      formula,
      notes
    };
  };

  const calculateProfit = (): CalculationResult | null => {
    const { cost = 0, sellingPrice = 0 } = inputs;
    
    if (cost <= 0 || sellingPrice <= 0) {
      toast.error('Harga modal dan harga jual harus lebih dari 0');
      return null;
    }

    const profit = sellingPrice - cost;
    const margin = (profit / sellingPrice) * 100;
    
    return {
      type: 'profit',
      inputs: { cost, sellingPrice },
      result: profit,
      formula: `Profit = ${sellingPrice} - ${cost} = ${profit.toFixed(2)} (Margin: ${margin.toFixed(2)}%)`,
      notes
    };
  };

  const handleCalculate = () => {
    let calculation: CalculationResult | null = null;

    switch (calculationType) {
      case 'hpp':
        calculation = calculateHPP();
        break;
      case 'basic':
        calculation = calculateBasic();
        break;
      case 'profit':
        calculation = calculateProfit();
        break;
    }

    if (calculation) {
      setResult(calculation.result);
      setFormula(calculation.formula);
      
      // Save to history
      const saved = calculatorHistory.addCalculation(calculation);
      if (saved) {
        setHistory(calculatorHistory.getHistory());
        toast.success('Perhitungan disimpan ke riwayat');
      }
    }
  };

  const handleClear = () => {
    setInputs({});
    setNotes('');
    setResult(null);
    setFormula('');
  };

  const loadFromHistory = (entry: any) => {
    setCalculationType(entry.type);
    setInputs(entry.inputs);
    setNotes(entry.notes || '');
    setResult(entry.result);
    setFormula(entry.formula);
    setShowHistory(false);
    toast.success('Perhitungan dimuat dari riwayat');
  };

  const deleteHistoryEntry = (id: string) => {
    calculatorHistory.removeById(id);
    setHistory(calculatorHistory.getHistory());
    toast.success('Riwayat perhitungan dihapus');
  };

  const clearAllHistory = () => {
    calculatorHistory.clear();
    setHistory([]);
    toast.success('Semua riwayat perhitungan dihapus');
  };

  const exportHistory = () => {
    const data = calculatorHistory.export();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calculator-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Riwayat perhitungan berhasil diexport');
  };

  const copyResult = () => {
    if (formula) {
      navigator.clipboard.writeText(formula);
      toast.success('Formula disalin ke clipboard');
    }
  };

  const renderHPPCalculator = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Biaya Bahan Baku</Label>
          <Input
            type="number"
            value={inputs.materialCost || ''}
            onChange={(e) => setInputs(prev => ({ ...prev, materialCost: parseFloat(e.target.value) || 0 }))}
            placeholder="0"
          />
        </div>
        <div>
          <Label>Biaya Tenaga Kerja</Label>
          <Input
            type="number"
            value={inputs.laborCost || ''}
            onChange={(e) => setInputs(prev => ({ ...prev, laborCost: parseFloat(e.target.value) || 0 }))}
            placeholder="0"
          />
        </div>
        <div>
          <Label>Biaya Overhead</Label>
          <Input
            type="number"
            value={inputs.overheadCost || ''}
            onChange={(e) => setInputs(prev => ({ ...prev, overheadCost: parseFloat(e.target.value) || 0 }))}
            placeholder="0"
          />
        </div>
        <div>
          <Label>Jumlah Unit</Label>
          <Input
            type="number"
            value={inputs.quantity || ''}
            onChange={(e) => setInputs(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 1 }))}
            placeholder="1"
          />
        </div>
      </div>
    </div>
  );

  const renderBasicCalculator = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Nilai 1</Label>
          <Input
            type="number"
            value={inputs.value1 || ''}
            onChange={(e) => setInputs(prev => ({ ...prev, value1: parseFloat(e.target.value) || 0 }))}
            placeholder="0"
          />
        </div>
        <div>
          <Label>Operasi</Label>
          <select 
            className="w-full p-2 border rounded-md"
            value={inputs.operation || '+'}
            onChange={(e) => setInputs(prev => ({ ...prev, operation: e.target.value as any }))}
          >
            <option value="+">Tambah (+)</option>
            <option value="-">Kurang (-)</option>
            <option value="*">Kali (×)</option>
            <option value="/">Bagi (÷)</option>
          </select>
        </div>
        <div>
          <Label>Nilai 2</Label>
          <Input
            type="number"
            value={inputs.value2 || ''}
            onChange={(e) => setInputs(prev => ({ ...prev, value2: parseFloat(e.target.value) || 0 }))}
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );

  const renderProfitCalculator = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Harga Modal</Label>
          <Input
            type="number"
            value={inputs.cost || ''}
            onChange={(e) => setInputs(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
            placeholder="0"
          />
        </div>
        <div>
          <Label>Harga Jual</Label>
          <Input
            type="number"
            value={inputs.sellingPrice || ''}
            onChange={(e) => setInputs(prev => ({ ...prev, sellingPrice: parseFloat(e.target.value) || 0 }))}
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Offline Status Banner */}
      {!isOnline && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm font-medium">Mode Offline - Perhitungan tersimpan lokal</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Kalkulator Offline
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
              >
                <History className="h-4 w-4 mr-1" />
                Riwayat ({history.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Calculator Type Selection */}
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'hpp', label: 'HPP Calculator' },
              { value: 'basic', label: 'Basic Calculator' },  
              { value: 'profit', label: 'Profit Calculator' }
            ].map(type => (
              <Button
                key={type.value}
                variant={calculationType === type.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCalculationType(type.value as any)}
              >
                {type.label}
              </Button>
            ))}
          </div>

          {/* Calculator Forms */}
          {calculationType === 'hpp' && renderHPPCalculator()}
          {calculationType === 'basic' && renderBasicCalculator()}
          {calculationType === 'profit' && renderProfitCalculator()}

          {/* Notes */}
          <div>
            <Label>Catatan (Opsional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan untuk perhitungan ini..."
              rows={2}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleCalculate}>
              <Calculator className="h-4 w-4 mr-1" />
              Hitung
            </Button>
            <Button variant="outline" onClick={handleClear}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            {formula && (
              <Button variant="outline" onClick={copyResult}>
                <Copy className="h-4 w-4 mr-1" />
                Salin Formula
              </Button>
            )}
          </div>

          {/* Result */}
          {result !== null && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="text-lg font-semibold text-green-800">
                    Hasil: {result.toLocaleString('id-ID')}
                  </div>
                  {formula && (
                    <div className="text-sm text-green-700 font-mono">
                      {formula}
                    </div>
                  )}
                  {notes && (
                    <div className="text-sm text-green-600">
                      Catatan: {notes}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* History Panel */}
      {showHistory && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Riwayat Perhitungan
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportHistory}>
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearAllHistory}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Hapus Semua
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {history.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Belum ada riwayat perhitungan
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((entry: any) => (
                  <Card key={entry.id} className="hover:bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">
                              {entry.type.toUpperCase()}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {new Date(entry.timestamp).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="text-sm font-mono text-gray-700">
                            {entry.formula}
                          </div>
                          {entry.notes && (
                            <div className="text-xs text-gray-600 mt-1">
                              {entry.notes}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => loadFromHistory(entry)}
                          >
                            Muat
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteHistoryEntry(entry.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
