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
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-50 safe-area-bottom md:hidden">
      <div className="flex justify-around items-center h-14 xs:h-16 px-2 max-w-screen-sm mx-auto">
        {tabs.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              className={`
                flex flex-col items-center justify-center min-w-0 flex-1 
                py-2 px-1 xs:px-2 rounded-lg transition-all duration-200 
                touch-target active:scale-95
                ${
                  isActive
                    ? 'text-orange-600 bg-orange-50 shadow-sm'
                    : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50'
                }
              `}
            >
              <Icon className="h-4 w-4 xs:h-5 xs:w-5 mb-0.5 xs:mb-1 flex-shrink-0" />
              <span className="text-[10px] xs:text-xs font-medium truncate leading-tight max-w-full">
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
      {/* Add safe area spacing for devices with home indicator */}
      <div className="h-[env(safe-area-inset-bottom)] bg-white/95" />
    </div>
  );
};

export default BottomTabBar;