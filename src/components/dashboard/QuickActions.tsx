// components/dashboard/QuickActions.tsx - Enhanced with Outline Design

import React from 'react';
import { Card } from "@/components/ui/card";
import { ShoppingBag, Boxes, FileText, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

// 🎯 Quick Action Item with Outline Design
const QuickActionCard: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
  iconColor: string;
}> = ({ to, icon, label, iconColor }) => {
  return (
    <Card className="bg-white border-[1.5px] border-gray-300 dark:border-gray-600 hover:border-orange-400 hover:shadow-md transition-all duration-300 overflow-hidden group">
      <Link 
        to={to} 
        className="block p-6 h-full relative"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {/* Icon with Outline Design */}
            <div className="border-[1.5px] border-orange-200 p-3 rounded-xl mr-4 group-hover:border-orange-300 group-hover:bg-orange-50 transition-all duration-300">
              <div className={`h-6 w-6 ${iconColor} group-hover:scale-110 transition-transform duration-300`}>
                {icon}
              </div>
            </div>
            
            {/* Label */}
            <div>
              <p className="text-lg font-semibold text-gray-800 group-hover:text-orange-700 transition-colors duration-300">
                {label}
              </p>
              <p className="text-sm text-gray-500 group-hover:text-orange-500 transition-colors duration-300">
                Klik untuk akses cepat
              </p>
            </div>
          </div>
          
          {/* Arrow Icon */}
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all duration-300" />
        </div>

        {/* Hover Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        
        {/* Bottom Border Accent */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-red-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
      </Link>
    </Card>
  );
};

const QuickActions: React.FC = () => {
  // ⚡ Actions configuration
  const actions = [
    {
      to: "/pesanan",
      icon: <ShoppingBag className="h-6 w-6" />,
      label: "Kelola Pesanan",
      iconColor: "text-orange-600"
    },
    {
      to: "/gudang",
      icon: <Boxes className="h-6 w-6" />,
      label: "Kelola Stok", 
      iconColor: "text-orange-600"
    },
    {
      to: "/laporan",
      icon: <FileText className="h-6 w-6" />,
      label: "Laporan Keuangan",
      iconColor: "text-orange-600"
    }
  ];

  return (
    <div className="mb-8">
      {/* 🏷️ Section Title */}
      <div className="flex items-center mb-6">
        <div className="flex items-center">
          <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-red-500 rounded-full mr-3"></div>
          <h2 className="text-xl font-bold text-gray-800">
            Aksi Cepat
          </h2>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent ml-4"></div>
      </div>
      
      {/* 📋 Quick Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {actions.map((action) => (
          <QuickActionCard
            key={action.to}
            to={action.to}
            icon={action.icon}
            label={action.label}
            iconColor={action.iconColor}
          />
        ))}
      </div>
    </div>
  );
};

export default QuickActions;