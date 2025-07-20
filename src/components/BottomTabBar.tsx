import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, BookOpen, Package, ShoppingCart, Menu, Receipt } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const BottomTabBar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  const tabs = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/resep', icon: BookOpen, label: 'Resep' },
    { path: '/gudang', icon: Package, label: 'Gudang' },
    { path: '/pesanan', icon: ShoppingCart, label: 'Pesanan' },
    { path: '/menu', icon: Menu, label: 'Menu' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center min-w-0 flex-1 py-1 px-1 rounded-lg transition-colors ${
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <Icon className={`h-5 w-5 mb-1 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
              <span className={`text-xs font-medium truncate ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
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