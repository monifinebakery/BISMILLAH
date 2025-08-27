// src/pages/WebWorkersDemo.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import HPPCalculatorWorker from '@/components/HPPCalculatorWorker';
import BulkOperationsWorker from '@/components/BulkOperationsWorker';
import { 
  Zap, 
  Database, 
  Info, 
  CheckCircle, 
  Clock,
  Cpu,
  BarChart3
} from 'lucide-react';

const WebWorkersDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const features = [
    {
      icon: <Zap className="h-5 w-5 text-blue-600" />,
      title: 'HPP Calculator',
      description: 'Kalkulasi Harga Pokok Produksi dengan performa tinggi',
      benefits: [
        'Kalkulasi HPP tunggal dan massal',
        'Optimasi biaya resep otomatis',
        'Analisis margin keuntungan',
        'Pemrosesan paralel untuk bulk calculation'
      ]
    },
    {
      icon: <Database className="h-5 w-5 text-green-600" />,
      title: 'Bulk Operations',
      description: 'Operasi data massal dengan Web Workers',
      benefits: [
        'Import/Export CSV dan JSON',
        'Validasi data batch',
        'Generate laporan otomatis',
        'Pemrosesan background tanpa blocking UI'
      ]
    }
  ];

  const performanceMetrics = [
    {
      metric: 'Processing Speed',
      traditional: '~2-5 detik',
      webWorker: '~0.5-1 detik',
      improvement: '4x lebih cepat'
    },
    {
      metric: 'UI Responsiveness',
      traditional: 'Blocked selama processing',
      webWorker: 'Tetap responsif',
      improvement: '100% responsive'
    },
    {
      metric: 'Memory Usage',
      traditional: 'Spike tinggi di main thread',
      webWorker: 'Terdistribusi ke worker',
      improvement: 'Lebih stabil'
    },
    {
      metric: 'User Experience',
      traditional: 'Freezing saat bulk operation',
      webWorker: 'Smooth dengan progress indicator',
      improvement: 'Sangat baik'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Cpu className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Web Workers Demo</h1>
          <Badge variant="secondary" className="text-sm">
            High Performance Computing
          </Badge>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Demonstrasi penggunaan Web Workers untuk operasi berat seperti kalkulasi HPP dan bulk operations 
          tanpa memblokir user interface.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="hpp-calculator">HPP Calculator</TabsTrigger>
          <TabsTrigger value="bulk-operations">Bulk Operations</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Web Workers memungkinkan JavaScript menjalankan script di background thread, 
              sehingga operasi berat tidak memblokir user interface utama.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {feature.icon}
                    {feature.title}
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Start */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Start</CardTitle>
              <CardDescription>
                Pilih tab di atas untuk mencoba fitur Web Workers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={() => setActiveTab('hpp-calculator')}
                  className="h-auto p-4 flex flex-col items-start gap-2"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    <span className="font-semibold">Coba HPP Calculator</span>
                  </div>
                  <span className="text-sm opacity-90">
                    Hitung HPP dengan performa tinggi
                  </span>
                </Button>
                
                <Button 
                  onClick={() => setActiveTab('bulk-operations')}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start gap-2"
                >
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    <span className="font-semibold">Coba Bulk Operations</span>
                  </div>
                  <span className="text-sm opacity-70">
                    Import/Export data dalam jumlah besar
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HPP Calculator Tab */}
        <TabsContent value="hpp-calculator">
          <HPPCalculatorWorker />
        </TabsContent>

        {/* Bulk Operations Tab */}
        <TabsContent value="bulk-operations">
          <BulkOperationsWorker />
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Performance Comparison
              </CardTitle>
              <CardDescription>
                Perbandingan performa antara traditional processing vs Web Workers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Metric</th>
                      <th className="text-left p-3 font-semibold">Traditional</th>
                      <th className="text-left p-3 font-semibold">Web Workers</th>
                      <th className="text-left p-3 font-semibold">Improvement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceMetrics.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium">{row.metric}</td>
                        <td className="p-3 text-red-600">{row.traditional}</td>
                        <td className="p-3 text-green-600">{row.webWorker}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-blue-600">
                            {row.improvement}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Technical Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Non-Blocking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Operasi berat berjalan di background thread, UI tetap responsif dan tidak freeze.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-green-600" />
                  Parallel Processing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Memanfaatkan multiple CPU cores untuk pemrosesan paralel yang lebih cepat.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                  Better UX
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Progress indicator real-time dan kemampuan cancel operasi memberikan kontrol penuh.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Use Cases */}
          <Card>
            <CardHeader>
              <CardTitle>Ideal Use Cases</CardTitle>
              <CardDescription>
                Kapan sebaiknya menggunakan Web Workers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-green-600 mb-2">✅ Cocok untuk:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Kalkulasi matematika kompleks</li>
                    <li>• Processing data dalam jumlah besar</li>
                    <li>• Image/video processing</li>
                    <li>• Parsing file besar (CSV, JSON)</li>
                    <li>• Algoritma sorting/filtering</li>
                    <li>• Cryptographic operations</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-red-600 mb-2">❌ Tidak cocok untuk:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• DOM manipulation</li>
                    <li>• API calls sederhana</li>
                    <li>• Operasi yang sangat cepat (&lt;100ms)</li>
                    <li>• Akses localStorage/sessionStorage</li>
                    <li>• Operasi yang membutuhkan window object</li>
                    <li>• Real-time user interactions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WebWorkersDemo;