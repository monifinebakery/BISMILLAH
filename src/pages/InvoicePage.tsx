import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrder } from '@/contexts/OrderContext';
import { InvoiceTemplate } from '@/components/InvoiceTemplate';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';

const InvoicePage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { orders } = useOrder();

  const order = orders.find(o => o.id === orderId);

  const handlePrint = () => {
    window.print();
  };

  if (!order) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold">Pesanan tidak ditemukan</h2>
        <p className="text-muted-foreground">Pesanan dengan ID ini tidak ada atau telah dihapus.</p>
        <Button asChild className="mt-4">
          <Link to="/pesanan">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar Pesanan
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
      {/* Tombol Aksi - disembunyikan saat mencetak */}
      <div className="mb-8 flex justify-between items-center print:hidden">
        <Button asChild variant="outline">
          <Link to="/pesanan">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Cetak Invoice
        </Button>
      </div>

      {/* Render Template Invoice */}
      <InvoiceTemplate order={order} />
    </div>
  );
};

export default InvoicePage;
