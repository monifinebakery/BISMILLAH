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
  // Process profit history data for the chart
  const chartData = React.useMemo(() => {
    if (!profitHistory || profitHistory.length === 0) return [];
    
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
  
  if (chartData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-orange-500" />
            Analisis Profit Multi-Line
          </CardTitle>
          <CardDescription>Belum ada data untuk ditampilkan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Mulai input data transaksi untuk melihat grafik</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
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
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart
              data={chartData}
              margin={{
                left: 20,
                right: 20,
                top: 20,
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="period"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-sm"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => formatCurrency(value, { compact: true })}
                className="text-sm"
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
        </ChartContainer>
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

