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
  const topRevenueItems = revenueData?.details?.slice(0, 3) || [];
  const topCogsItems = cogsData?.details?.slice(0, 3) || [];
  const topOpexItems = opexData?.details?.slice(0, 3) || [];

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
            <div className="text-center py-8 text-gray-500">
              <p>Grafik trend akan ditampilkan di sini</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProfitBreakdown;