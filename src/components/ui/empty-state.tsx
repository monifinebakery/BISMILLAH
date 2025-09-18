import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LucideIcon, Package, FileText, Users, ShoppingCart, Search } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Show illustration instead of icon */
  illustration?: 'package' | 'search' | 'file' | 'users' | 'cart' | 'custom';
  /** Custom illustration component */
  customIllustration?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  className,
  size = 'md',
  illustration,
  customIllustration
}) => {
  const sizeClasses = {
    sm: {
      container: 'py-6',
      iconSize: 'h-12 w-12',
      titleSize: 'text-base',
      descSize: 'text-sm',
    },
    md: {
      container: 'py-8',
      iconSize: 'h-16 w-16',
      titleSize: 'text-lg',
      descSize: 'text-sm',
    },
    lg: {
      container: 'py-12',
      iconSize: 'h-20 w-20',
      titleSize: 'text-xl',
      descSize: 'text-base',
    },
  };

  // Get illustration icon based on type
  const getIllustrationIcon = () => {
    switch (illustration) {
      case 'package':
        return Package;
      case 'search':
        return Search;
      case 'file':
        return FileText;
      case 'users':
        return Users;
      case 'cart':
        return ShoppingCart;
      default:
        return Icon;
    }
  };

  const IllustrationIcon = getIllustrationIcon();

  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      sizeClasses[size].container,
      className
    )}>
      {/* Icon/Illustration */}
      {customIllustration ? (
        <div className="mb-4">
          {customIllustration}
        </div>
      ) : IllustrationIcon && (
        <div className={cn(
          'rounded-full bg-gray-100 p-4 mb-4',
          size === 'sm' && 'p-3',
          size === 'lg' && 'p-5'
        )}>
          <IllustrationIcon 
            className={cn(
              'text-gray-400',
              sizeClasses[size].iconSize
            )} 
          />
        </div>
      )}

      {/* Title */}
      <h3 className={cn(
        'font-semibold text-gray-900 mb-2',
        sizeClasses[size].titleSize
      )}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className={cn(
          'text-gray-500 mb-6 max-w-sm',
          sizeClasses[size].descSize
        )}>
          {description}
        </p>
      )}

      {/* Action Button */}
      {actionText && onAction && (
        <Button 
          onClick={onAction}
          className="bg-orange-500 hover:bg-orange-600"
        >
          {actionText}
        </Button>
      )}
    </div>
  );
};

/**
 * Preset empty states untuk use cases yang umum
 */
const EmptyStates = {
  // No data found
  NoData: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      illustration="package"
      title="Belum ada data"
      description="Data akan muncul di sini setelah Anda menambahkannya"
      {...props}
    />
  ),

  // Search no results
  NoSearchResults: (query?: string) => (
    <EmptyState
      illustration="search"
      title="Tidak ada hasil ditemukan"
      description={query ? `Tidak ada hasil untuk "${query}"` : "Coba ubah kata kunci pencarian"}
    />
  ),

  // No items in list
  NoItems: (itemType: string, props?: Partial<EmptyStateProps>) => (
    <EmptyState
      illustration="package"
      title={`Belum ada ${itemType}`}
      description={`${itemType} akan muncul di sini setelah Anda menambahkannya`}
      actionText={`Tambah ${itemType}`}
      {...props}
    />
  ),

  // No orders
  NoOrders: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      illustration="cart"
      title="Belum ada pesanan"
      description="Pesanan akan muncul di sini setelah pelanggan melakukan pemesanan"
      actionText="Buat Pesanan"
      {...props}
    />
  ),

  // No recipes
  NoRecipes: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      illustration="file"
      title="Belum ada resep"
      description="Mulai dengan menambahkan resep pertama Anda"
      actionText="Tambah Resep"
      {...props}
    />
  ),

  // No suppliers
  NoSuppliers: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      illustration="users"
      title="Belum ada supplier"
      description="Tambahkan supplier untuk mulai mengelola pembelian"
      actionText="Tambah Supplier"
      {...props}
    />
  ),

  // Error state
  Error: (props?: Partial<EmptyStateProps>) => (
    <EmptyState
      title="Terjadi kesalahan"
      description="Tidak dapat memuat data. Silakan coba lagi."
      actionText="Muat Ulang"
      {...props}
    />
  ),
};

export { EmptyState, EmptyStates };
export type { EmptyStateProps };