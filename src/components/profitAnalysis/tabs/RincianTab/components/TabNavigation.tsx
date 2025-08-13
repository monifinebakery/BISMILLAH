// src/components/profitAnalysis/tabs/rincianTab/components/TabNavigation.tsx

import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import { TabNavigationProps } from '../types/components';
import { TAB_LABELS } from '../constants/messages';

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  isMobile
}) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className={cn(
        "grid w-full grid-cols-4",
        isMobile && "flex overflow-x-auto whitespace-nowrap"
      )}>
        <TabsTrigger 
          value="overview" 
          className={isMobile ? "text-xs px-2" : ""}
        >
          {TAB_LABELS.OVERVIEW}
        </TabsTrigger>
        <TabsTrigger 
          value="cogs" 
          className={isMobile ? "text-xs px-2" : ""}
        >
          {TAB_LABELS.COGS}
        </TabsTrigger>
        <TabsTrigger 
          value="opex" 
          className={isMobile ? "text-xs px-2" : ""}
        >
          {TAB_LABELS.OPEX}
        </TabsTrigger>
        <TabsTrigger 
          value="analysis" 
          className={isMobile ? "text-xs px-2" : ""}
        >
          {TAB_LABELS.ANALYSIS}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};