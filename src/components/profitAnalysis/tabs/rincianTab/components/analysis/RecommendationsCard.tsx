// src/components/profitAnalysis/tabs/rincianTab/components/analysis/RecommendationsCard.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, Users, Building, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

import { RecommendationsCardProps } from '../../types/components';
import { SECTION_TITLES } from '../../constants/messages';

export const RecommendationsCard: React.FC<RecommendationsCardProps> = ({
  recommendations,
  costStructureAnalysis,
  dataSource,
  isMobile
}) => {
  const getIconForType = (type: string) => {
    switch (type) {
      case 'material': return Package;
      case 'labor': return Users;
      case 'opex': return Building;
      case 'data': return Database;
      default: return Package;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return 'ℹ️';
      default: return '📝';
    }
  };

  return (
    <Card>
      <CardHeader className={cn("p-4", isMobile && "p-3")}>
        <CardTitle className={cn(isMobile && "text-base")}>
          💡 {SECTION_TITLES.RECOMMENDATIONS}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("p-4", isMobile && "p-3")}>
        <div className={cn("grid grid-cols-1 gap-4", !isMobile && "md:grid-cols-2")}>
          
          {/* Recommendations based on Analysis */}
          <div>
            <h5 className={cn("font-medium mb-3", isMobile && "text-sm mb-2")}>
              📊 Berdasarkan Analisis
            </h5>
            <div className="space-y-2 text-sm">
              {recommendations.length > 0 ? (
                recommendations.map((rec, index) => {
                  const Icon = getIconForType(rec.type);
                  return (
                    <Alert key={index} className={cn(
                      "border-l-4",
                      getPriorityColor(rec.priority)
                    )}>
                      <Icon className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <strong className="flex items-center gap-1">
                              {getPriorityIcon(rec.priority)} {rec.title}
                            </strong>
                            <p className={cn("text-xs mt-1", isMobile && "text-[0.65rem]")}>
                              {rec.description}
                            </p>
                            <p className={cn("text-xs mt-1 font-medium text-blue-600", isMobile && "text-[0.65rem]")}>
                              💡 {rec.impact}
                            </p>
                          </div>
                          <div className={cn(
                            "ml-2 px-2 py-1 rounded text-xs font-medium",
                            rec.priority === 'high' ? "bg-red-100 text-red-800" :
                            rec.priority === 'medium' ? "bg-yellow-100 text-yellow-800" :
                            "bg-blue-100 text-blue-800",
                            isMobile && "text-[0.65rem] px-1.5 py-0.5"
                          )}>
                            {rec.priority.toUpperCase()}
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  );
                })
              ) : (
                <div className="p-4 bg-green-50 rounded border border-green-200">
                  <p className="text-green-800 font-medium">✅ Performance Baik</p>
                  <p className="text-green-700 text-xs mt-1">
                    Struktur biaya Anda sudah dalam target yang optimal. 
                    Focus pada continuous improvement.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Strategic Recommendations */}
          <div>
            <h5 className={cn("font-medium mb-3", isMobile && "text-sm mb-2")}>
              🎯 Rekomendasi Strategis
            </h5>
            <div className="space-y-2 text-sm">
              
              {/* Ideal Cost Structure */}
              <div className="p-3 bg-green-50 rounded">
                <p className="font-medium text-green-800">✅ Struktur Biaya Ideal</p>
                <ul className="text-green-700 mt-2 space-y-1 text-xs">
                  <li>• Material: ≤40% dari revenue</li>
                  <li>• Labor: ≤20% dari revenue</li>
                  <li>• OPEX: ≤20% dari revenue</li>
                  <li>• Net Margin: ≥10% dari revenue</li>
                </ul>
              </div>

              {/* Quick Wins */}
              <div className="p-3 bg-blue-50 rounded">
                <p className="font-medium text-blue-800">🔄 Quick Wins</p>
                <ul className="text-blue-700 mt-2 space-y-1 text-xs">
                  <li>• Review kontrak supplier material utama</li>
                  <li>• Eliminasi waste dalam proses produksi</li>
                  <li>• Automate repetitive administrative tasks</li>
                  <li>• Implement material usage tracking</li>
                </ul>
              </div>

              {/* Long-term Goals */}
              <div className="p-3 bg-purple-50 rounded">
                <p className="font-medium text-purple-800">📈 Long-term Goals</p>
                <ul className="text-purple-700 mt-2 space-y-1 text-xs">
                  <li>• Achieve top-quartile margin performance</li>
                  <li>• Develop supplier partnerships</li>
                  <li>• Implement advanced analytics</li>
                  <li>• Scale efficient processes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Critical Issues Summary */}
        {costStructureAnalysis.overall.criticalIssues.length > 0 && (
          <div className={cn("mt-4 p-3 bg-red-50 rounded border border-red-200", isMobile && "mt-3")}>
            <h6 className="font-medium text-red-800 mb-2">🚨 Critical Issues</h6>
            <div className="space-y-1">
              {costStructureAnalysis.overall.criticalIssues.slice(0, 3).map((issue, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className={cn(
                    "text-red-700",
                    isMobile && "text-xs"
                  )}>
                    {issue.severity === 'critical' ? '🚨' : 
                     issue.severity === 'warning' ? '⚠️' : 'ℹ️'} {issue.message}
                  </span>
                  <span className={cn(
                    "text-xs px-2 py-1 bg-red-100 text-red-800 rounded",
                    isMobile && "text-[0.65rem] px-1.5 py-0.5"
                  )}>
                    P{issue.priority}
                  </span>
                </div>
              ))}
              {costStructureAnalysis.overall.criticalIssues.length > 3 && (
                <p className="text-xs text-red-600 mt-2">
                  ... dan {costStructureAnalysis.overall.criticalIssues.length - 3} issues lainnya
                </p>
              )}
            </div>
          </div>
        )}

        {/* Data Quality Recommendation */}
        {dataSource !== 'actual' && (
          <div className={cn("mt-4 p-3 bg-yellow-50 rounded border border-yellow-200", isMobile && "mt-3")}>
            <h6 className="font-medium text-yellow-800 mb-2">📊 Data Quality Improvement</h6>
            <p className="text-yellow-700 text-sm">
              Current data source: <strong>{dataSource}</strong>. 
              Implementing actual material usage tracking akan meningkatkan akurasi analisis hingga 25% 
              dan memberikan insights yang lebih actionable.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};