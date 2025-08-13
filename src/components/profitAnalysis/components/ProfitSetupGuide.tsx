// src/components/profitAnalysis/components/ProfitSetupGuide.tsx
// ✅ PROFIT SETUP GUIDE - Help users setup Real Profit Margin

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  Circle,
  AlertCircle,
  ArrowRight,
  Package,
  Calculator,
  DollarSign,
  Settings,
  ExternalLink,
  BookOpen,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  link?: string;
  icon: React.ComponentType<any>;
}

interface ProfitSetupGuideProps {
  hasTransactions: boolean;
  hasOperationalCosts: boolean;
  hasWarehouseData: boolean;
  hasAllocationSettings: boolean;
  onNavigate?: (path: string) => void;
  className?: string;
}

// ✅ STEP COMPONENT
const SetupStepCard: React.FC<{
  step: SetupStep;
  onAction?: () => void;
}> = ({ step, onAction }) => {
  const Icon = step.icon;
  
  return (
    <Card className={cn(
      "border-l-4 transition-all hover:shadow-md",
      step.completed 
        ? "border-green-500 bg-green-50" 
        : step.required 
        ? "border-orange-500 bg-orange-50" 
        : "border-gray-300"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {step.completed ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Circle className="h-5 w-5 text-gray-400" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-4 w-4 text-gray-600" />
              <h4 className="font-medium text-sm">{step.title}</h4>
              {step.required && !step.completed && (
                <Badge variant="outline" className="text-xs">Wajib</Badge>
              )}
            </div>
            
            <p className="text-xs text-gray-600 mb-3">{step.description}</p>
            
            {!step.completed && onAction && (
              <Button 
                size="sm" 
                variant={step.required ? "default" : "outline"}
                onClick={onAction}
                className="text-xs"
              >
                {step.required ? "Setup Sekarang" : "Setup (Opsional)"}
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ✅ MAIN COMPONENT
export const ProfitSetupGuide: React.FC<ProfitSetupGuideProps> = ({
  hasTransactions,
  hasOperationalCosts,
  hasWarehouseData,
  hasAllocationSettings,
  onNavigate,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Define setup steps
  const steps: SetupStep[] = [
    {
      id: 'transactions',
      title: 'Data Transaksi Keuangan',
      description: 'Tambahkan transaksi pemasukan dan pengeluaran untuk tracking revenue',
      completed: hasTransactions,
      required: true,
      link: '/financial',
      icon: DollarSign
    },
    {
      id: 'operational-costs',
      title: 'Biaya Operasional',
      description: 'Setup biaya tetap dan variabel untuk OPEX calculation',
      completed: hasOperationalCosts,
      required: true,
      link: '/operational-costs',
      icon: Calculator
    },
    {
      id: 'warehouse',
      title: 'Data Warehouse/Inventory',
      description: 'Tambahkan data bahan baku untuk HPP calculation yang akurat',
      completed: hasWarehouseData,
      required: false,
      link: '/warehouse',
      icon: Package
    },
    {
      id: 'allocation',
      title: 'Pengaturan Alokasi Biaya',
      description: 'Konfigurasi metode alokasi overhead untuk perhitungan HPP',
      completed: hasAllocationSettings,
      required: false,
      link: '/operational-costs/settings',
      icon: Settings
    }
  ];

  // Calculate progress
  const totalSteps = steps.length;
  const completedSteps = steps.filter(step => step.completed).length;
  const requiredSteps = steps.filter(step => step.required);
  const completedRequiredSteps = requiredSteps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / totalSteps) * 100;
  const canCalculateProfit = completedRequiredSteps === requiredSteps.length;

  // Handle navigation
  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      // Default navigation (you might want to use router here)
      window.location.href = path;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Setup Real Profit Margin
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Lengkapi setup untuk analisis profit margin yang akurat
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Sembunyikan' : 'Lihat Detail'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progress Setup</span>
            <span className="text-sm text-gray-500">
              {completedSteps}/{totalSteps} selesai
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          
          {canCalculateProfit ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                ✅ Setup minimum selesai! Anda sudah bisa menghitung real profit margin.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-700">
                ⚠️ Perlu melengkapi {requiredSteps.length - completedRequiredSteps} setup wajib untuk menghitung profit margin.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Quick Actions */}
        {!canCalculateProfit && (
          <div className="bg-blue-50 p-4 rounded">
            <h4 className="font-medium text-blue-800 mb-2">🚀 Quick Start</h4>
            <div className="space-y-2">
              {requiredSteps.filter(step => !step.completed).map(step => (
                <Button
                  key={step.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigate(step.link || '#')}
                  className="w-full justify-start"
                >
                  <step.icon className="mr-2 h-4 w-4" />
                  Setup {step.title}
                  <ExternalLink className="ml-auto h-3 w-3" />
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Steps */}
        {isExpanded && (
          <div className="space-y-3">
            <h4 className="font-medium">Detail Setup:</h4>
            {steps.map(step => (
              <SetupStepCard
                key={step.id}
                step={step}
                onAction={step.link ? () => handleNavigate(step.link!) : undefined}
              />
            ))}
          </div>
        )}

        {/* Benefits Section */}
        <div className="bg-purple-50 p-4 rounded">
          <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Manfaat Real Profit Margin
          </h4>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>• <strong>Akurasi Tinggi:</strong> Menghitung profit sesungguhnya, bukan hanya cash flow</li>
            <li>• <strong>HPP Calculation:</strong> Tracking material cost yang akurat dari warehouse</li>
            <li>• <strong>COGS vs OPEX:</strong> Pemisahan biaya produksi dan operasional</li>
            <li>• <strong>Benchmark Analysis:</strong> Perbandingan dengan standar industri</li>
            <li>• <strong>Actionable Insights:</strong> Rekomendasi untuk meningkatkan profitabilitas</li>
          </ul>
        </div>

        {/* Help Links */}
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" className="text-xs">
            <BookOpen className="mr-1 h-3 w-3" />
            Panduan Lengkap
          </Button>
          <Button variant="ghost" size="sm" className="text-xs">
            <ExternalLink className="mr-1 h-3 w-3" />
            Contoh Case Study
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfitSetupGuide;