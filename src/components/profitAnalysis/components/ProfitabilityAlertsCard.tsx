import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  AlertTriangle, 
  TrendingDown, 
  DollarSign, 
  Activity,
  Droplets,
  Settings,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';
import { 
  ProfitabilityAlert, 
  ProfitabilityAlertsSystem, 
  AlertConfiguration,
  getAlertIcon,
  getAlertColor,
  getAlertBgColor,
  formatAlertMessage,
  shouldShowNotification
} from '../utils/profitabilityAlerts';
import { RealTimeProfitCalculation } from '../types/profitAnalysis.types';
import { BusinessType } from '../utils/config/profitConfig';

interface ProfitabilityAlertsCardProps {
  currentData: RealTimeProfitCalculation;
  historicalData?: RealTimeProfitCalculation[];
  businessType: BusinessType;
  onConfigChange?: (config: AlertConfiguration) => void;
}

const ProfitabilityAlertsCard: React.FC<ProfitabilityAlertsCardProps> = ({
  currentData,
  historicalData = [],
  businessType,
  onConfigChange
}) => {
  const [alertSystem, setAlertSystem] = useState<ProfitabilityAlertsSystem | null>(null);
  const [alerts, setAlerts] = useState<ProfitabilityAlert[]>([]);
  const [config, setConfig] = useState<AlertConfiguration>({
    enabled: true,
    thresholds: {
      marginDrop: { warning: 10, critical: 20 },
      costSpike: { warning: 15, critical: 25 },
      revenueDrop: { warning: 15, critical: 30 },
      efficiencyDecline: { warning: 10, critical: 20 },
      cashFlowWarning: { warning: 30, critical: 15 }
    },
    notificationMethods: ['in_app'],
    businessType
  });
  const [activeTab, setActiveTab] = useState('alerts');

  // Initialize alert system
  useEffect(() => {
    const system = new ProfitabilityAlertsSystem(config);
    setAlertSystem(system);
  }, [config]);

  // Generate alerts when data changes
  useEffect(() => {
    if (alertSystem && currentData) {
      const newAlerts = alertSystem.analyzeAndGenerateAlerts(currentData, historicalData);
      setAlerts(newAlerts);
    }
  }, [alertSystem, currentData, historicalData]);

  const handleConfigChange = (newConfig: Partial<AlertConfiguration>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    onConfigChange?.(updatedConfig);
  };

  const getAlertTypeIcon = (type: ProfitabilityAlert['type']) => {
    switch (type) {
      case 'margin_drop': return <TrendingDown className="h-4 w-4" />;
      case 'cost_spike': return <DollarSign className="h-4 w-4" />;
      case 'revenue_drop': return <Activity className="h-4 w-4" />;
      case 'efficiency_decline': return <Target className="h-4 w-4" />;
      case 'cash_flow_warning': return <Droplets className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityBadgeVariant = (severity: ProfitabilityAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
  const highAlerts = alerts.filter(alert => alert.severity === 'high');
  const otherAlerts = alerts.filter(alert => !['critical', 'high'].includes(alert.severity));

  const AlertItem: React.FC<{ alert: ProfitabilityAlert }> = ({ alert }) => (
    <div className={`p-4 rounded-lg border ${getAlertBgColor(alert.severity)}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {getAlertTypeIcon(alert.type)}
          <h4 className="font-medium text-sm">{alert.title}</h4>
        </div>
        <Badge variant={getSeverityBadgeVariant(alert.severity)} className="text-xs">
          {alert.severity.toUpperCase()}
        </Badge>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{alert.message}</p>
      
      <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
        <div>
          <span className="text-gray-500">Nilai Saat Ini:</span>
          <p className="font-medium">
            {alert.type.includes('percentage') || alert.type === 'margin_drop' || alert.type === 'efficiency_decline'
              ? `${alert.value.toFixed(1)}%`
              : `Rp ${alert.value.toLocaleString('id-ID')}`
            }
          </p>
        </div>
        <div>
          <span className="text-gray-500">Perubahan:</span>
          <p className={`font-medium ${alert.change < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {alert.changePercentage > 0 ? '+' : ''}{alert.changePercentage.toFixed(1)}%
          </p>
        </div>
      </div>
      
      {alert.recommendations.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-700 mb-1">Rekomendasi:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            {alert.recommendations.slice(0, 2).map((rec, index) => (
              <li key={index} className="flex items-start gap-1">
                <span className="text-blue-500 mt-0.5">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
        <span className="text-xs text-gray-500">
          {new Date(alert.timestamp).toLocaleString('id-ID')}
        </span>
        {alert.actionRequired && (
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Perlu Tindakan
          </Badge>
        )}
      </div>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-600" />
            <div>
              <CardTitle className="text-lg">Sistem Peringatan Profitabilitas</CardTitle>
              <CardDescription>
                Monitoring otomatis untuk margin, biaya, dan performa bisnis
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={config.enabled}
              onCheckedChange={(enabled) => handleConfigChange({ enabled })}
            />
            <span className="text-sm text-gray-600">
              {config.enabled ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!config.enabled ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Sistem peringatan sedang dinonaktifkan. Aktifkan untuk mendapatkan notifikasi real-time.
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="alerts" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Peringatan
                {alerts.length > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs">
                    {alerts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Ringkasan
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Pengaturan
              </TabsTrigger>
            </TabsList>

            <TabsContent value="alerts" className="mt-4">
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-900 mb-1">Tidak Ada Peringatan</h3>
                  <p className="text-sm text-gray-500">
                    Semua metrik bisnis dalam kondisi normal
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {/* Critical Alerts */}
                    {criticalAlerts.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Peringatan Kritis ({criticalAlerts.length})
                        </h4>
                        <div className="space-y-3">
                          {criticalAlerts.map((alert) => (
                            <AlertItem key={alert.id} alert={alert} />
                          ))}
                        </div>
                        <Separator className="my-4" />
                      </div>
                    )}

                    {/* High Priority Alerts */}
                    {highAlerts.length > 0 && (
                      <div>
                        <h4 className="font-medium text-orange-600 mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Peringatan Tinggi ({highAlerts.length})
                        </h4>
                        <div className="space-y-3">
                          {highAlerts.map((alert) => (
                            <AlertItem key={alert.id} alert={alert} />
                          ))}
                        </div>
                        <Separator className="my-4" />
                      </div>
                    )}

                    {/* Other Alerts */}
                    {otherAlerts.length > 0 && (
                      <div>
                        <h4 className="font-medium text-blue-600 mb-2 flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          Peringatan Lainnya ({otherAlerts.length})
                        </h4>
                        <div className="space-y-3">
                          {otherAlerts.map((alert) => (
                            <AlertItem key={alert.id} alert={alert} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="summary" className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{criticalAlerts.length}</div>
                  <div className="text-sm text-red-700">Kritis</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{highAlerts.length}</div>
                  <div className="text-sm text-orange-700">Tinggi</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{otherAlerts.length}</div>
                  <div className="text-sm text-blue-700">Lainnya</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{alerts.length}</div>
                  <div className="text-sm text-gray-700">Total</div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Kategori Peringatan</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {['profitability', 'cost', 'efficiency', 'cash_flow'].map((category) => {
                    const categoryAlerts = alerts.filter(alert => alert.category === category);
                    const categoryLabels = {
                      profitability: 'Profitabilitas',
                      cost: 'Biaya',
                      efficiency: 'Efisiensi',
                      cash_flow: 'Cash Flow'
                    };
                    
                    return (
                      <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium">
                          {categoryLabels[category as keyof typeof categoryLabels]}
                        </span>
                        <Badge variant="outline">{categoryAlerts.length}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-4">
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Metode Notifikasi</h4>
                  <div className="space-y-2">
                    {['in_app', 'email', 'whatsapp'].map((method) => {
                      const methodLabels = {
                        in_app: 'Notifikasi Aplikasi',
                        email: 'Email',
                        whatsapp: 'WhatsApp'
                      };
                      
                      return (
                        <div key={method} className="flex items-center justify-between">
                          <span className="text-sm">
                            {methodLabels[method as keyof typeof methodLabels]}
                          </span>
                          <Switch
                            checked={config.notificationMethods.includes(method as any)}
                            onCheckedChange={(checked) => {
                              const methods = checked
                                ? [...config.notificationMethods, method as any]
                                : config.notificationMethods.filter(m => m !== method);
                              handleConfigChange({ notificationMethods: methods });
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">Threshold Peringatan</h4>
                  <div className="text-sm text-gray-600 mb-4">
                    Sesuaikan batas peringatan berdasarkan kebutuhan bisnis Anda
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-sm mb-2">Penurunan Margin</div>
                      <div className="text-xs text-gray-600">
                        Warning: {config.thresholds.marginDrop.warning}% | 
                        Critical: {config.thresholds.marginDrop.critical}%
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-sm mb-2">Lonjakan Biaya</div>
                      <div className="text-xs text-gray-600">
                        Warning: {config.thresholds.costSpike.warning}% | 
                        Critical: {config.thresholds.costSpike.critical}%
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-sm mb-2">Penurunan Revenue</div>
                      <div className="text-xs text-gray-600">
                        Warning: {config.thresholds.revenueDrop.warning}% | 
                        Critical: {config.thresholds.revenueDrop.critical}%
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-sm mb-2">Cash Flow</div>
                      <div className="text-xs text-gray-600">
                        Warning: {config.thresholds.cashFlowWarning.warning} hari | 
                        Critical: {config.thresholds.cashFlowWarning.critical} hari
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfitabilityAlertsCard;