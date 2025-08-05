// components/dashboard/QuickActions.tsx
import React from 'react';
import { Card } from "@/components/ui/card";
import { ShoppingBag, Boxes, FileText } from "lucide-react";
import { Link } from "react-router-dom";

// 🎯 Quick Action Item
const QuickActionCard: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
  bgColor: string;
  iconColor: string;
}> = ({ to, icon, label, bgColor, iconColor }) => {
  return (
    <Card className="bg-white border-2 border-gray-300 hover:shadow-md transition-all duration-300 hover:scale-105">
      <Link 
        to={to} 
        className="p-6 flex items-center h-full hover:bg-gray-50 rounded-lg transition-colors group"
      >
        <div className={`${bgColor} p-3 rounded-full mr-4 group-hover:scale-110 transition-transform duration-200`}>
          <div className={`h-6 w-6 ${iconColor}`}>
            {icon}
          </div>
        </div>
        <p className="text-lg font-medium text-gray-800 group-hover:text-gray-900 transition-colors">
          {label}
        </p>
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
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600"
    },
    {
      to: "/gudang",
      icon: <Boxes className="h-6 w-6" />,
      label: "Kelola Stok", 
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600"
    },
    {
      to: "/laporan",
      icon: <FileText className="h-6 w-6" />,
      label: "Laporan Keuangan",
      bgColor: "bg-orange-100", 
      iconColor: "text-orange-600"
    }
  ];

  return (
    <div className="mb-6">
      {/* 🏷️ Section Title */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
          Aksi Cepat
        </span>
      </h2>
      
      {/* 📋 Quick Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {actions.map((action) => (
          <QuickActionCard
            key={action.to}
            to={action.to}
            icon={action.icon}
            label={action.label}
            bgColor={action.bgColor}
            iconColor={action.iconColor}
          />
        ))}
      </div>
    </div>
  );
};

export default QuickActions;