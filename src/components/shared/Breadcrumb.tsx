// src/components/shared/Breadcrumb.tsx - Reusable Breadcrumb Component
import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  const location = useLocation();

  // Auto-add home if not present
  const breadcrumbItems = items[0]?.label === 'Home' ? items : [
    { label: 'Home', href: '/' },
    ...items
  ];

  return (
    <nav aria-label="Breadcrumb" className={`flex ${className}`}>
      <ol className="flex items-center space-x-1 text-sm text-gray-500">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          const isCurrent = item.current || isLast || location.pathname === item.href;
          
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="flex-shrink-0 h-4 w-4 text-gray-400 mx-1" />
              )}
              
              {item.href && !isCurrent ? (
                <Link
                  to={item.href}
                  className="text-gray-600 hover:text-gray-900 hover:underline transition-colors duration-200"
                >
                  {index === 0 ? (
                    <div className="flex items-center gap-1">
                      <Home className="h-4 w-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </div>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </Link>
              ) : (
                <span
                  className={`${
                    isCurrent
                      ? 'text-orange-600 font-medium'
                      : 'text-gray-600'
                  } ${index === 0 ? 'flex items-center gap-1' : ''}`}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {index === 0 ? (
                    <>
                      <Home className="h-4 w-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};