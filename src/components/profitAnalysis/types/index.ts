// src/components/financial/profit-analysis/types/index.ts
// ✅ LOCAL TYPES - Types khusus untuk profit analysis components

export interface ProfitAnalysisDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dateRange?: { from: Date; to: Date };
  initialTab?: string;
  onExport?: (format: string, data: any) => void;
}

export interface TabComponentProps {
  profitData: any;
  isLoading?: boolean;
  onAction?: (action: string, data?: any) => void;
}

export interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<any>;
  color: 'green' | 'red' | 'blue' | 'purple' | 'orange';
  trend?: number;
  status?: string;
  onClick?: () => void;
}

export interface CostBreakdownItem {
  label: string;
  amount: number;
  color: string;
  percentage: number;
}

export interface ExportData {
  ringkasan: Record<string, any>;
  rincian_hpp: Record<string, any>;
  rincian_opex: Record<string, any>;
  insights: Array<Record<string, any>>;
  analisis_rasio: Record<string, any>;
  patokan_industri: Record<string, any>;
}