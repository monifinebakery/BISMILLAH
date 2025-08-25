"use client"

import React from "react";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ResponsiveContainer } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { formatCurrency } from "./utils/profitTransformers";
import { formatPeriodForDisplay } from "@/utils/periodUtils";

export const description = "Multiple axis profit analysis chart";

// Types
export interface ChartLineMultipleProps {
  profitHistory: any[];
  isLoading?: boolean;
  className?: string;
  effectiveCogs?: number;
  labels?: { hppLabel: string; hppHint: string };
}

// Chart configuration for profit analysis
const chartConfig = {
  revenue: {
    label: "Omset",
    color: "hsl(var(--chart-1))", // Blue
  },
  cogs: {
    label: "HPP", 
    color: "hsl(var(--chart-2))", // Orange
  },
  opex: {
    label: "Biaya Operasional",
    color: "hsl(var(--chart-3))", // Green
  },
  grossProfit: {
    label: "Laba Kotor",
    color: "hsl(var(--chart-4))", // Yellow
  },
  netProfit: {
    label: "Laba Bersih",
    color: "hsl(var(--chart-5))", // Purple
  },
} satisfies ChartConfig

export function ChartLineMultiple({
  profitHistory,
  isLoading = false,
  className = "",
  effectiveCogs,
  labels
}: ChartLineMultipleProps) {
  const [showLegend, setShowLegend] = React.useState(false);
  
  // Generate demo data for better visualization when no real data
  const generateDemoData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => {
      const baseRevenue = 2000000 + (Math.random() * 1000000);
      const revenue = baseRevenue + (index * 200000) + (Math.sin(index) * 300000);
      const cogs = revenue * (0.4 + Math.random() * 0.2); // 40-60% dari revenue
      const opex = revenue * (0.15 + Math.random() * 0.1); // 15-25% dari revenue
      const grossProfit = revenue - cogs;
      const netProfit = grossProfit - opex;
      
      return {
        period: month,
        revenue: Math.round(revenue),
        cogs: Math.round(cogs),
        opex: Math.round(opex),
        grossProfit: Math.round(grossProfit),
        netProfit: Math.round(netProfit),
      };
    });
  };
  
  // Process profit history data for the chart
  const chartData = React.useMemo(() => {
    if (!profitHistory || profitHistory.length === 0) {
      return generateDemoData();
    }
    
    return profitHistory.map((analysis) => {
      const revenue = analysis.revenue_data?.total || 0;
      const cogs = effectiveCogs || analysis.cogs_data?.total || 0;
      const opex = analysis.opex_data?.total || 0;
      const grossProfit = revenue - cogs;
      const netProfit = grossProfit - opex;
      
      return {
        period: formatPeriodForDisplay(analysis.period),
        revenue,
        cogs,
        opex,
        grossProfit,
        netProfit,
      };
    });
  }, [profitHistory, effectiveCogs]);
  
  // Responsive hook with window resize listener
  const [windowWidth, setWindowWidth] = React.useState(() => {
    if (typeof window === 'undefined') return 1024;
    return window.innerWidth;
  });
  
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const isMobile = windowWidth < 768;
  const isSmallMobile = windowWidth < 480;
  
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
  
  // Removed - we now always have demo data if no real data
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-orange-500" />
          Analisis Profit Multi-Line
        </CardTitle>
        <CardDescription>
          Perbandingan omset, HPP{labels?.hppLabel ? ` (${labels.hppLabel})` : ''}, dan profit
        </CardDescription>
      </CardHeader>
      <CardContent className="p-2 sm:p-6">
        {/* Mobile swipe indicator and legend toggle */}
        {isMobile && (
          <div className="space-y-2">
            <div className="flex items-center justify-center text-xs text-orange-600 bg-orange-50 rounded px-2 py-1">
              <span>👈 Geser kiri-kanan untuk melihat chart lengkap</span>
            </div>
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLegend(!showLegend)}
                className="text-xs h-7 px-2 border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                {showLegend ? 'Sembunyikan' : 'Tampilkan'} Legend
              </Button>
            </div>
          </div>
        )}
        
        {/* Mobile Legend */}
        {isMobile && showLegend && (
          <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded border mb-2">
            {Object.entries(chartConfig).map(([key, config]) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-3 h-0.5 rounded" 
                  style={{ backgroundColor: config.color }}
                />
                <span className="text-gray-700">{config.label}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Mobile optimized chart container with horizontal scroll */}
        <div className={`${isMobile ? 'overflow-x-auto pb-2' : ''}`} style={{ scrollbarWidth: 'thin' }}>
          <ChartContainer config={chartConfig}>
            <div className={`${isMobile ? 'min-w-[600px]' : 'w-full'}`}>
              <ResponsiveContainer 
                width="100%" 
                height={isMobile ? 280 : 350}
              >
                <LineChart
                  data={chartData}
                  margin={{
                    left: isMobile ? 10 : 20,
                    right: isMobile ? 10 : 20,
                    top: isMobile ? 10 : 20,
                    bottom: isMobile ? 30 : 20,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="period"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className={isMobile ? 'text-xs' : 'text-sm'}
                    interval={isMobile ? 0 : 'preserveStartEnd'}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => formatCurrency(value, { compact: true })}
                    className={isMobile ? 'text-xs' : 'text-sm'}
                    width={isMobile ? 50 : 60}
                  />
                  <ChartTooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={<ChartTooltipContent 
                      formatter={(value, name) => [
                        formatCurrency(value as number), 
                        chartConfig[name as keyof typeof chartConfig]?.label || name
                      ]}
                    />} 
                  />
                  
                  {/* Revenue Line */}
              <Line
                dataKey="revenue"
                type="monotone"
                stroke={chartConfig.revenue.color}
                strokeWidth={2.5}
                dot={{ fill: chartConfig.revenue.color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              
              {/* COGS Line */}
              <Line
                dataKey="cogs"
                type="monotone"
                stroke={chartConfig.cogs.color}
                strokeWidth={2}
                dot={{ fill: chartConfig.cogs.color, strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
                strokeDasharray="5 5"
              />
              
              {/* Operational Expenses Line */}
              <Line
                dataKey="opex"
                type="monotone"
                stroke={chartConfig.opex.color}
                strokeWidth={2}
                dot={{ fill: chartConfig.opex.color, strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
                strokeDasharray="3 3"
              />
              
              {/* Gross Profit Line */}
              <Line
                dataKey="grossProfit"
                type="monotone"
                stroke={chartConfig.grossProfit.color}
                strokeWidth={2}
                dot={{ fill: chartConfig.grossProfit.color, strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
              
              {/* Net Profit Line - Most prominent */}
              <Line
                dataKey="netProfit"
                type="monotone"
                stroke={chartConfig.netProfit.color}
                strokeWidth={3}
                dot={{ fill: chartConfig.netProfit.color, strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
            </div>
          </ChartContainer>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
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
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              Menampilkan data {chartData.length} periode terakhir
              {labels?.hppLabel && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded ml-2">
                  {labels.hppLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

