"use client"

import React from 'react';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatCurrency } from './utils/profitTransformers';

// Types
export interface ProfitChartProps {
  profitHistory?: any[];
  isLoading?: boolean;
  className?: string;
  effectiveCogs?: number;
  labels?: { hppLabel: string; hppHint: string };
}

// Generate realistic demo data
const DEMO_DATA = [
  { period: 'Jan', revenue: 2200000, cogs: 990000, opex: 396000, netProfit: 814000 },
  { period: 'Feb', revenue: 2800000, cogs: 1176000, opex: 448000, netProfit: 1176000 },
  { period: 'Mar', revenue: 2400000, cogs: 1152000, opex: 456000, netProfit: 792000 },
  { period: 'Apr', revenue: 3200000, cogs: 1280000, opex: 480000, netProfit: 1440000 },
  { period: 'May', revenue: 2900000, cogs: 1247000, opex: 493000, netProfit: 1160000 },
  { period: 'Jun', revenue: 3500000, cogs: 1365000, opex: 490000, netProfit: 1645000 },
];

export function ProfitChart({
  profitHistory = [],
  isLoading = false,
  className = '',
  effectiveCogs,
  labels
}: ProfitChartProps) {
  // Process data
  const chartData = React.useMemo(() => {
    if (!profitHistory || profitHistory.length === 0) {
      return DEMO_DATA;
    }
    
    return profitHistory.slice(-6).map((analysis) => {
      const revenue = analysis.revenue_data?.total || 0;
      const cogs = effectiveCogs || analysis.cogs_data?.total || 0;
      const opex = analysis.opex_data?.total || 0;
      const netProfit = revenue - cogs - opex;
      
      return {
        period: analysis.period?.slice(-3) || 'N/A', // Show only last 3 chars
        revenue,
        cogs,
        opex,
        netProfit,
      };
    });
  }, [profitHistory, effectiveCogs]);
  
  // Mobile detection
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Calculate trend
  const trend = React.useMemo(() => {
    if (chartData.length < 2) return { type: 'stable', percentage: 0 };
    
    const first = chartData[0];
    const last = chartData[chartData.length - 1];
    
    if (first.netProfit === 0) return { type: 'stable', percentage: 0 };
    
    const percentage = ((last.netProfit - first.netProfit) / Math.abs(first.netProfit)) * 100;
    const type = percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'stable';
    
    return { type, percentage: Math.abs(percentage) };
  }, [chartData]);
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-orange-500" />
          Trend Profit
        </CardTitle>
        <CardDescription>
          Perkembangan omset dan keuntungan
          {labels?.hppLabel && (
            <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
              {labels.hppLabel}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-2 sm:p-6">
        {isMobile && (
          <div className="text-xs text-orange-600 bg-orange-50 rounded px-2 py-1 mb-2 text-center">
            👈 Geser untuk melihat detail lengkap
          </div>
        )}
        
        <div className={`${isMobile ? 'overflow-x-auto' : ''}`}>
          <div className={`${isMobile ? 'min-w-[500px]' : 'w-full'}`}>
            <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 10,
                  left: 10,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="period" 
                  axisLine={false}
                  tickLine={false}
                  className={isMobile ? 'text-xs' : 'text-sm'}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => formatCurrency(value, { compact: true })}
                  className={isMobile ? 'text-xs' : 'text-sm'}
                  width={isMobile ? 45 : 60}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Revenue Line - Primary */}
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ fill: '#2563eb', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 5 }}
                  name="Omset"
                />
                
                {/* Net Profit Line - Secondary */}
                <Line
                  type="monotone"
                  dataKey="netProfit"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 4 }}
                  name="Laba Bersih"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="flex items-center gap-2 text-sm">
          {trend.type === 'up' ? (
            <>
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-green-700">
                Profit naik {trend.percentage.toFixed(1)}%
              </span>
            </>
          ) : trend.type === 'down' ? (
            <>
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-red-700">
                Profit turun {trend.percentage.toFixed(1)}%
              </span>
            </>
          ) : (
            <>
              <BarChart3 className="h-4 w-4 text-gray-600" />
              <span className="text-gray-700">Profit stabil</span>
            </>
          )}
          <span className="text-gray-500 ml-2">• {chartData.length} periode</span>
        </div>
      </CardFooter>
    </Card>
  );
}
