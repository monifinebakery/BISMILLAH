// ProfitBreakdown.tsx - Breakdown section for profit analysis
import React from 'react';
import { ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
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
  // Neutral card styling for breakdown items
  const bg = 'bg-white';
  const text = 'text-gray-800';
  const border = 'border-gray-200';

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
    <Card className="border border-gray-200 rounded-xl bg-white">
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
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                <span className="font-medium">💰 Pemasukan</span>
                <span className="font-bold">{formatCurrency(businessMetrics?.revenue || 0)}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                <span className="font-medium">📦 Modal Bahan</span>
                <span className="font-bold">- {formatCurrency(businessMetrics?.cogs || 0)}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                <span className="font-medium">= Untung Kotor</span>
                <span className="font-bold">{formatCurrency(businessMetrics?.grossProfit || 0)}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                <span className="font-medium">💡 Biaya Operasional</span>
                <span className="font-bold">- {formatCurrency(businessMetrics?.opex || 0)}</span>
              </div>
              
              <div className={`flex justify-between items-center p-3 rounded-lg border bg-white border-gray-200`}>
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
            <div className="space-y-4 pt-4">
              {/* Modern responsive composition chart */}
              <div className="p-4 rounded-lg bg-white border border-gray-200">
                <div className="text-sm text-gray-700 mb-3 font-medium">Komposisi Bulan Ini</div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { name: 'Revenue', value: Number(businessMetrics?.revenue || 0) },
                      { name: 'COGS', value: Number(businessMetrics?.cogs || 0) },
                      { name: 'OpEx', value: Number(businessMetrics?.opex || 0) }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} tickFormatter={(v)=> new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(Number(v)||0)} />
                      <RTooltip content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const p = payload[0];
                          return (
                            <div className="rounded-md border border-gray-200 bg-white p-2 shadow-sm">
                              <div className="text-xs text-gray-500">{p?.payload?.name}</div>
                              <div className="text-sm font-semibold text-gray-900">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(p?.value)||0)}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }} />
                      <Line type="monotone" dataKey="value" stroke="#111827" strokeWidth={2.5} dot={{ r: 3, stroke: '#111827', strokeWidth: 1, fill: '#ffffff' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Compact 2x2 KPI cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white border border-gray-200">
                  <div className="text-xs text-gray-600 mb-1">Margin Kotor</div>
                  <div className="text-xl font-bold text-gray-900">
                    {(() => {
                      const rev = businessMetrics?.revenue || 0;
                      const gross = businessMetrics?.grossProfit || 0;
                      const pct = rev > 0 ? (gross / rev) * 100 : 0;
                      return `${pct.toFixed(1)}%`;
                    })()}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-white border border-gray-200">
                  <div className="text-xs text-gray-600 mb-1">Margin Bersih</div>
                  <div className="text-xl font-bold text-gray-900">
                    {(() => {
                      const rev = businessMetrics?.revenue || 0;
                      const net = businessMetrics?.netProfit || 0;
                      const pct = rev > 0 ? (net / rev) * 100 : 0;
                      return `${pct.toFixed(1)}%`;
                    })()}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-white border border-gray-200">
                  <div className="text-xs text-gray-600 mb-1">COGS % Omset</div>
                  <div className="text-xl font-bold text-gray-900">
                    {(() => {
                      const rev = businessMetrics?.revenue || 0;
                      const cogs = businessMetrics?.cogs || 0;
                      const pct = rev > 0 ? (cogs / rev) * 100 : 0;
                      return `${pct.toFixed(1)}%`;
                    })()}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-white border border-gray-200">
                  <div className="text-xs text-gray-600 mb-1">Opex % Omset</div>
                  <div className="text-xl font-bold text-gray-900">
                    {(() => {
                      const rev = businessMetrics?.revenue || 0;
                      const opex = businessMetrics?.opex || 0;
                      const pct = rev > 0 ? (opex / rev) * 100 : 0;
                      return `${pct.toFixed(1)}%`;
                    })()}
                  </div>
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
