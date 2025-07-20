import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Calculator, Warehouse, TrendingUp, Package, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from '@/utils/currencyUtils';

// --- Impor Hook Konteks ---
import { useActivity } from "@/contexts/ActivityContext";
import { useBahanBaku } from "@/contexts/BahanBakuContext";
import { useRecipe } from "@/contexts/RecipeContext";
import { useOrder } from "@/contexts/OrderContext";
import { useUserSettings } from '@/hooks/useUserSettings'; // ✅ 1. Impor useUserSettings

// Fungsi untuk format tanggal dan waktu
const formatDateTime = (date: Date | null) => {
  if (!date || !(date instanceof Date)) return 'Waktu tidak valid';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const Dashboard = () => {
  const { activities } = useActivity();
  const { bahanBaku } = useBahanBaku();
  const { recipes, hppResults } = useRecipe();
  const { orders } = useOrder();
  const { settings } = useUserSettings(); // ✅ 2. Panggil hook untuk mendapatkan settings

  // Kalkulasi statistik utama
  const stats = useMemo(() => {
    // ... (logika stats tidak berubah)
    const stokMenipis = bahanBaku.filter(item => item.stok <= item.minimum).length;
    const averageHPP = hppResults.length > 0
      ? hppResults.reduce((sum, result) => sum + result.hppPerPorsi, 0) / hppResults.length
      : 0;
    const totalStokBahanBaku = bahanBaku.reduce((sum, item) => sum + item.stok, 0);

    return {
      totalProduk: recipes.length,
      totalStokBahanBaku,
      hppRataRata: formatCurrency(averageHPP),
      stokMenipis,
    };
  }, [recipes, hppResults, bahanBaku]);

  // Kalkulasi produk terlaris
  const bestSellingProducts = useMemo(() => {
    // ... (logika produk terlaris tidak berubah)
    const productSales: { [key: string]: number } = {};
    orders.forEach(order => {
      (order.items || []).forEach(item => {
        productSales[item.namaBarang] = (productSales[item.namaBarang] || 0) + item.quantity;
      });
    });

    return Object.entries(productSales)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [orders]);

  const statsCards = [
    { title: "Total Produk", value: stats.totalProduk.toString(), icon: Package, color: "from-blue-500 to-blue-400" },
    { title: "Total Stok Bahan", value: stats.totalStokBahanBaku.toLocaleString('id-ID'), icon: Warehouse, color: "from-green-500 to-green-400" },
    { title: "HPP Rata-rata", value: stats.hppRataRata, icon: Calculator, color: "from-purple-500 to-purple-400" },
    { title: "Stok Menipis", value: stats.stokMenipis.toString(), icon: TrendingUp, color: stats.stokMenipis > 0 ? "from-red-500 to-red-400" : "from-orange-500 to-orange-400" },
  ];

  const quickActions = [
    { title: "Hitung HPP", link: "/hpp", icon: Calculator, color: "bg-blue-50 hover:bg-blue-100 text-blue-700" },
    { title: "Kelola Gudang", link: "/gudang", icon: Warehouse, color: "bg-green-50 hover:bg-green-100 text-green-700" },
    { title: "Laporan Keuangan", link: "/laporan", icon: BarChart3, color: "bg-purple-50 hover:bg-purple-100 text-purple-700" },
  ];
  
  // ✅ 3. Perbarui fungsi getGreeting
  const getGreeting = () => {
    const jam = new Date().getHours();
    let sapaan = "datang";
    if (jam >= 4 && jam < 11) sapaan = "pagi";
    if (jam >= 11 && jam < 15) sapaan = "siang";
    if (jam >= 15 && jam < 19) sapaan = "sore";
    if (jam >= 19 || jam < 4) sapaan = "malam";
    
    // Gunakan ownerName dari settings
    if (settings.ownerName) {
      return `Selamat ${sapaan}, Kak ${settings.ownerName}!`;
    }
    return `Selamat ${sapaan}! Kelola bisnis Anda dengan mudah`;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">{getGreeting()}</p>
      </div>

      {/* ... sisa kode JSX tidak berubah ... */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full bg-gradient-to-tr ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
            <Link key={index} to={action.link} className="block">
                <Card className={`${action.color} transition-transform hover:scale-105 h-full`}>
                <CardContent className="p-6 flex flex-col items-center text-center justify-center">
                    <div className="p-3 bg-white rounded-full shadow-md mb-4">
                    <action.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold">{action.title}</h3>
                </CardContent>
                </Card>
            </Link>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Produk Terlaris</h2>
            <Card className="h-full">
                <CardContent className="p-6">
                    <div className="space-y-4">
                        {bestSellingProducts.length > 0 ? (
                            bestSellingProducts.map((product, index) => (
                                <div key={product.name} className="flex items-center">
                                    <Trophy className={`h-6 w-6 mr-4 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-yellow-700'}`} />
                                    <div className="flex-1">
                                        <p className="font-semibold">{product.name}</p>
                                        <p className="text-sm text-muted-foreground">{product.quantity} Terjual</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground py-4">Belum ada data penjualan.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Aktivitas Terbaru</h2>
          <Card className="h-full">
            <CardContent className="p-6">
              <div className="space-y-4">
                {activities.length > 0 ? (
                  activities.slice(0, 5).map((activity) => {
                    const isFinancial = ['keuangan', 'purchase', 'hpp'].includes(activity.type);
                    const amount = isFinancial ? parseFloat(activity.value || '0') : 0;
                    return (
                      <div key={activity.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium">{activity.title}</p>
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                        </div>
                        <div className="text-sm text-right mt-1 sm:mt-0">
                          {isFinancial && amount > 0 && (
                            <p className={`font-semibold ${activity.type === 'keuangan' && activity.title.toLowerCase().includes('pemasukan') ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(amount)}
                            </p>
                          )}
                          <p className="text-muted-foreground text-xs">{formatDateTime(activity.timestamp)}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-muted-foreground py-4">Belum ada aktivitas</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;