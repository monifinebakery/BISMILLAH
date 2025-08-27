// src/components/PreloadingDemo.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePreloading } from '@/hooks/usePreloading';
import { formatDuration } from '@/utils/formatters';
import { 
  Download, 
  Image, 
  FileText, 
  Zap, 
  Eye, 
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  MousePointer,
  Wifi,
  BarChart3
} from 'lucide-react';

const PreloadingDemo: React.FC = () => {
  const {
    preloadImage,
    preloadFont,
    preloadScript,
    preloadStyle,
    prefetchData,
    prefetchRoute,
    handleLinkHover,
    handleLinkLeave,
    preloadOnViewport,
    preloadOnIdle,
    getCachedData,
    getPrefetchStatus,
    getPreloadStatus,
    preloadedResources,
    clearAllCaches
  } = usePreloading();

  const [resourceUrl, setResourceUrl] = useState('');
  const [resourceType, setResourceType] = useState<'image' | 'font' | 'script' | 'style'>('image');
  const [routeUrl, setRouteUrl] = useState('/dashboard');
  const [apiEndpoint, setApiEndpoint] = useState('/api/products');
  const [preloadStats, setPreloadStats] = useState({
    totalPreloaded: 0,
    successfulPreloads: 0,
    failedPreloads: 0,
    averageLoadTime: 0
  });

  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportPreloadTriggered, setViewportPreloadTriggered] = useState(false);
  const [idlePreloadTriggered, setIdlePreloadTriggered] = useState(false);

  // Sample resources untuk demo
  const sampleResources = {
    images: [
      'https://picsum.photos/800/600?random=1',
      'https://picsum.photos/800/600?random=2',
      'https://picsum.photos/800/600?random=3'
    ],
    fonts: [
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
      'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap'
    ],
    scripts: [
      'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js'
    ],
    styles: [
      'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css'
    ]
  };

  const sampleRoutes = [
    '/dashboard',
    '/products',
    '/orders',
    '/customers',
    '/analytics',
    '/settings'
  ];

  // Mock API fetcher
  const mockApiFetcher = async (endpoint: string) => {
    const delay = Math.random() * 1000 + 500; // 500-1500ms delay
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return {
      data: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
        value: Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString()
      })),
      meta: {
        total: 10,
        page: 1,
        fetchTime: delay
      }
    };
  };

  const handlePreloadResource = async () => {
    if (!resourceUrl) return;

    const startTime = Date.now();
    try {
      switch (resourceType) {
        case 'image':
          await preloadImage(resourceUrl);
          break;
        case 'font':
          await preloadFont(resourceUrl);
          break;
        case 'script':
          await preloadScript(resourceUrl);
          break;
        case 'style':
          await preloadStyle(resourceUrl);
          break;
      }
      
      const loadTime = Date.now() - startTime;
      setPreloadStats(prev => ({
        totalPreloaded: prev.totalPreloaded + 1,
        successfulPreloads: prev.successfulPreloads + 1,
        failedPreloads: prev.failedPreloads,
        averageLoadTime: (prev.averageLoadTime * prev.successfulPreloads + loadTime) / (prev.successfulPreloads + 1)
      }));
    } catch (error) {
      setPreloadStats(prev => ({
        ...prev,
        totalPreloaded: prev.totalPreloaded + 1,
        failedPreloads: prev.failedPreloads + 1
      }));
    }
  };

  const handlePrefetchData = async () => {
    if (!apiEndpoint) return;

    try {
      await prefetchData(apiEndpoint, () => mockApiFetcher(apiEndpoint));
    } catch (error) {
      console.error('Prefetch failed:', error);
    }
  };

  const handlePrefetchRoute = () => {
    if (!routeUrl) return;
    prefetchRoute(routeUrl);
  };

  const preloadSampleResources = async (type: keyof typeof sampleResources) => {
    const resources = sampleResources[type];
    const promises = resources.map(async (url) => {
      try {
        switch (type) {
          case 'images':
            await preloadImage(url);
            break;
          case 'fonts':
            await preloadFont(url);
            break;
          case 'scripts':
            await preloadScript(url);
            break;
          case 'styles':
            await preloadStyle(url);
            break;
        }
      } catch (error) {
        console.error(`Failed to preload ${type}:`, url, error);
      }
    });

    await Promise.allSettled(promises);
  };

  const preloadSampleRoutes = () => {
    sampleRoutes.forEach(route => prefetchRoute(route));
  };

  // Setup viewport preloading
  useEffect(() => {
    if (viewportRef.current && !viewportPreloadTriggered) {
      const cleanup = preloadOnViewport(viewportRef.current, sampleResources.images.slice(0, 2));
      setViewportPreloadTriggered(true);
      return cleanup;
    }
  }, [preloadOnViewport, viewportPreloadTriggered]);

  // Setup idle preloading
  useEffect(() => {
    if (!idlePreloadTriggered) {
      preloadOnIdle(() => {
        preloadSampleResources('fonts');
        setIdlePreloadTriggered(true);
      });
    }
  }, [preloadOnIdle, idlePreloadTriggered]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'loaded':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Zap className="h-6 w-6 text-purple-600" />
        <h2 className="text-2xl font-bold">Resource Preloading & Prefetching Demo</h2>
        <Badge variant="secondary">Performance Optimization</Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Preloaded</p>
                <p className="text-2xl font-bold">{preloadStats.totalPreloaded}</p>
              </div>
              <Download className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Successful</p>
                <p className="text-2xl font-bold text-green-600">{preloadStats.successfulPreloads}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{preloadStats.failedPreloads}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Load Time</p>
                <p className="text-2xl font-bold">{formatDuration(preloadStats.averageLoadTime)}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="manual">Manual Preloading</TabsTrigger>
          <TabsTrigger value="intelligent">Intelligent Preloading</TabsTrigger>
          <TabsTrigger value="data-prefetch">Data Prefetching</TabsTrigger>
          <TabsTrigger value="status">Status & Monitoring</TabsTrigger>
        </TabsList>

        {/* Manual Preloading Tab */}
        <TabsContent value="manual" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resource Preloading */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Resource Preloading
                </CardTitle>
                <CardDescription>
                  Preload individual resources (images, fonts, scripts, styles)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="resource-url">Resource URL</Label>
                  <Input
                    id="resource-url"
                    value={resourceUrl}
                    onChange={(e) => setResourceUrl(e.target.value)}
                    placeholder="https://example.com/resource.jpg"
                  />
                </div>
                
                <div>
                  <Label>Resource Type</Label>
                  <div className="flex gap-2 mt-1">
                    {(['image', 'font', 'script', 'style'] as const).map((type) => (
                      <Button
                        key={type}
                        variant={resourceType === type ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setResourceType(type)}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <Button
                  onClick={handlePreloadResource}
                  disabled={!resourceUrl}
                  className="w-full"
                >
                  Preload Resource
                </Button>
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Quick Preload Samples</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => preloadSampleResources('images')}
                    >
                      <Image className="h-4 w-4 mr-1" />
                      Images
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => preloadSampleResources('fonts')}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Fonts
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => preloadSampleResources('scripts')}
                    >
                      <Zap className="h-4 w-4 mr-1" />
                      Scripts
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => preloadSampleResources('styles')}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Styles
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Route Prefetching */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  Route Prefetching
                </CardTitle>
                <CardDescription>
                  Prefetch routes untuk navigasi yang lebih cepat
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="route-url">Route URL</Label>
                  <Input
                    id="route-url"
                    value={routeUrl}
                    onChange={(e) => setRouteUrl(e.target.value)}
                    placeholder="/dashboard"
                  />
                </div>
                
                <Button
                  onClick={handlePrefetchRoute}
                  disabled={!routeUrl}
                  className="w-full"
                >
                  Prefetch Route
                </Button>
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Sample Routes</h4>
                  <div className="space-y-1">
                    {sampleRoutes.map((route) => (
                      <Button
                        key={route}
                        variant="ghost"
                        size="sm"
                        onClick={() => prefetchRoute(route)}
                        className="w-full justify-start"
                      >
                        {route}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    onClick={preloadSampleRoutes}
                    className="w-full"
                  >
                    Prefetch All Sample Routes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Intelligent Preloading Tab */}
        <TabsContent value="intelligent" className="space-y-6">
          <Alert>
            <Eye className="h-4 w-4" />
            <AlertDescription>
              Intelligent preloading menggunakan user behavior untuk memutuskan kapan harus preload resources.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hover Intent */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MousePointer className="h-5 w-5" />
                  Hover Intent Prefetching
                </CardTitle>
                <CardDescription>
                  Hover pada link untuk trigger prefetching
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Hover pada link di bawah ini untuk melihat prefetching bekerja:
                  </p>
                  {sampleRoutes.slice(0, 4).map((route) => (
                    <div
                      key={route}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onMouseEnter={() => handleLinkHover(route)}
                      onMouseLeave={() => handleLinkLeave(route)}
                    >
                      <span className="text-blue-600 hover:underline">{route}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Viewport-based Preloading */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Viewport-based Preloading
                </CardTitle>
                <CardDescription>
                  Resources dimuat saat element masuk viewport
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div 
                  ref={viewportRef}
                  className="h-32 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center"
                >
                  <div className="text-center">
                    <Eye className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {viewportPreloadTriggered ? 'Preloading triggered!' : 'Scroll to trigger preloading'}
                    </p>
                  </div>
                </div>
                
                <Alert>
                  <AlertDescription>
                    Status: {viewportPreloadTriggered ? 
                      <Badge variant="default">Triggered</Badge> : 
                      <Badge variant="outline">Waiting</Badge>
                    }
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Idle Preloading Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Idle Preloading
              </CardTitle>
              <CardDescription>
                Resources dimuat saat browser idle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  Idle preloading status: {idlePreloadTriggered ? 
                    <Badge variant="default">Fonts preloaded during idle time</Badge> : 
                    <Badge variant="outline">Waiting for idle time</Badge>
                  }
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Prefetching Tab */}
        <TabsContent value="data-prefetch" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Data Prefetching
              </CardTitle>
              <CardDescription>
                Prefetch API data untuk navigasi yang lebih cepat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="api-endpoint">API Endpoint</Label>
                <Input
                  id="api-endpoint"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  placeholder="/api/products"
                />
              </div>
              
              <Button
                onClick={handlePrefetchData}
                disabled={!apiEndpoint}
                className="w-full"
              >
                Prefetch Data
              </Button>
              
              <Separator />
              
              {/* Show cached data */}
              <div>
                <h4 className="font-semibold mb-2">Cached Data Preview</h4>
                {getCachedData(apiEndpoint) ? (
                  <div className="p-3 bg-muted rounded-lg">
                    <pre className="text-xs overflow-auto max-h-32">
                      {JSON.stringify(getCachedData(apiEndpoint), null, 2)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No cached data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status & Monitoring Tab */}
        <TabsContent value="status" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Preloaded Resources Status</h3>
            <Button variant="outline" onClick={clearAllCaches}>
              Clear All Caches
            </Button>
          </div>
          
          {preloadedResources.length > 0 ? (
            <div className="space-y-2">
              {preloadedResources.map((resource, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{resource.url}</p>
                        <p className="text-xs text-muted-foreground">
                          Type: {resource.type} • {new Date(resource.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(resource.status)}
                        <Badge variant={resource.status === 'loaded' ? 'default' : 
                                     resource.status === 'error' ? 'destructive' : 'secondary'}>
                          {resource.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No resources preloaded yet</p>
                  <p className="text-sm">Try preloading some resources from other tabs</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PreloadingDemo;