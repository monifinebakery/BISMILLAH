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
    <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
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
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      to: "/gudang",
      icon: <Boxes className="h-6 w-6" />,
      label: "Kelola Stok", 
      bgColor: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      to: "/laporan",
      icon: <FileText className="h-6 w-6" />,
      label: "Laporan Keuangan",
      bgColor: "bg-purple-100", 
      iconColor: "text-purple-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
  );
};

export default QuickActions;