// src/components/NetworkOptimizationDemo.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  useNetworkOptimization, 
  useApiRequest, 
  useRequestDeduplication, 
  useIntelligentRetry 
} from '@/hooks/useNetworkOptimization';
import { formatDuration } from '@/utils/formatters';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Activity,
  BarChart3,
  Shield,
  Repeat,
  Copy,
  Trash2,
  Play,
  Pause,
  AlertTriangle
} from 'lucide-react';

interface TestRequest {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  status: 'pending' | 'loading' | 'success' | 'error';
  startTime?: number;
  endTime?: number;
  error?: string;
  isDuplicate?: boolean;
  retryCount?: number;
}

const NetworkOptimizationDemo: React.FC = () => {
  const {
    makeRequest,
    cancelRequest,
    cancelAllRequests,
    queueRequest,
    clearCaches,
    stats,
    resetStats,
    isOnline,
    connectionType,
    requestQueue,
    pendingRequestsCount
  } = useNetworkOptimization();

  const { get, post, put, delete: del } = useApiRequest();
  const { duplicateRequests, deduplicationRate } = useRequestDeduplication();
  const { retriedRequests, successRate } = useIntelligentRetry();

  const [testRequests, setTestRequests] = useState<TestRequest[]>([]);
  const [customUrl, setCustomUrl] = useState('https://jsonplaceholder.typicode.com/posts/1');
  const [customMethod, setCustomMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [customData, setCustomData] = useState('{}');
  const [isAutoTesting, setIsAutoTesting] = useState(false);
  const [logs, setLogs] = useState<Array<{ time: string; message: string; type: 'info' | 'success' | 'error' | 'warning' }>>([]);

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const newLog = {
      time: new Date().toLocaleTimeString(),
      message,
      type
    };
    setLogs(prev => [newLog, ...prev.slice(0, 19)]); // Keep only last 20 logs
  };

  const addTestRequest = (url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE'): TestRequest => {
    const request: TestRequest = {
      id: Date.now().toString(),
      url,
      method,
      status: 'pending',
      startTime: Date.now()
    };
    setTestRequests(prev => [request, ...prev.slice(0, 9)]); // Keep only last 10 requests
    return request;
  };

  const updateTestRequest = (id: string, updates: Partial<TestRequest>) => {
    setTestRequests(prev => prev.map(req => 
      req.id === id ? { ...req, ...updates } : req
    ));
  };

  const executeRequest = async (url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: any) => {
    const request = addTestRequest(url, method);
    updateTestRequest(request.id, { status: 'loading' });
    addLog(`Memulai ${method} request ke ${url}`);

    try {
      let result;
      const startTime = Date.now();

      switch (method) {
        case 'GET':
          result = await get(url);
          break;
        case 'POST':
          result = await post(url, data);
          break;
        case 'PUT':
          result = await put(url, data);
          break;
        case 'DELETE':
          result = await del(url);
          break;
      }

      const endTime = Date.now();
      updateTestRequest(request.id, { 
        status: 'success', 
        endTime,
        retryCount: 0
      });
      addLog(`${method} request berhasil dalam ${endTime - startTime}ms`, 'success');
      return result;
    } catch (error: any) {
      updateTestRequest(request.id, { 
        status: 'error', 
        error: error.message,
        endTime: Date.now()
      });
      addLog(`${method} request gagal: ${error.message}`, 'error');
      throw error;
    }
  };

  // Test deduplication by making multiple identical requests
  const testDeduplication = async () => {
    addLog('Memulai test deduplication dengan 5 request identik', 'info');
    const url = 'https://jsonplaceholder.typicode.com/posts/1';
    
    const promises = Array.from({ length: 5 }, (_, i) => {
      const request = addTestRequest(url, 'GET');
      updateTestRequest(request.id, { status: 'loading', isDuplicate: i > 0 });
      return executeRequest(url, 'GET').catch(() => {});
    });

    await Promise.allSettled(promises);
    addLog('Test deduplication selesai', 'success');
  };

  // Test retry mechanism with a failing endpoint
  const testRetryMechanism = async () => {
    addLog('Memulai test retry mechanism dengan endpoint yang gagal', 'info');
    const url = 'https://httpstat.us/500'; // This will return 500 error
    
    try {
      await executeRequest(url, 'GET');
    } catch (error) {
      addLog('Test retry mechanism selesai (expected failure)', 'warning');
    }
  };

  // Test offline queueing
  const testOfflineQueue = async () => {
    if (isOnline) {
      addLog('Simulasi offline mode untuk test queue', 'info');
      // Simulate offline by queuing requests
      const requests = [
        { url: 'https://jsonplaceholder.typicode.com/posts/1', method: 'GET' as const },
        { url: 'https://jsonplaceholder.typicode.com/posts/2', method: 'GET' as const },
        { url: 'https://jsonplaceholder.typicode.com/posts/3', method: 'GET' as const }
      ];
      
      requests.forEach(req => {
        queueRequest(req);
        addLog(`Request ${req.method} ${req.url} ditambahkan ke queue`, 'info');
      });
    } else {
      addLog('Sedang offline, request akan di-queue otomatis', 'warning');
    }
  };

  // Auto testing function
  const runAutoTest = async () => {
    if (!isAutoTesting) return;
    
    const tests = [
      () => executeRequest('https://jsonplaceholder.typicode.com/posts/1', 'GET'),
      () => executeRequest('https://jsonplaceholder.typicode.com/posts/2', 'GET'),
      () => executeRequest('https://jsonplaceholder.typicode.com/users/1', 'GET'),
      () => testDeduplication(),
    ];
    
    const randomTest = tests[Math.floor(Math.random() * tests.length)];
    try {
      await randomTest();
    } catch (error) {
      // Ignore errors in auto test
    }
    
    // Schedule next test
    setTimeout(runAutoTest, 2000 + Math.random() * 3000);
  };

  // Start/stop auto testing
  const toggleAutoTesting = () => {
    setIsAutoTesting(prev => {
      const newValue = !prev;
      if (newValue) {
        addLog('Auto testing dimulai', 'info');
        runAutoTest();
      } else {
        addLog('Auto testing dihentikan', 'info');
      }
      return newValue;
    });
  };

  // Execute custom request
  const executeCustomRequest = async () => {
    try {
      const data = customData ? JSON.parse(customData) : undefined;
      await executeRequest(customUrl, customMethod, data);
    } catch (error: any) {
      addLog(`Error parsing JSON data: ${error.message}`, 'error');
    }
  };

  const getStatusIcon = (status: TestRequest['status']) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getConnectionIcon = () => {
    if (!isOnline) {
      return <WifiOff className="h-4 w-4 text-red-500" />;
    }
    
    switch (connectionType) {
      case 'slow-2g':
      case '2g':
        return <Wifi className="h-4 w-4 text-red-500" />;
      case '3g':
        return <Wifi className="h-4 w-4 text-yellow-500" />;
      case '4g':
      default:
        return <Wifi className="h-4 w-4 text-green-500" />;
    }
  };

  useEffect(() => {
    if (isAutoTesting) {
      runAutoTest();
    }
  }, [isAutoTesting]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Demo Network Optimization</h2>
          <p className="text-muted-foreground">
            Demonstrasi request deduplication, intelligent retry, dan optimasi jaringan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isOnline ? 'default' : 'destructive'}>
            {getConnectionIcon()}
            {isOnline ? `Online (${connectionType})` : 'Offline'}
          </Badge>
          <Badge variant={isAutoTesting ? 'default' : 'secondary'}>
            <Activity className="h-3 w-3 mr-1" />
            Auto Test {isAutoTesting ? 'ON' : 'OFF'}
          </Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests}</div>
            <p className="text-xs text-muted-foreground">
              {pendingRequestsCount} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <Progress value={successRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deduplication</CardTitle>
            <Copy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{duplicateRequests}</div>
            <p className="text-xs text-muted-foreground">
              {deduplicationRate.toFixed(1)}% rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.averageResponseTime)}ms</div>
            <p className="text-xs text-muted-foreground">
              {stats.cacheHits} cache hits
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="testing" className="space-y-4">
        <TabsList>
          <TabsTrigger value="testing">Request Testing</TabsTrigger>
          <TabsTrigger value="deduplication">Deduplication</TabsTrigger>
          <TabsTrigger value="retry">Intelligent Retry</TabsTrigger>
          <TabsTrigger value="offline">Offline Queue</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="testing" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Custom Request</CardTitle>
                <CardDescription>
                  Test custom API endpoints dengan berbagai metode HTTP
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://api.example.com/endpoint"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="method">Method</Label>
                  <select
                    id="method"
                    value={customMethod}
                    onChange={(e) => setCustomMethod(e.target.value as any)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
                
                {(customMethod === 'POST' || customMethod === 'PUT') && (
                  <div className="space-y-2">
                    <Label htmlFor="data">Request Body (JSON)</Label>
                    <textarea
                      id="data"
                      value={customData}
                      onChange={(e) => setCustomData(e.target.value)}
                      className="w-full p-2 border rounded-md h-20"
                      placeholder='{"key": "value"}'
                    />
                  </div>
                )}
                
                <Button onClick={executeCustomRequest} className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Execute Request
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Tests</CardTitle>
                <CardDescription>
                  Test berbagai skenario network optimization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => executeRequest('https://jsonplaceholder.typicode.com/posts/1', 'GET')}
                  variant="outline" 
                  className="w-full"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Simple GET Request
                </Button>
                
                <Button 
                  onClick={testDeduplication}
                  variant="outline" 
                  className="w-full"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Test Deduplication
                </Button>
                
                <Button 
                  onClick={testRetryMechanism}
                  variant="outline" 
                  className="w-full"
                >
                  <Repeat className="h-4 w-4 mr-2" />
                  Test Retry Mechanism
                </Button>
                
                <Button 
                  onClick={testOfflineQueue}
                  variant="outline" 
                  className="w-full"
                >
                  <WifiOff className="h-4 w-4 mr-2" />
                  Test Offline Queue
                </Button>
                
                <Separator />
                
                <Button 
                  onClick={toggleAutoTesting}
                  variant={isAutoTesting ? 'destructive' : 'default'}
                  className="w-full"
                >
                  {isAutoTesting ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {isAutoTesting ? 'Stop' : 'Start'} Auto Testing
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Requests</CardTitle>
              <CardDescription>
                History request terakhir dengan status dan timing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {testRequests.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada request yang dijalankan
                  </p>
                ) : (
                  testRequests.map((request) => (
                    <div 
                      key={request.id} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(request.status)}
                        <div>
                          <div className="font-medium">
                            {request.method} {request.url}
                            {request.isDuplicate && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                Duplicate
                              </Badge>
                            )}
                          </div>
                          {request.error && (
                            <div className="text-sm text-red-600">{request.error}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {request.endTime && request.startTime && (
                          <div>{request.endTime - request.startTime}ms</div>
                        )}
                        {request.retryCount !== undefined && request.retryCount > 0 && (
                          <div>{request.retryCount} retries</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deduplication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Request Deduplication</CardTitle>
              <CardDescription>
                Mencegah request duplikat untuk menghemat bandwidth dan meningkatkan performa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalRequests}</div>
                  <div className="text-sm text-muted-foreground">Total Requests</div>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">{duplicateRequests}</div>
                  <div className="text-sm text-muted-foreground">Deduplicated</div>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{deduplicationRate.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Efficiency Rate</div>
                </div>
              </div>
              
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Request deduplication secara otomatis mendeteksi dan menggabungkan request identik 
                  yang sedang berjalan, mengurangi beban server dan mempercepat response time.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <h4 className="font-medium">Pending Requests: {pendingRequestsCount}</h4>
                <Progress value={(pendingRequestsCount / 10) * 100} className="w-full" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retry" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Intelligent Retry Mechanism</CardTitle>
              <CardDescription>
                Retry otomatis dengan exponential backoff untuk menangani network errors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.successfulRequests}</div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.failedRequests}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{retriedRequests}</div>
                  <div className="text-sm text-muted-foreground">Retried</div>
                </div>
              </div>
              
              <Alert>
                <Repeat className="h-4 w-4" />
                <AlertDescription>
                  Intelligent retry menggunakan exponential backoff dengan jitter untuk mencegah 
                  thundering herd effect. Retry hanya dilakukan untuk error yang dapat dipulihkan.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <h4 className="font-medium">Success Rate</h4>
                <Progress value={successRate} className="w-full" />
                <div className="text-sm text-muted-foreground">{successRate.toFixed(1)}%</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Offline Request Queue</CardTitle>
              <CardDescription>
                Queue request saat offline dan proses otomatis saat koneksi kembali
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Network Status</div>
                  <div className="text-sm text-muted-foreground">
                    {isOnline ? `Online (${connectionType})` : 'Offline'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getConnectionIcon()}
                  <Badge variant={isOnline ? 'default' : 'destructive'}>
                    {isOnline ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Queued Requests</h4>
                  <Badge variant="outline">{requestQueue.length}</Badge>
                </div>
                
                {requestQueue.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {requestQueue.map((req, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{req.method} {req.url}</span>
                        <Badge variant="secondary">Queued</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Tidak ada request dalam queue
                  </p>
                )}
              </div>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Request akan secara otomatis di-queue saat offline dan diproses ketika 
                  koneksi internet kembali tersedia.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Monitoring</CardTitle>
              <CardDescription>
                Monitor performa jaringan dan statistik request real-time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Request Statistics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Requests:</span>
                      <span className="font-medium">{stats.totalRequests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Successful:</span>
                      <span className="font-medium text-green-600">{stats.successfulRequests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Failed:</span>
                      <span className="font-medium text-red-600">{stats.failedRequests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duplicates:</span>
                      <span className="font-medium text-orange-600">{stats.duplicateRequests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Retries:</span>
                      <span className="font-medium text-blue-600">{stats.retriedRequests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cache Hits:</span>
                      <span className="font-medium text-purple-600">{stats.cacheHits}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Performance Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Avg Response Time:</span>
                      <span className="font-medium">{Math.round(stats.averageResponseTime)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success Rate:</span>
                      <span className="font-medium">{successRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Deduplication Rate:</span>
                      <span className="font-medium">{deduplicationRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Network Errors:</span>
                      <span className="font-medium">{stats.networkErrors}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending Requests:</span>
                      <span className="font-medium">{pendingRequestsCount}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex gap-2">
                <Button onClick={resetStats} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Stats
                </Button>
                <Button onClick={clearCaches} variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Caches
                </Button>
                <Button onClick={cancelAllRequests} variant="outline" size="sm">
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel All
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Activity Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>
                Log aktivitas network optimization real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada aktivitas network
                  </p>
                ) : (
                  logs.map((log, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center gap-2 p-2 rounded text-sm ${
                        log.type === 'success' ? 'bg-green-50 text-green-700' :
                        log.type === 'error' ? 'bg-red-50 text-red-700' :
                        log.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-blue-50 text-blue-700'
                      }`}
                    >
                      <span className="text-xs text-muted-foreground">{log.time}</span>
                      <span className="flex-1">{log.message}</span>
                      {log.type === 'success' && <CheckCircle className="h-3 w-3" />}
                      {log.type === 'error' && <XCircle className="h-3 w-3" />}
                      {log.type === 'warning' && <AlertTriangle className="h-3 w-3" />}
                    </div>
                  ))
                )}
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => setLogs([])}
                  variant="outline"
                  size="sm"
                >
                  Clear Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NetworkOptimizationDemo;