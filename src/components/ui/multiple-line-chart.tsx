import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface DataPoint {
  [key: string]: string | number
}

interface LineConfig {
  dataKey: string
  color: string
  name: string
  strokeWidth?: number
  strokeDasharray?: string
}

interface MultipleLineChartProps {
  data: DataPoint[]
  lines: LineConfig[]
  title?: string
  description?: string
  height?: number
  xAxisDataKey: string
  formatTooltip?: (value: any, name: string) => [string, string]
  formatXAxisLabel?: (value: any) => string
  formatYAxisLabel?: (value: any) => string
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

export function MultipleLineChart({
  data,
  lines,
  title,
  description,
  height = 350,
  xAxisDataKey,
  formatTooltip,
  formatXAxisLabel,
  formatYAxisLabel
}: MultipleLineChartProps) {
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
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
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
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.color}
            strokeWidth={line.strokeWidth || 2}
            strokeDasharray={line.strokeDasharray}
            name={line.name}
            dot={{ r: 4, fill: line.color }}
            activeDot={{ r: 6, fill: line.color }}
          />
        ))}
      </LineChart>
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

// Export preset chart configurations for common use cases
export const presetConfigurations = {
  revenueProfit: [
    {
      dataKey: 'revenue',
      color: 'hsl(var(--primary))',
      name: 'Revenue',
      strokeWidth: 3
    },
    {
      dataKey: 'profit',
      color: 'hsl(142, 76%, 36%)', // green
      name: 'Profit',
      strokeWidth: 2
    },
    {
      dataKey: 'costs',
      color: 'hsl(0, 84%, 60%)', // red
      name: 'Costs',
      strokeWidth: 2,
      strokeDasharray: '5 5'
    }
  ],
  
  salesOrders: [
    {
      dataKey: 'sales',
      color: 'hsl(217, 91%, 60%)', // blue
      name: 'Sales',
      strokeWidth: 2
    },
    {
      dataKey: 'orders',
      color: 'hsl(142, 76%, 36%)', // green
      name: 'Orders',
      strokeWidth: 2
    }
  ],

  profitMargins: [
    {
      dataKey: 'grossMargin',
      color: 'hsl(142, 76%, 36%)', // green
      name: 'Gross Margin %',
      strokeWidth: 2
    },
    {
      dataKey: 'netMargin',
      color: 'hsl(217, 91%, 60%)', // blue
      name: 'Net Margin %',
      strokeWidth: 2
    }
  ]
}