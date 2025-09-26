import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface DataPoint {
  [key: string]: string | number
}

interface BarConfig {
  dataKey: string
  color: string
  name: string
  radius?: [number, number, number, number]
}

interface BarChartProps {
  data: DataPoint[]
  bars: BarConfig[]
  title?: string
  description?: string
  height?: number
  xAxisDataKey: string
  formatTooltip?: (value: any, name: string) => [string, string]
  formatXAxisLabel?: (value: any) => string
  formatYAxisLabel?: (value: any) => string
  layout?: 'horizontal' | 'vertical'
}

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(0) + 'K'
  }
  return num.toString()
}

export function SimpleBarChart({
  data,
  bars,
  title,
  description,
  height = 350,
  xAxisDataKey,
  formatTooltip,
  formatXAxisLabel,
  formatYAxisLabel,
  layout = 'vertical'
}: BarChartProps) {
  const defaultTooltipFormatter = (value: any, name: string) => {
    if (name.toLowerCase().includes('revenue') || name.toLowerCase().includes('profit') || name.toLowerCase().includes('cost')) {
      return [formatRupiah(value), name]
    }
    return [formatNumber(value), name]
  }

  const defaultYAxisFormatter = (value: any) => {
    if (typeof value === 'number' && value >= 1000000) {
      return formatNumber(value)
    }
    return value
  }

  const ChartComponent = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
        layout={layout}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey={xAxisDataKey}
          tickFormatter={formatXAxisLabel}
          className="text-muted-foreground"
          fontSize={12}
        />
        <YAxis 
          tickFormatter={formatYAxisLabel || defaultYAxisFormatter}
          className="text-muted-foreground"
          fontSize={12}
        />
        <Tooltip
          formatter={formatTooltip || defaultTooltipFormatter}
          labelClassName="text-foreground font-medium"
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            color: 'hsl(var(--foreground))',
            fontSize: '14px'
          }}
        />
        <Legend 
          wrapperStyle={{
            fontSize: '14px',
            color: 'hsl(var(--muted-foreground))'
          }}
        />
        {bars.map((bar) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            fill={bar.color}
            name={bar.name}
            radius={bar.radius || [4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )

  if (title || description) {
    return (
      <Card>
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <ChartComponent />
        </CardContent>
      </Card>
    )
  }

  return <ChartComponent />
}

// Export preset bar chart configurations
export const barPresetConfigurations = {
  salesByProduct: [
    {
      dataKey: 'sales',
      color: 'hsl(var(--primary))',
      name: 'Sales',
      radius: [4, 4, 0, 0] as [number, number, number, number]
    }
  ],
  
  revenueComparison: [
    {
      dataKey: 'revenue',
      color: 'hsl(142, 76%, 36%)',
      name: 'Revenue',
      radius: [4, 4, 0, 0] as [number, number, number, number]
    },
    {
      dataKey: 'target',
      color: 'hsl(0, 84%, 60%)',
      name: 'Target',
      radius: [4, 4, 0, 0] as [number, number, number, number]
    }
  ],

  profitByCategory: [
    {
      dataKey: 'profit',
      color: 'hsl(217, 91%, 60%)',
      name: 'Profit',
      radius: [4, 4, 0, 0] as [number, number, number, number]
    }
  ]
}