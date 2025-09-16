// src/components/debug/OverheadDebug.tsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOperationalCost } from '@/components/operational-costs/context/OperationalCostContext';

export const OverheadDebug: React.FC = () => {
  const { 
    state: { overheadCalculation, isAuthenticated, loading },
    actions: { calculateOverhead, updateProductionTarget, invalidateOverheadCalculations }
  } = useOperationalCost();

  const [materialCost, setMaterialCost] = useState(1000);
  const [targetProduction, setTargetProduction] = useState(2333);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20));
  };

  const handleCalculateOverhead = async () => {
    addLog(`🔄 Testing calculateOverhead with materialCost: ${materialCost}`);
    try {
      await calculateOverhead(materialCost);
      addLog('✅ calculateOverhead completed');
    } catch (error) {
      addLog(`❌ calculateOverhead error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleUpdateTarget = async () => {
    addLog(`🎯 Testing updateProductionTarget to: ${targetProduction}`);
    try {
      const success = await updateProductionTarget(targetProduction);
      if (success) {
        addLog('✅ Production target updated successfully');
      } else {
        addLog('❌ Production target update failed');
      }
    } catch (error) {
      addLog(`❌ updateProductionTarget error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleInvalidate = () => {
    addLog('🔄 Manually invalidating overhead calculations');
    invalidateOverheadCalculations();
    addLog('✅ Invalidation completed');
  };

  const handleCombinedTest = async () => {
    addLog('🚀 Starting combined test: Update Target → Calculate Overhead');
    
    // Step 1: Update production target
    try {
      const success = await updateProductionTarget(targetProduction);
      if (success) {
        addLog('✅ Step 1: Production target updated');
        
        // Step 2: Wait a bit for invalidation to process
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Step 3: Calculate overhead
        await calculateOverhead(materialCost);
        addLog('✅ Step 2: Overhead recalculated');
        addLog('🎉 Combined test completed');
      } else {
        addLog('❌ Step 1 failed: Could not update production target');
      }
    } catch (error) {
      addLog(`❌ Combined test error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>🐛 Overhead Auto-Sync Debug</CardTitle>
          <CardDescription>
            Test overhead calculation and production target auto-sync functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auth Status */}
          <div className="p-2 bg-gray-50 rounded">
            <strong>Auth Status:</strong> {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
            <br />
            <strong>Loading:</strong> {JSON.stringify(loading)}
          </div>

          {/* Current State */}
          <div className="p-2 bg-blue-50 rounded">
            <strong>Current Overhead Calculation:</strong>
            <pre className="text-xs mt-1 max-h-40 overflow-y-auto">
              {overheadCalculation ? JSON.stringify(overheadCalculation, null, 2) : 'null'}
            </pre>
          </div>

          {/* Test Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="materialCost">Material Cost</Label>
              <Input
                id="materialCost"
                type="number"
                value={materialCost}
                onChange={(e) => setMaterialCost(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="targetProduction">Target Production</Label>
              <Input
                id="targetProduction"
                type="number"
                value={targetProduction}
                onChange={(e) => setTargetProduction(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Test Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleCalculateOverhead} disabled={!isAuthenticated}>
              📊 Calculate Overhead
            </Button>
            <Button onClick={handleUpdateTarget} disabled={!isAuthenticated}>
              🎯 Update Target
            </Button>
            <Button onClick={handleInvalidate} disabled={!isAuthenticated}>
              🔄 Invalidate Cache
            </Button>
            <Button onClick={handleCombinedTest} disabled={!isAuthenticated} variant="default">
              🚀 Combined Test
            </Button>
          </div>

          {/* Results */}
          <div>
            <strong>Expected Behavior:</strong>
            <ul className="text-sm mt-1 ml-4 list-disc space-y-1">
              <li>When target production changes, overhead per unit should automatically update</li>
              <li>Formula: overhead_per_unit = total_operational_costs / target_production</li>
              <li>Example: Rp 8,200,000 ÷ 2,333 pcs = Rp 3,515/pcs (not Rp 920)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>📝 Debug Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-60 overflow-y-auto bg-gray-900 text-green-400 p-3 rounded text-sm font-mono">
            {logs.length === 0 ? 'No logs yet...' : logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
          <Button 
            onClick={() => setLogs([])} 
            size="sm" 
            variant="outline" 
            className="mt-2"
          >
            Clear Logs
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};