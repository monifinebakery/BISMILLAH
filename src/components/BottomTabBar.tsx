import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
// ✅ 1. Impor ikon 'Menu' dan hapus 'Receipt'
import { Home, BookOpen, Package, ShoppingCart, Menu } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const BottomTabBar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  // ✅ 2. Perbarui array 'tabs' untuk mengembalikan 'Menu'
  const tabs = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/resep', icon: BookOpen, label: 'Resep' },
    { path: '/gudang', icon: Package, label: 'Gudang' },
    { path: '/pesanan', icon: ShoppingCart, label: 'Pesanan' },
    { path: '/menu', icon: Menu, label: 'Menu' }, // Kembali ke 'Menu'
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-500 z-50 md:hidden">
      <div className="flex justify-around items-center h-16 px-2 max-w-md mx-auto">
        {tabs.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 rounded-lg transition-colors touch-manipulation ${
                isActive
                  ? 'text-orange-600 bg-orange-50'
                  : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50 active:bg-orange-100'
              }`}
              style={{ minHeight: '44px', minWidth: '44px' }} // Touch-friendly iOS guidelines
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium truncate">
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default BottomTabBar;