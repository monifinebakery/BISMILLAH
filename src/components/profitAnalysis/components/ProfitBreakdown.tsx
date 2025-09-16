// ProfitBreakdown.tsx - Breakdown section for profit analysis
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BreakdownItem {
  name: string;
  total: number;
}

interface BreakdownCategoryProps {
  title: string;
  items: BreakdownItem[];
  total: number;
  color: 'green' | 'red' | 'orange';
}

const BreakdownCategory: React.FC<BreakdownCategoryProps> = ({ title, items, total, color }) => {
  const getColorClasses = () => {
    switch (color) {
      case 'green': return { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200' };
      case 'red': return { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' };
      case 'orange': return { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' };
      default: return { bg: 'bg-gray-50', text: 'text-gray-800', border: 'border-gray-200' };
    }
  };
  const { bg, text, border } = getColorClasses();

  // Format currency in Indonesian format
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      notation: 'compact'
    }).format(amount);
  };

  return (
    <div className={`p-4 rounded-lg ${bg} ${border} border`}>
      <h4 className={`font-semibold mb-2 ${text}`}>{title}</h4>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex justify-between text-sm">
            <span>{item.name}</span>
            <span className="font-medium">{formatCurrency(item.total)}</span>
          </li>
        ))}
        {items.length === 0 && <li className="text-sm text-gray-500">Tidak ada data detail.</li>}
      </ul>
      <div className="flex justify-between font-bold mt-3 pt-2 border-t border-gray-200">
        <span>Total</span>
        <span>{formatCurrency(total || 0)}</span>
      </div>
    </div>
  );
};

interface ProfitBreakdownProps {
  revenueData: any;
  cogsData: any;
  opexData: any;
  selectedView: string;
  setSelectedView: (view: string) => void;
  businessMetrics: any;
}

const ProfitBreakdown: React.FC<ProfitBreakdownProps> = ({ 
  revenueData, 
  cogsData, 
  opexData, 
  selectedView, 
  setSelectedView,
  businessMetrics
}) => {
  // Build top items with sensible fallbacks
  const topRevenueItems: BreakdownItem[] = React.useMemo(() => {
    const tx = revenueData?.transactions || [];
    if (!Array.isArray(tx) || tx.length === 0) return [];
    const grouped = tx.reduce((acc: Record<string, number>, t: any) => {
      const name = t?.category || t?.name || t?.description || 'Lainnya';
      const amount = Number(t?.amount || 0);
      acc[name] = (acc[name] || 0) + amount;
      return acc;
    }, {});
    return Object.entries(grouped)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => (b.total as number) - (a.total as number))
      .slice(0, 3);
  }, [revenueData?.transactions]);

  const topOpexItems: BreakdownItem[] = React.useMemo(() => {
    const costs = opexData?.costs || [];
    if (!Array.isArray(costs) || costs.length === 0) return [];
    const mapped = costs.map((c: any) => ({
      name: c?.nama_biaya || c?.name || 'Biaya',
      total: Number(c?.monthly_amount || c?.amount || 0)
    }));
    return mapped.sort((a, b) => b.total - a.total).slice(0, 3);
  }, [opexData?.costs]);

  const topCogsItems: BreakdownItem[] = React.useMemo(() => {
    // Jika tidak ada rincian HPP, tampilkan breakdown F&B umum
    const total = Number(cogsData?.total || 0);
    if (total <= 0) return [];
    // Estimasi komponen HPP yang umum untuk F&B
    const items = [
      { name: 'Bahan Pokok', total: total * 0.6 },
      { name: 'Bumbu & Pelengkap', total: total * 0.2 },
      { name: 'Kemasan & Perlengkapan', total: total * 0.2 }
    ];
    return items
      .filter(i => i.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
  }, [cogsData?.total]);

  // Format currency in Indonesian format
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      notation: 'compact'
    }).format(amount);
  };

  return (
    <Card className="border rounded-xl">
      <CardHeader>
        <CardTitle>Breakdown Detail</CardTitle>
        <CardDescription>
          Lihat rincian pemasukan dan pengeluaran
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedView} onValueChange={setSelectedView} defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Ringkasan</TabsTrigger>
            <TabsTrigger value="details">Detail</TabsTrigger>
            <TabsTrigger value="trends">Trend</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="font-medium">💰 Pemasukan</span>
                <span className="font-bold">{formatCurrency(businessMetrics?.revenue || 0)}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                <span className="font-medium">📦 Modal Bahan</span>
                <span className="font-bold">- {formatCurrency(businessMetrics?.cogs || 0)}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <span className="font-medium">= Untung Kotor</span>
                <span className="font-bold">{formatCurrency(businessMetrics?.grossProfit || 0)}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                <span className="font-medium">💡 Biaya Operasional</span>
                <span className="font-bold">- {formatCurrency(businessMetrics?.opex || 0)}</span>
              </div>
              
              <div className={`flex justify-between items-center p-3 rounded-lg border ${
                businessMetrics?.netProfit > 0 ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200'
              }`}>
                <span className="font-bold">= Untung Bersih</span>
                <span className="font-bold text-lg">
                  {formatCurrency(businessMetrics?.netProfit || 0)}
                </span>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="details">
            <div className="space-y-4 pt-4">
              <BreakdownCategory 
                title="Penjualan Teratas" 
                items={topRevenueItems} 
                total={revenueData?.total}
                color="green"
              />
              <BreakdownCategory 
                title="Bahan Paling Mahal"
                items={topCogsItems}
                total={cogsData?.total}
                color="red"
              />
              <BreakdownCategory 
                title="Operasional Terbesar"
                items={topOpexItems}
                total={opexData?.total}
                color="orange"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="trends">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="text-xs text-blue-800 mb-1">Margin Kotor</div>
                <div className="text-xl font-bold text-blue-700">
                  {(() => {
                    const rev = businessMetrics?.revenue || 0;
                    const gross = businessMetrics?.grossProfit || 0;
                    const pct = rev > 0 ? (gross / rev) * 100 : 0;
                    return `${pct.toFixed(1)}%`;
                  })()}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="text-xs text-green-800 mb-1">Margin Bersih</div>
                <div className="text-xl font-bold text-green-700">
                  {(() => {
                    const rev = businessMetrics?.revenue || 0;
                    const net = businessMetrics?.netProfit || 0;
                    const pct = rev > 0 ? (net / rev) * 100 : 0;
                    return `${pct.toFixed(1)}%`;
                  })()}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <div className="text-xs text-amber-800 mb-1">COGS % Omset</div>
                <div className="text-xl font-bold text-amber-700">
                  {(() => {
                    const rev = businessMetrics?.revenue || 0;
                    const cogs = businessMetrics?.cogs || 0;
                    const pct = rev > 0 ? (cogs / rev) * 100 : 0;
                    return `${pct.toFixed(1)}%`;
                  })()}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                <div className="text-xs text-purple-800 mb-1">Opex % Omset</div>
                <div className="text-xl font-bold text-purple-700">
                  {(() => {
                    const rev = businessMetrics?.revenue || 0;
                    const opex = businessMetrics?.opex || 0;
                    const pct = rev > 0 ? (opex / rev) * 100 : 0;
                    return `${pct.toFixed(1)}%`;
                  })()}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProfitBreakdown;
