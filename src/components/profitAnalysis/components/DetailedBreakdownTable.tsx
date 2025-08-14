import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  DollarSign, ShoppingCart, Calculator, TrendingUp, 
  Download, Filter, Search
} from 'lucide-react';

import { 
  formatCurrency, 
  formatPercentage, 
  transformToRevenueBreakdown,
  transformToOpExBreakdown 
} from '../utils/profitTransformers';
import { RealTimeProfitCalculation } from '../types/profitAnalysis.types';

// ==============================================
// TYPES
// ==============================================

interface DetailedBreakdownTableProps {
  currentAnalysis: RealTimeProfitCalculation | null;
  isLoading: boolean;
  showExport?: boolean;
  className?: string;
}

interface BreakdownSection {
  title: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  total: number;
  items: BreakdownItem[];
}

interface BreakdownItem {
  name: string;
  amount: number;
  percentage: number;
  count?: number;
  type?: string;
}

// ==============================================
// DETAILED BREAKDOWN TABLE COMPONENT
// ==============================================

const DetailedBreakdownTable: React.FC<DetailedBreakdownTableProps> = ({
  currentAnalysis,
  isLoading,
  showExport = true,
  className = ''
}) => {
  
  const [activeTab, setActiveTab] = useState<'revenue' | 'cogs' | 'opex' | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'amount' | 'percentage'>('amount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // ✅ PROCESS BREAKDOWN DATA
  const breakdownSections = useMemo((): BreakdownSection[] => {
    if (!currentAnalysis) return [];

    const revenue = currentAnalysis.revenue_data.total;
    const cogs = currentAnalysis.cogs_data.total;
    const opex = currentAnalysis.opex_data.total;

    // Revenue Breakdown
    const revenueItems: BreakdownItem[] = currentAnalysis.revenue_data.transactions?.map(t => ({
      name: t.category || 'Unknown Category',
      amount: t.amount || 0,
      percentage: revenue > 0 ? ((t.amount || 0) / revenue) * 100 : 0,
      count: 1
    })) || [];

    // Group by category for revenue
    const groupedRevenue = revenueItems.reduce((acc, item) => {
      const existing = acc.find(a => a.name === item.name);
      if (existing) {
        existing.amount += item.amount;
        existing.count = (existing.count || 0) + 1;
        existing.percentage = revenue > 0 ? (existing.amount / revenue) * 100 : 0;
      } else {
        acc.push({ ...item });
      }
      return acc;
    }, [] as BreakdownItem[]);

    // COGS Breakdown (simplified - in real app, this would be more detailed)
    const cogsItems: BreakdownItem[] = [
      {
        name: 'Material Costs',
        amount: cogs * 0.8, // Assume 80% material costs
        percentage: cogs > 0 ? 80 : 0,
        type: 'Direct Material'
      },
      {
        name: 'Direct Labor',
        amount: cogs * 0.2, // Assume 20% direct labor
        percentage: cogs > 0 ? 20 : 0,
        type: 'Direct Labor'
      }
    ].filter(item => item.amount > 0);

    // OpEx Breakdown
    const opexItems: BreakdownItem[] = currentAnalysis.opex_data.costs?.map(cost => ({
      name: cost.nama_biaya || cost.name || 'Unknown Cost',
      amount: cost.jumlah_per_bulan || cost.amount || 0,
      percentage: opex > 0 ? ((cost.jumlah_per_bulan || cost.amount || 0) / opex) * 100 : 0,
      type: cost.jenis || cost.type || 'Unknown'
    })) || [];

    return [
      {
        title: 'Revenue Sources',
        icon: DollarSign,
        color: 'text-green-700',
        bgColor: 'bg-green-50',
        total: revenue,
        items: groupedRevenue
      },
      {
        title: 'Cost of Goods Sold (COGS)',
        icon: ShoppingCart,
        color: 'text-amber-700',
        bgColor: 'bg-amber-50',
        total: cogs,
        items: cogsItems
      },
      {
        title: 'Operational Expenses',
        icon: Calculator,
        color: 'text-red-700',
        bgColor: 'bg-red-50',
        total: opex,
        items: opexItems
      }
    ];
  }, [currentAnalysis]);

  // ✅ FILTERED SECTIONS
  const filteredSections = useMemo(() => {
    if (activeTab === 'all') return breakdownSections;
    
    const sectionMap = {
      revenue: 0,
      cogs: 1,
      opex: 2
    };
    
    const sectionIndex = sectionMap[activeTab];
    return breakdownSections[sectionIndex] ? [breakdownSections[sectionIndex]] : [];
  }, [breakdownSections, activeTab]);

  // ✅ SORTED ITEMS
  const getSortedItems = (items: BreakdownItem[]) => {
    return [...items].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'percentage':
          aValue = a.percentage;
          bValue = b.percentage;
          break;
        default:
          aValue = a.amount;
          bValue = b.amount;
      }
      
      if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue as string)
          : (bValue as string).localeCompare(aValue);
      } else {
        return sortOrder === 'asc' ? aValue - (bValue as number) : (bValue as number) - aValue;
      }
    });
  };

  // ✅ EXPORT FUNCTION
  const handleExport = () => {
    const exportData = breakdownSections.flatMap(section => 
      section.items.map(item => ({
        Category: section.title,
        Item: item.name,
        Amount: item.amount,
        Percentage: item.percentage,
        Type: item.type || 'N/A',
        Count: item.count || 1
      }))
    );

    const csvContent = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `profit-breakdown-${currentAnalysis?.period || 'export'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ✅ LOADING STATE
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Detailed Breakdown</CardTitle>
          <CardDescription>
            Complete breakdown of revenue sources and cost components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ✅ NO DATA STATE
  if (!currentAnalysis || breakdownSections.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Detailed Breakdown</CardTitle>
          <CardDescription>
            Complete breakdown of revenue sources and cost components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg mb-2">No Breakdown Data</div>
            <div className="text-gray-500 text-sm">
              Select a period with financial data to view detailed breakdown
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ✅ MAIN RENDER
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Detailed Breakdown</CardTitle>
            <CardDescription>
              Complete breakdown of revenue sources and cost components for {currentAnalysis.period}
            </CardDescription>
          </div>
          
          {/* Export Button */}
          {showExport && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 mt-4">
          {[
            { key: 'all', label: 'All Categories' },
            { key: 'revenue', label: 'Revenue' },
            { key: 'cogs', label: 'COGS' },
            { key: 'opex', label: 'OpEx' }
          ].map(tab => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab.key as any)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Sort Controls */}
        <div className="flex space-x-2 mt-2">
          <span className="text-sm text-gray-600 py-2">Sort by:</span>
          {[
            { key: 'amount', label: 'Amount' },
            { key: 'percentage', label: 'Percentage' },
            { key: 'name', label: 'Name' }
          ].map(sort => (
            <Button
              key={sort.key}
              variant={sortBy === sort.key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                if (sortBy === sort.key) {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy(sort.key as any);
                  setSortOrder('desc');
                }
              }}
            >
              {sort.label}
              {sortBy === sort.key && (
                <span className="ml-1">
                  {sortOrder === 'desc' ? '↓' : '↑'}
                </span>
              )}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-8">
          {filteredSections.map((section, sectionIndex) => {
            const Icon = section.icon;
            const sortedItems = getSortedItems(section.items);
            
            return (
              <div key={sectionIndex}>
                {/* Section Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${section.bgColor}`}>
                      <Icon className={`w-5 h-5 ${section.color}`} />
                    </div>
                    <div>
                      <h4 className={`font-semibold ${section.color}`}>
                        {section.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Total: {formatCurrency(section.total)}
                      </p>
                    </div>
                  </div>
                  
                  <Badge variant="secondary">
                    {sortedItems.length} items
                  </Badge>
                </div>

                {/* Items Table */}
                <div className={`rounded-lg border ${section.bgColor} border-opacity-20`}>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-200">
                        <TableHead className="font-semibold">Item</TableHead>
                        <TableHead className="font-semibold text-right">Amount</TableHead>
                        <TableHead className="font-semibold text-right">Percentage</TableHead>
                        {section.title === 'Operational Expenses' && (
                          <TableHead className="font-semibold text-center">Type</TableHead>
                        )}
                        {section.title === 'Revenue Sources' && (
                          <TableHead className="font-semibold text-center">Transactions</TableHead>
                        )}
                        {section.title === 'Cost of Goods Sold (COGS)' && (
                          <TableHead className="font-semibold text-center">Category</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedItems.length === 0 ? (
                        <TableRow>
                          <TableCell 
                            colSpan={section.title === 'Revenue Sources' ? 4 : section.title === 'Operational Expenses' ? 4 : 4}
                            className="text-center py-8 text-gray-500"
                          >
                            No items found for {section.title.toLowerCase()}
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedItems.map((item, itemIndex) => (
                          <TableRow 
                            key={itemIndex}
                            className="hover:bg-white hover:bg-opacity-50 transition-colors"
                          >
                            <TableCell className="font-medium">
                              {item.name}
                            </TableCell>
                            
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(item.amount)}
                            </TableCell>
                            
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <span className="font-medium">
                                  {formatPercentage(item.percentage)}
                                </span>
                                
                                {/* Progress Bar */}
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{ 
                                      width: `${Math.min(item.percentage, 100)}%`,
                                      backgroundColor: section.color.replace('text-', '').replace('-700', '-500')
                                    }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            
                            {/* Additional Columns based on section */}
                            {section.title === 'Operational Expenses' && (
                              <TableCell className="text-center">
                                <Badge 
                                  variant={item.type === 'tetap' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {item.type === 'tetap' ? 'Fixed' : item.type === 'variabel' ? 'Variable' : item.type}
                                </Badge>
                              </TableCell>
                            )}
                            
                            {section.title === 'Revenue Sources' && (
                              <TableCell className="text-center">
                                <Badge variant="outline" className="text-xs">
                                  {item.count} transaction{(item.count || 0) > 1 ? 's' : ''}
                                </Badge>
                              </TableCell>
                            )}
                            
                            {section.title === 'Cost of Goods Sold (COGS)' && (
                              <TableCell className="text-center">
                                <Badge 
                                  variant={item.type === 'Direct Material' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {item.type}
                                </Badge>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Section Summary */}
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Items:</span>
                      <span className="ml-2 font-semibold">{sortedItems.length}</span>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="ml-2 font-semibold">{formatCurrency(section.total)}</span>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">Average per Item:</span>
                      <span className="ml-2 font-semibold">
                        {formatCurrency(sortedItems.length > 0 ? section.total / sortedItems.length : 0)}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">Largest Item:</span>
                      <span className="ml-2 font-semibold">
                        {sortedItems.length > 0 
                          ? formatPercentage(Math.max(...sortedItems.map(i => i.percentage)))
                          : '0%'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall Summary */}
        {activeTab === 'all' && breakdownSections.length > 0 && (
          <div className="mt-8 pt-6 border-t">
            <h4 className="font-semibold text-gray-800 mb-4">Overall Summary</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Revenue Summary */}
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700 mb-1">
                  {formatCurrency(breakdownSections[0]?.total || 0)}
                </div>
                <div className="text-sm text-green-600">Total Revenue</div>
                <div className="text-xs text-gray-600 mt-1">
                  From {breakdownSections[0]?.items.length || 0} sources
                </div>
              </div>

              {/* Costs Summary */}
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-700 mb-1">
                  {formatCurrency(
                    (breakdownSections[1]?.total || 0) + (breakdownSections[2]?.total || 0)
                  )}
                </div>
                <div className="text-sm text-red-600">Total Costs</div>
                <div className="text-xs text-gray-600 mt-1">
                  COGS + OpEx
                </div>
              </div>

              {/* Profit Summary */}
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700 mb-1">
                  {formatCurrency(
                    (breakdownSections[0]?.total || 0) - 
                    (breakdownSections[1]?.total || 0) - 
                    (breakdownSections[2]?.total || 0)
                  )}
                </div>
                <div className="text-sm text-blue-600">Net Profit</div>
                <div className="text-xs text-gray-600 mt-1">
                  {formatPercentage(
                    breakdownSections[0]?.total > 0
                      ? ((breakdownSections[0].total - (breakdownSections[1]?.total || 0) - (breakdownSections[2]?.total || 0)) / breakdownSections[0].total) * 100
                      : 0
                  )} margin
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DetailedBreakdownTable;