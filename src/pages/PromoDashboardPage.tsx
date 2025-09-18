import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PromoAnalytics } from '@/components/promoCalculator/analytics';
import { PlusCircle, ListChecks, BarChart3 } from 'lucide-react';

const PromoDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('promoDashboardHintDismissed');
      setShowHint(!dismissed);
    } catch (error) {
      console.warn('PromoDashboardPage: failed to read promoDashboardHintDismissed flag', error);
    }
  }, []);

  const dismissHint = () => {
    try {
      localStorage.setItem('promoDashboardHintDismissed', '1');
    } catch (error) {
      console.warn('PromoDashboardPage: failed to persist promoDashboardHintDismissed flag', error);
    }
    setShowHint(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Promo Dashboard</h1>
              <p className="text-sm text-gray-600">Statistik singkat dan performa promo</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate('/promo/list')} variant="outline" className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              Daftar Promo
            </Button>
            <Button onClick={() => navigate('/promo/create')} className="bg-orange-500 hover:bg-orange-600 flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Buat Promo
            </Button>
          </div>
        </div>

        {/* Guided Hint (one-time) */}
        {showHint && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 sm:p-5">
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-2">Panduan Singkat:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Cek KPI cepat untuk ringkasan performa.</li>
                  <li>Gunakan filter Channel/Kategori untuk fokus analisis.</li>
                  <li>Lihat “Promo Terbaik” dan “Perlu Perbaikan”.</li>
                  <li>Tekan “Buat Promo” untuk membuat promo baru.</li>
                </ol>
                <div className="mt-3">
                  <Button onClick={dismissHint} size="sm" variant="outline">Mengerti</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics Section */}
        <PromoAnalytics />
      </div>
    </div>
  );
};

export default PromoDashboardPage;
