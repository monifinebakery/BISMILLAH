// src/components/admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, DollarSign, Search, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentSession } from '@/services/auth';

// URL Edge Function API Admin Anda
const ADMIN_API_URL = 'https://kewhzkfvswbimmwtpymw.supabase.co/functions/v1/admin-api';

const AdminDashboard = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fungsi untuk mengambil data admin dari Edge Function
  const fetchData = async () => {
    setLoading(true);
    try {
      const session = await getCurrentSession();
      if (!session) {
        toast.error('Anda tidak terautentikasi.');
        setLoading(false);
        return;
      }

      // Jika Edge Function mengembalikan data users dan payments secara terpisah:
      const usersResponse = await fetch(ADMIN_API_URL + '/users', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const paymentsResponse = await fetch(ADMIN_API_URL + '/payments', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (!usersResponse.ok || !paymentsResponse.ok) {
        throw new Error('Failed to fetch admin data via API.');
      }
      
      const { data: userDataFromApi } = await usersResponse.json();
      const { data: paymentDataFromApi } = await paymentsResponse.json();

      setUsers(userDataFromApi || []);
      setPayments(paymentDataFromApi || []);

    } catch (error: any) {
      console.error('Error fetching admin data:', error instanceof Error ? error.message : String(error));
      toast.error((error instanceof Error ? error.message : String(error)) || 'Gagal memuat data admin dari API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTogglePaymentStatus = async (paymentId: string, currentStatus: boolean) => {
    try {
      const session = await getCurrentSession();
      if (!session) {
        toast.error('Anda tidak terautentikasi.');
        return;
      }

      const response = await fetch(ADMIN_API_URL + '/payment-status', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paymentId, isPaid: !currentStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengubah status pembayaran melalui API.');
      }
      
      await fetchData();
      
      toast.success(`Status pembayaran berhasil ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
    } catch (error: any) {
      console.error('Error updating payment status:', error instanceof Error ? error.message : String(error));
      toast.error((error instanceof Error ? error.message : String(error)) || 'Gagal mengubah status pembayaran');
    }
  };

  const filteredPayments = payments.filter(payment => 
    payment.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.order_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Memuat data admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-full mr-4">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">
                Kelola pengguna dan pembayaran
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full p-2 mr-3">
                  <Users className="text-blue-600 h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-600 text-sm">Total Pengguna</p>
                  <p className="font-bold text-gray-900 text-lg">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="bg-green-100 rounded-full p-2 mr-3">
                  <CheckCircle className="text-green-600 h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-600 text-sm">Pembayaran Sukses</p>
                  <p className="font-bold text-gray-900 text-lg">
                    {payments.filter(p => p.is_paid).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="bg-purple-100 rounded-full p-2 mr-3">
                  <DollarSign className="text-purple-600 h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-600 text-sm">Total Pendapatan</p>
                  <p className="font-bold text-gray-900 text-lg">
                    Rp {payments
                      .filter(p => p.is_paid)
                      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
                      .toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payments Management */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Manajemen Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari berdasarkan email, nama, atau order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.name || 'N/A'}</TableCell>
                      <TableCell>{payment.email || 'N/A'}</TableCell>
                      <TableCell>{payment.order_id || payment.scalev_payment_id || 'N/A'}</TableCell>
                      <TableCell>
                        {payment.is_paid ? (
                          <Badge className="bg-green-100 text-green-800">Lunas</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">{payment.payment_status}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(payment.updated_at).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePaymentStatus(payment.id, payment.is_paid)}
                          className={payment.is_paid ? 
                            "border-red-200 text-red-600 hover:bg-red-50" : 
                            "border-green-200 text-green-600 hover:bg-green-50"
                          }
                        >
                          {payment.is_paid ? (
                            <>
                              <XCircle className="h-4 w-4 mr-1" />
                              Nonaktifkan
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aktifkan
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {filteredPayments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        {searchTerm ? 'Tidak ada data yang sesuai dengan pencarian' : 'Belum ada data pembayaran'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Users Management */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Manajemen Pengguna
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Bisnis</TableHead>
                    <TableHead>Pemilik</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status Premium</TableHead>
                    <TableHead>Tanggal Daftar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.business_name}</TableCell>
                      <TableCell>{user.owner_name}</TableCell>
                      <TableCell>{user.email || 'N/A'}</TableCell>
                      <TableCell>
                        {user.user_payments?.[0]?.is_paid ? (
                          <Badge className="bg-green-100 text-green-800">Premium</Badge>
                        ) : (
                          <Badge className="bg-gray-200 text-gray-800">Free</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('id-ID')}
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Belum ada data pengguna
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;