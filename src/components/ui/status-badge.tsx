import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

type StatusVariant = 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info' 
  | 'neutral'
  | 'pending'
  | 'active'
  | 'inactive';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  icon?: LucideIcon;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Auto-detect variant based on common status values */
  autoVariant?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  icon: Icon,
  className,
  size = 'md',
  autoVariant = true
}) => {
  // Auto-detect variant if not specified
  const detectedVariant = autoVariant && !variant ? detectVariant(status) : variant || 'neutral';

  const variantClasses = {
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    neutral: 'bg-gray-100 text-gray-800 border-gray-200',
    pending: 'bg-orange-100 text-orange-800 border-orange-200',
    active: 'bg-green-100 text-green-800 border-green-200',
    inactive: 'bg-gray-100 text-gray-500 border-gray-200',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1 h-5',
    md: 'text-sm px-2.5 py-1 h-6',
    lg: 'text-base px-3 py-1.5 h-8',
  };

  return (
    <Badge
      className={cn(
        'inline-flex items-center gap-1 font-medium border rounded-full',
        variantClasses[detectedVariant],
        sizeClasses[size],
        className
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {status}
    </Badge>
  );
};

/**
 * Auto-detect variant based on common status values
 */
function detectVariant(status: string): StatusVariant {
  const statusLower = status.toLowerCase();
  
  // Success indicators
  if (['selesai', 'berhasil', 'sukses', 'completed', 'success', 'done', 'paid', 'dibayar', 'aktif', 'active', 'approved', 'disetujui'].some(s => statusLower.includes(s))) {
    return 'success';
  }
  
  // Warning indicators
  if (['pending', 'menunggu', 'warning', 'peringatan', 'partial', 'sebagian', 'review', 'tinjau'].some(s => statusLower.includes(s))) {
    return 'warning';
  }
  
  // Error indicators
  if (['gagal', 'failed', 'error', 'ditolak', 'rejected', 'cancelled', 'dibatalkan', 'expired', 'kedaluwarsa'].some(s => statusLower.includes(s))) {
    return 'error';
  }
  
  // Info indicators
  if (['draft', 'info', 'informasi', 'new', 'baru', 'processing', 'diproses'].some(s => statusLower.includes(s))) {
    return 'info';
  }
  
  // Inactive indicators
  if (['inactive', 'nonaktif', 'disabled', 'suspended', 'ditangguhkan'].some(s => statusLower.includes(s))) {
    return 'inactive';
  }
  
  return 'neutral';
}

/**
 * Preset status badges untuk use cases yang umum
 */
const StatusBadges = {
  // Order Status
  OrderPending: () => <StatusBadge status="Pending" variant="warning" />,
  OrderCompleted: () => <StatusBadge status="Selesai" variant="success" />,
  OrderCancelled: () => <StatusBadge status="Dibatalkan" variant="error" />,
  
  // Payment Status
  PaymentPaid: () => <StatusBadge status="Dibayar" variant="success" />,
  PaymentPending: () => <StatusBadge status="Menunggu" variant="warning" />,
  PaymentFailed: () => <StatusBadge status="Gagal" variant="error" />,
  
  // General Status
  Active: () => <StatusBadge status="Aktif" variant="active" />,
  Inactive: () => <StatusBadge status="Nonaktif" variant="inactive" />,
  Draft: () => <StatusBadge status="Draft" variant="info" />,
};

export { StatusBadge, StatusBadges, detectVariant };
export type { StatusBadgeProps, StatusVariant };