import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Calculator, Warehouse, TrendingUp, Package, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo } from "react"; // <-- DITAMBAHKAN untuk optimasi
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import { formatDateForDisplay } from '@/utils/dateUtils';

// --- Impor Hook Baru ---
import { useActivity } from "@/contexts/ActivityContext";
import { useRecipe } from "@/contexts/RecipeContext";
import { useBahanBaku } from "@/contexts/BahanBakuContext";

const Dashboard = () => {
  // --- PANGGIL HOOK SPESIFIK ---
  const { activities } = useActivity();
  const { bahanBaku } = useBahanBaku();
  const { recipes } = useRecipe();
  const { orders } = useOrder();
  const { financialTransactions } = useFinancial();
  const { assets } = useAsset();
  const { purchases } = usePurchase();
  const { suppliers } = useSupplier();
  const { userName } = usePaymentStatus();

  // --- Logika Statistik Diimplementasikan Ulang di Sini ---
  const stats = useMemo(() => {
    const stokMenipis = bahanBaku.filter(bahan => bahan.stok <= bahan.minimum).length;
    
    const averageHPP = hppResults.length > 0
      ? hppResults.reduce((sum, result) => sum + result.hppPerPorsi, 0) / hppResults.length
      : 0;

    return {
      totalProduk: recipes.length,
      stokBahanBaku: bahanBaku.length,
      hppRataRata: averageHPP > 0 ? `Rp ${averageHPP.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : 'Rp 0',
      stokMenurut: stokMenipis,
    };
  }, [recipes, hppResults, bahanBaku]);


  const statsCards = [
    {
      title: "Total Produk",
      value: stats.totalProduk.toString(),
      icon: Package,
      color: "from-blue-600 to-blue-400",
    },
    {
      title: "Jumlah Bahan Baku", // Judul disesuaikan agar lebih jelas
      value: stats.stokBahanBaku.toString(),
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
      icon: DollarSign, // Menggunakan ikon yang sama seperti sebelumnya
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
            Dashboard Sistem HPP
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {getGreeting()}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
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

        {/* Quick Actions & Recent Activity (Grid layout for larger screens) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Aksi Cepat</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {quickActions.map((action, index) => (
                <Link key={index} to={action.link} className="block">
                  <Card className={`${action.color} transition-all duration-300 hover:shadow-lg border-0 cursor-pointer h-full`}>
                    <CardContent className="p-4 sm:p-6 flex items-start space-x-3 sm:space-x-4">
                      <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0 mt-1">
                        <action.icon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">{action.title}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{action.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="lg:col-span-1">
             <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Aktivitas Terbaru</h2>
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm h-full">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-gray-800">{activity.title}</p>
                        <p className="text-xs text-gray-500">{formatDateForDisplay(activity.timestamp)}</p>
                      </div>
                      {activity.value && (
                        <span className="font-semibold text-sm text-gray-700 whitespace-nowrap pl-2">
                          {activity.value}
                        </span>
                      )}
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <p className="text-center text-gray-500 py-4">Belum ada aktivitas</p>
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