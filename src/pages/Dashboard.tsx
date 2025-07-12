import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Calculator, Warehouse, TrendingUp, Package, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppData } from "@/contexts/AppDataContext";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";

const Dashboard = () => {
  const { getDashboardStats, activities } = useAppData();
  const { userName } = usePaymentStatus();
  const stats = getDashboardStats();

  const statsCards = [
    {
      title: "Total Produk",
      value: stats.totalProduk.toString(),
      icon: Package,
      color: "from-blue-600 to-blue-400", // Akan diganti di render
    },
    {
      title: "Stok Bahan Baku",
      value: stats.stokBahanBaku.toString(),
      icon: Warehouse,
      color: "from-green-600 to-green-400", // Akan diganti di render
    },
    {
      title: "HPP Rata-rata",
      value: stats.hppRataRata,
      icon: Calculator,
      color: "from-purple-600 to-purple-400", // Akan diganti di render
    },
    {
      title: "Stok Menipis",
      value: stats.stokMenurut.toString(),
      color: stats.stokMenurut > 0 ? "from-red-600 to-red-400" : "from-orange-600 to-orange-400", // Akan diganti di render
      icon: Package, // MODIFIED: Mengganti DollarSign dengan Package untuk debugging
    },
  ];

  const quickActions = [
    {
      title: "Hitung HPP",
      description: "Kalkulator untuk menghitung harga pokok penjualan",
      icon: Calculator,
      link: "/hpp",
      color: "bg-blue-50 hover:bg-blue-100", // Akan diganti di render
    },
    {
      title: "Kelola Gudang",
      description: "Manajemen stok bahan baku dan inventory",
      icon: Warehouse,
      link: "/gudang",
      color: "bg-green-50 hover:bg-green-100", // Akan diganti di render
    },
    {
      title: "Laporan Keuangan",
      description: "Analisis dan laporan finansial bisnis",
      icon: BarChart3,
      link: "/laporan",
      color: "bg-purple-50 hover:bg-purple-100", // Akan diganti di render
    },
  ];

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getGreeting = () => {
    if (userName) {
      return `Selamat datang kak ${userName}!`;
    }
    return "Selamat datang! Kelola bisnis Anda dengan mudah";
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6"> {/* MODIFIED: bg-background */}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2"> {/* MODIFIED: text-primary */}
            Dashboard Sistem HPP
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {getGreeting()}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index} className="shadow-lg border-0 bg-card backdrop-blur-sm"> {/* MODIFIED: bg-card */}
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1 truncate">{stat.title}</p> {/* MODIFIED: text-muted-foreground */}
                    <p className="text-xl sm:text-2xl font-bold text-primary">{stat.value}</p> {/* MODIFIED: text-primary */}
                  </div>
                  <div className={`p-2 sm:p-3 rounded-full bg-secondary flex-shrink-0 ml-2`}> {/* MODIFIED: bg-secondary */}
                    <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> {/* MODIFIED: text-primary */}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Aksi Cepat</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.link}>
                <Card className={`bg-card hover:bg-accent transition-all duration-300 hover:shadow-lg border-0 cursor-pointer h-full`}> {/* MODIFIED: bg-card hover:bg-accent */}
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="p-2 bg-secondary rounded-lg shadow-sm flex-shrink-0"> {/* MODIFIED: bg-secondary */}
                        <action.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> {/* MODIFIED: text-primary */}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-primary mb-1 text-sm sm:text-base">{action.title}</h3> {/* MODIFIED: text-primary */}
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{action.description}</p> {/* MODIFIED: text-muted-foreground */}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="shadow-lg border-0 bg-card backdrop-blur-sm"> {/* MODIFIED: bg-card */}
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center text-lg sm:text-xl text-primary"> {/* MODIFIED: text-primary */}
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Aktivitas Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-3 sm:space-y-4">
              {activities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-secondary/50 rounded-lg gap-2"> {/* MODIFIED: bg-secondary/50 */}
                  <div className="flex-1">
                    <p className="font-medium text-sm sm:text-base text-primary">{activity.title}</p> {/* MODIFIED: text-primary */}
                    <p className="text-xs sm:text-sm text-muted-foreground">{formatDateTime(activity.timestamp)}</p> {/* MODIFIED: text-muted-foreground */}
                  </div>
                  {activity.value && (
                    <span className={`font-semibold text-sm sm:text-base text-primary`}> {/* MODIFIED: text-primary */}
                      {activity.value}
                    </span>
                  )}
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Belum ada aktivitas</p> {/* MODIFIED: text-muted-foreground */}
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
