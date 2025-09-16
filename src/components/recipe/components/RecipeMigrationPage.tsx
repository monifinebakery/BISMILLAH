// src/components/recipe/components/RecipeMigrationPage.tsx
// 🔄 Recipe Migration UI Component
// Smart detection and migration of legacy recipes to auto-sync

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Settings,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  Clock,
  Database,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import {
  recipeMigrationService,
  type RecipeMigrationStatus,
  type BulkMigrationSummary
} from '../services/recipeMigrationService';
import { logger } from '@/utils/logger';

interface RecipeWithMigrationStatus {
  id: string;
  nama_resep: string;
  biaya_overhead: number;
  updated_at: string;
  migrationStatus: RecipeMigrationStatus;
}

const RecipeMigrationPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState(0);
  
  const [recipes, setRecipes] = useState<RecipeWithMigrationStatus[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [migrationResults, setMigrationResults] = useState<BulkMigrationSummary | null>(null);
  
  const [summary, setSummary] = useState({
    total: 0,
    migratable: 0,
    hasFixedOverhead: 0,
    legacy: 0,
  });

  // Load migratable recipes on component mount
  useEffect(() => {
    loadMigratableRecipes();
  }, []);

  const loadMigratableRecipes = async () => {
    setIsLoading(true);
    try {
      logger.info('🔍 Loading migratable recipes');
      const result = await recipeMigrationService.getMigratableRecipes();
      
      setRecipes(result.recipes);
      setSummary(result.summary);
      
      // Auto-select migratable recipes
      const migratableIds = result.recipes
        .filter(r => r.migrationStatus.canMigrate && r.migrationStatus.hasFixedOverhead)
        .map(r => r.id);
      setSelectedRecipes(migratableIds);
      
      logger.success('✅ Migratable recipes loaded:', result.summary);
      
    } catch (error) {
      logger.error('❌ Error loading migratable recipes:', error);
      toast.error('Gagal memuat data recipe untuk migrasi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRecipe = (recipeId: string, checked: boolean) => {
    if (checked) {
      setSelectedRecipes(prev => [...prev, recipeId]);
    } else {
      setSelectedRecipes(prev => prev.filter(id => id !== recipeId));
    }
  };

  const handleSelectAll = () => {
    const migratableIds = recipes
      .filter(r => r.migrationStatus.canMigrate && r.migrationStatus.hasFixedOverhead)
      .map(r => r.id);
    
    setSelectedRecipes(migratableIds);
  };

  const handleDeselectAll = () => {
    setSelectedRecipes([]);
  };

  const handleMigration = async () => {
    if (selectedRecipes.length === 0) {
      toast.error('Pilih recipe yang akan dimigrasi terlebih dahulu');
      return;
    }

    setIsMigrating(true);
    setMigrationProgress(0);

    try {
      logger.info('🔄 Starting bulk migration for', selectedRecipes.length, 'recipes');

      // Create backup first
      toast.info('Membuat backup data recipe...', { id: 'backup-toast' });
      await recipeMigrationService.createRecipeBackup(selectedRecipes);
      toast.success('Backup berhasil dibuat', { id: 'backup-toast' });

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setMigrationProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      // Perform migration
      const results = await recipeMigrationService.bulkMigrateRecipes(selectedRecipes, {
        preserveOriginalOverhead: false,
        addMigrationNote: true,
        batchSize: 5,
      });

      clearInterval(progressInterval);
      setMigrationProgress(100);

      setMigrationResults(results);
      
      // Show results
      toast.success(`Migration selesai: ${results.migratedCount} recipe berhasil dimigrasi!`, {
        description: results.summary,
        duration: 5000,
      });

      // Reload data
      await loadMigratableRecipes();

    } catch (error) {
      logger.error('❌ Bulk migration failed:', error);
      toast.error('Migration gagal: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsMigrating(false);
      setMigrationProgress(0);
    }
  };

  const getStatusBadge = (status: RecipeMigrationStatus) => {
    if (status.canMigrate && status.hasFixedOverhead) {
      return <Badge className="bg-blue-100 text-blue-800">✨ Siap Migrasi</Badge>;
    }
    if (status.hasFixedOverhead && !status.canMigrate) {
      return <Badge className="bg-orange-100 text-orange-800">⚠️ Perlu Setup</Badge>;
    }
    if (!status.hasFixedOverhead) {
      return <Badge className="bg-green-100 text-green-800">✅ Auto-Sync</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">❓ Unknown</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium">Menganalisis recipe untuk migrasi...</p>
              <p className="text-sm text-muted-foreground">Mohon tunggu sebentar</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Settings className="h-6 w-6 text-blue-600" />
            Recipe Migration Tool
            <Badge className="bg-blue-100 text-blue-800">Smart Detection</Badge>
          </CardTitle>
          <p className="text-muted-foreground">
            Migrasi recipe lama dari sistem overhead manual ke auto-sync overhead yang baru
          </p>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{summary.total}</p>
                <p className="text-sm text-muted-foreground">Total Recipe</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{summary.legacy}</p>
                <p className="text-sm text-muted-foreground">Recipe Lama</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{summary.hasFixedOverhead}</p>
                <p className="text-sm text-muted-foreground">Fixed Overhead</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{summary.migratable}</p>
                <p className="text-sm text-muted-foreground">Siap Migrasi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Migration Progress */}
      {isMigrating && (
        <Card className="border-blue-200">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Migration Progress</h3>
                <span className="text-sm text-muted-foreground">{migrationProgress}%</span>
              </div>
              <Progress value={migrationProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Memproses {selectedRecipes.length} recipe...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Migration Results */}
      {migrationResults && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Migration Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{migrationResults.migratedCount}</p>
                <p className="text-sm text-muted-foreground">Berhasil</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{migrationResults.skippedCount}</p>
                <p className="text-sm text-muted-foreground">Dilewati</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{migrationResults.failedCount}</p>
                <p className="text-sm text-muted-foreground">Gagal</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{migrationResults.totalRecipes}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
            <p className="text-sm text-green-700">{migrationResults.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Recipe List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Recipe List ({recipes.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Select All Migratable
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                Deselect All
              </Button>
              <Button variant="outline" size="sm" onClick={loadMigratableRecipes}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
          
          {selectedRecipes.length > 0 && (
            <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
              <span className="text-sm font-medium">
                {selectedRecipes.length} recipe dipilih untuk migrasi
              </span>
              <Button 
                onClick={handleMigration}
                disabled={isMigrating || selectedRecipes.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isMigrating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Migrate Selected
                  </>
                )}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {recipes.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-500">Tidak ada recipe ditemukan</p>
              <p className="text-sm text-gray-400">Buat recipe baru atau periksa filter</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recipes.map((recipe) => (
                <Card key={recipe.id} className="border-l-4 border-l-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {(recipe.migrationStatus.canMigrate && recipe.migrationStatus.hasFixedOverhead) && (
                          <Checkbox
                            checked={selectedRecipes.includes(recipe.id)}
                            onCheckedChange={(checked) => 
                              handleSelectRecipe(recipe.id, checked as boolean)
                            }
                          />
                        )}
                        
                        <div className="flex-1">
                          <h3 className="font-medium">{recipe.nama_resep}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>Updated: {formatDate(recipe.updated_at)}</span>
                            <span>Current Overhead: {formatCurrency(recipe.biaya_overhead)}</span>
                          </div>
                          
                          {/* Migration Notes */}
                          <div className="mt-2">
                            {recipe.migrationStatus.migrationNotes.map((note, index) => (
                              <p key={index} className="text-xs text-gray-600">• {note}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {getStatusBadge(recipe.migrationStatus)}
                        
                        {recipe.migrationStatus.suggestedAutoOverheadValue && (
                          <div className="mt-2 text-sm">
                            <span className="text-muted-foreground">Auto-sync: </span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(recipe.migrationStatus.suggestedAutoOverheadValue)}/pcs
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Cards */}
      {summary.migratable === 0 && summary.total > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Tidak ada recipe yang bisa dimigrasi.</strong>
            <br />
            Pastikan auto-sync overhead sudah dikonfigurasi di menu Biaya Operasional terlebih dahulu.
          </AlertDescription>
        </Alert>
      )}

      {summary.total === 0 && (
        <Alert>
          <Database className="h-4 w-4" />
          <AlertDescription>
            <strong>Belum ada recipe.</strong>
            <br />
            Buat recipe baru di menu Recipe untuk mulai menggunakan fitur auto-sync overhead.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default RecipeMigrationPage;