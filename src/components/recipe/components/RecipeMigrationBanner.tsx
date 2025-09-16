// src/components/recipe/components/RecipeMigrationBanner.tsx
// 🔄 Recipe Migration Banner Component
// Smart banner to notify users about available recipe migrations

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings,
  Zap,
  ArrowRight,
  X,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { recipeMigrationService } from '../services/recipeMigrationService';
import { logger } from '@/utils/logger';

interface MigrationBannerProps {
  onDismiss?: () => void;
  autoCheck?: boolean;
  className?: string;
}

const RecipeMigrationBanner: React.FC<MigrationBannerProps> = ({
  onDismiss,
  autoCheck = true,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [migrationSummary, setMigrationSummary] = useState({
    total: 0,
    migratable: 0,
    hasFixedOverhead: 0,
  });

  const navigate = useNavigate();

  // Check for migratable recipes on mount
  useEffect(() => {
    if (autoCheck) {
      checkForMigratableRecipes();
    }
  }, [autoCheck]);

  const checkForMigratableRecipes = async () => {
    // Check localStorage first to see if user dismissed this banner
    const dismissedUntil = localStorage.getItem('recipe-migration-banner-dismissed');
    if (dismissedUntil) {
      const dismissedDate = new Date(dismissedUntil);
      const weekFromDismissal = new Date(dismissedDate);
      weekFromDismissal.setDate(weekFromDismissal.getDate() + 7);
      
      if (new Date() < weekFromDismissal) {
        logger.debug('🔕 Migration banner dismissed for this week');
        return;
      }
    }

    setIsLoading(true);
    try {
      const result = await recipeMigrationService.getMigratableRecipes();
      setMigrationSummary(result.summary);
      
      // Show banner only if there are migratable recipes
      if (result.summary.migratable > 0) {
        setIsVisible(true);
        logger.info('📢 Migration banner shown - migratable recipes found:', result.summary.migratable);
      }
      
    } catch (error) {
      logger.warn('⚠️ Could not check migratable recipes for banner:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToMigration = () => {
    navigate('/recipes/migration');
    handleDismiss();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    
    // Store dismissal in localStorage for 1 week
    const dismissedUntil = new Date();
    dismissedUntil.setDate(dismissedUntil.getDate() + 7);
    localStorage.setItem('recipe-migration-banner-dismissed', dismissedUntil.toISOString());
    
    onDismiss?.();
  };

  if (isLoading) {
    return (
      <Card className={`border-blue-200 bg-blue-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
            <span className="text-sm text-blue-800">Checking for recipe updates...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isVisible || migrationSummary.migratable === 0) {
    return null;
  }

  return (
    <Card className={`border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-medium text-blue-900">
                  🚀 Update Recipe ke Auto-Sync Overhead!
                </h3>
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  Smart Detection
                </Badge>
              </div>
              
              <p className="text-sm text-blue-800 mb-3">
                Kami menemukan <strong>{migrationSummary.migratable} recipe</strong> yang masih menggunakan 
                overhead manual. Upgrade ke sistem auto-sync untuk perhitungan HPP yang selalu akurat!
              </p>
              
              <div className="flex items-center gap-4 text-xs text-blue-700">
                <div className="flex items-center gap-1">
                  <Settings className="h-3 w-3" />
                  <span>{migrationSummary.hasFixedOverhead} dengan overhead tetap</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>Backup otomatis</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  <span>Update real-time</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleNavigateToMigration}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Upgrade Recipe
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecipeMigrationBanner;