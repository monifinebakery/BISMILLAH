// ProfitTips.tsx - Tips and recommendations for profit analysis
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

const ProfitTips: React.FC = () => {
  return (
    <Card className="mt-6 border border-gray-200 rounded-xl bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Lightbulb className="h-5 w-5 text-gray-500" />
          Tips Meningkatkan Profit
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span>📈</span>
            <span>Naikkan harga menu yang laris 5-10%</span>
          </li>
          <li className="flex items-start gap-2">
            <span>📦</span>
            <span>Nego ulang harga dengan supplier</span>
          </li>
          <li className="flex items-start gap-2">
            <span>💡</span>
            <span>Kurangi waste dengan porsi yang tepat</span>
          </li>
          <li className="flex items-start gap-2">
            <span>🎯</span>
            <span>Fokus promosi menu margin tinggi</span>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
};

export default ProfitTips;
