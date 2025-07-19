import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Calculator, Warehouse, TrendingUp, Package, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import { formatDateForDisplay } from '@/utils/dateUtils';
import { useMemo } from 'react'; // Disarankan menggunakan useMemo untuk efisiensi

// --- IMPOR LENGKAP SEMUA HOOK KONTEKS ---
import { useActivity } from "@/contexts/ActivityContext";
import { useBahanBaku } from "@/contexts/BahanBakuContext";
import { useRecipe } from "@/contexts/RecipeContext";
import { useOrder } from "@/contexts/OrderContext";
import { useFinancial } from "@/contexts/FinancialContext";
import { useAsset } from "@/contexts/AssetContext";
import { usePurchase } from "@/contexts/PurchaseContext";
import { useSupplier } from "@/contexts/SupplierContext";

const Dashboard = () => {
  // --- PANGGIL SEMUA HOOK YANG DIBUTUHKAN ---
  const { activities } = useActivity();
  const { bahanBaku } = useBahanBaku();
  const { recipes, hppResults } = useRecipe(); // hppResults juga dibutuhkan
  const { userName } = usePaymentStatus();

  // --- REKONSTRUKSI STATISTIK MENGGUNAKAN useMemo ---
  const stats = useMemo(() => {
    const totalProduk = recipes.length;
    
    // Menghitung total kuantitas stok, bukan hanya jumlah jenis bahan
    const totalStokBahanBaku = bahanBaku.reduce((sum, item) => sum + item.stok, 0);
    
    const stokMenipis = bahanBaku.filter(item => item.stok <= item.minimum).length;
    
    const averageHPP = hppResults.length > 0
      ? hppResults.reduce((sum, result) => sum + result.hppPerPorsi, 0) / hppResults.length
      : 0;

    const hppRataRataFormatted = averageHPP > 0
      ? averageHPP.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 })
      : "Rp 0";

    return {
      totalProduk,
      totalStokBahanBaku,
      hppRataRata: hppRataRataFormatted,
      stokMenurut: stokMenipis,
    };
  }, [recipes, bahanBaku, hppResults]);


  const statsCards = [
    {
      title: "Total Produk",
      value: stats.totalProduk.toString(),
      icon: Package,
      color: "from-blue-600 to-blue-400",
    },
    {
      title: "Total Stok Bahan",
      value: stats.totalStokBahanBaku.toLocaleString('id-ID'),
      icon: Warehouse,
      color: "from-green-600 to-green-400",
    },
    {
      title: "HPP Rata-rata",
      value: stats.hppRataRata,
      icon: Calculator,
      color: "from-purple-600 to-purple-400",
    },
    {
      title: "Stok Menipis",
      value: stats.stokMenurut.toString(),
      icon: TrendingUp, // Ikon diganti agar lebih sesuai
      color: stats.stokMenurut > 0 ? "from-red-600 to-red-400" : "from-orange-600 to-orange-400",
    },
  ];

  const quickActions = [
    {
      title: "Hitung HPP",
      description: "Kalkulator untuk menghitung harga pokok penjualan",
      icon: Calculator,
      link: "/hpp",
      color: "bg-blue-50 hover:bg-blue-100",
    },
    {
      title: "Kelola Gudang",
      description: "Manajemen stok bahan baku dan inventory",
      icon: Warehouse,
      link: "/gudang",
      color: "bg-green-50 hover:bg-green-100",
    },
    {
      title: "Laporan Keuangan",
      description: "Analisis dan laporan finansial bisnis",
      icon: BarChart3,
      link: "/laporan",
      color: "bg-purple-50 hover:bg-purple-100",
    },
  ];

  const getGreeting = () => {
    const jam = new Date().getHours();
    let sapaan = "datang";
    if (jam >= 4 && jam < 11) sapaan = "pagi";
    if (jam >= 11 && jam < 15) sapaan = "siang";
    if (jam >= 15 && jam < 19) sapaan = "sore";
    if (jam >= 19 || jam < 4) sapaan = "malam";
    
    if (userName) {
      return `Selamat ${sapaan}, kak ${userName}!`;
    }
    return `Selamat ${sapaan}! Kelola bisnis Anda dengan mudah`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {getGreeting()}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index} className="shadow-md border-0 bg-white">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">{stat.title}</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-800">{stat.value}</p>
                  </div>
                  <div className={`p-2 sm:p-3 rounded-full bg-gradient-to-r ${stat.color} flex-shrink-0 ml-2`}>
                    <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Aksi Cepat</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {quickActions.map((action, index) => (
                <Link key={index} to={action.link} className="block">
                  <Card className={`${action.color} transition-all duration-300 hover:shadow-lg border-0 cursor-pointer h-full`}>
                    <CardContent className="p-4 sm:p-6 flex flex-col items-center text-center">
                        <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                          <action.icon className="h-6 w-6 text-gray-700" />
                        </div>
                        <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{action.title}</h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="lg:col-span-1">
             <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Aktivitas Terbaru</h2>
            <Card className="shadow-md border-0 bg-white h-full">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3">
                  {activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between text-sm">
                      <p className="text-gray-700">{activity.title}</p>
                      <p className="text-gray-500 text-xs">{formatDateForDisplay(activity.timestamp)}</p>
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <p className="text-center text-gray-500 py-4 text-sm">Belum ada aktivitas</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;