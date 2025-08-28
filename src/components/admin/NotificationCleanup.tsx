// src/components/admin/NotificationCleanup.tsx
// ✅ ADMIN COMPONENT UNTUK CLEANUP NOTIFIKASI DUPLIKAT

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Search, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import { 
  cleanupDuplicateNotifications, 
  quickCleanupRecent, 
  cleanupExpiredNotifications 
} from '@/utils/notificationCleanup';

interface CleanupResult {
  duplicatesFound: number;
  duplicatesRemoved: number;
  groups: Array<{
    title: string;
    count: number;
    related_type?: string;
    related_id?: string;
  }>;
}

const NotificationCleanup: React.FC = () => {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CleanupResult | null>(null);
  const [lastCleanup, setLastCleanup] = useState<string | null>(null);

  // Dry run analysis
  const handleAnalyze = async () => {
    if (!user?.id) {
      toast.error('User tidak ditemukan');
      return;
    }

    setIsAnalyzing(true);
    try {
      logger.info('🔍 Starting notification duplicate analysis...');
      const result = await cleanupDuplicateNotifications(user.id, true);
      setAnalysisResult(result);
      
      if (result.duplicatesFound > 0) {
        toast.warning(`Ditemukan ${result.duplicatesFound} notifikasi duplikat`);
      } else {
        toast.success('Tidak ada notifikasi duplikat ditemukan! 🎉');
      }
    } catch (error) {
      logger.error('Analysis failed:', error);
      toast.error('Gagal menganalisis notifikasi');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Actual cleanup
  const handleCleanup = async () => {
    if (!user?.id || !analysisResult || analysisResult.duplicatesFound === 0) {
      return;
    }

    setIsCleaning(true);
    try {
      logger.info('🧹 Starting actual notification cleanup...');
      const result = await cleanupDuplicateNotifications(user.id, false);
      
      toast.success(`✅ Berhasil menghapus ${result.duplicatesRemoved} notifikasi duplikat`);
      setLastCleanup(new Date().toLocaleString('id-ID'));
      setAnalysisResult(null); // Reset analysis after cleanup
      
      logger.info('Notification cleanup completed successfully', {
        removed: result.duplicatesRemoved,
        userId: user.id
      });
    } catch (error) {
      logger.error('Cleanup failed:', error);
      toast.error('Gagal membersihkan notifikasi duplikat');
    } finally {
      setIsCleaning(false);
    }
  };

  // Quick cleanup untuk notifikasi 24 jam terakhir
  const handleQuickCleanup = async () => {
    if (!user?.id) return;

    setIsCleaning(true);
    try {
      logger.info('⚡ Starting quick cleanup...');
      const removed = await quickCleanupRecent(user.id, 24);
      
      if (removed > 0) {
        toast.success(`⚡ Quick cleanup: ${removed} duplikat dihapus`);
        setLastCleanup(new Date().toLocaleString('id-ID'));
      } else {
        toast.info('Tidak ada duplikat dalam 24 jam terakhir');
      }
    } catch (error) {
      logger.error('Quick cleanup failed:', error);
      toast.error('Quick cleanup gagal');
    } finally {
      setIsCleaning(false);
    }
  };

  // WAC-specific cleanup
  const handleWACCleanup = async () => {
    if (!user?.id) return;

    setIsCleaning(true);
    try {
      logger.info('🏦 Starting WAC notifications cleanup...');
      
      // Custom cleanup for WAC notifications
      const { data: wacNotifications, error } = await supabase
        .from('notifications')
        .select('id, title, message, created_at')
        .eq('user_id', user.id)
        .or('title.ilike.%wac%,title.ilike.%weighted%,message.ilike.%rata-rata%,message.ilike.%harga rata%')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!wacNotifications || wacNotifications.length === 0) {
        toast.info('Tidak ada notifikasi WAC ditemukan');
        return;
      }

      // Group similar WAC notifications
      const groups = new Map<string, any[]>();
      wacNotifications.forEach(notif => {
        const key = `${notif.title.toLowerCase().trim()}|${notif.message.substring(0, 50)}`;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(notif);
      });

      // Find duplicates
      const idsToDelete: string[] = [];
      groups.forEach(notifs => {
        if (notifs.length > 1) {
          const sorted = notifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          const toDelete = sorted.slice(1); // Keep most recent
          idsToDelete.push(...toDelete.map(n => n.id));
        }
      });

      if (idsToDelete.length === 0) {
        toast.info('Tidak ada duplikat WAC ditemukan');
        return;
      }

      // Delete duplicates
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) throw deleteError;

      toast.success(`🏦 ${idsToDelete.length} notifikasi WAC duplikat dihapus`);
      setLastCleanup(new Date().toLocaleString('id-ID'));
      
    } catch (error) {
      logger.error('WAC cleanup failed:', error);
      toast.error('WAC cleanup gagal');
    } finally {
      setIsCleaning(false);
    }
  };

  // Cleanup expired notifications
  const handleExpiredCleanup = async () => {
    if (!user?.id) return;

    try {
      logger.info('🗑️ Cleaning expired notifications...');
      const removed = await cleanupExpiredNotifications(user.id);
      
      if (removed > 0) {
        toast.success(`🗑️ ${removed} notifikasi expired dihapus`);
      } else {
        toast.info('Tidak ada notifikasi expired');
      }
    } catch (error) {
      logger.error('Expired cleanup failed:', error);
      toast.error('Gagal membersihkan notifikasi expired');
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Notification Cleanup Tool
        </CardTitle>
        <CardDescription>
          Analisis dan bersihkan notifikasi duplikat untuk meningkatkan performa aplikasi
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status Info */}
        {lastCleanup && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Last cleanup: {lastCleanup}
            </AlertDescription>
          </Alert>
        )}

        {/* Analysis Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">1. Analisis Duplikat</h3>
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || isCleaning}
              variant="outline"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Menganalisis...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Analisis
                </>
              )}
            </Button>
          </div>

          {analysisResult && (
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div className="flex items-center gap-4">
                <Badge variant={analysisResult.duplicatesFound > 0 ? "destructive" : "default"}>
                  {analysisResult.duplicatesFound} Duplikat Ditemukan
                </Badge>
                <Badge variant="secondary">
                  {analysisResult.groups.length} Groups
                </Badge>
              </div>

              {analysisResult.groups.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium text-sm">Duplicate Groups:</p>
                  {analysisResult.groups.slice(0, 5).map((group, index) => (
                    <div key={index} className="text-sm p-2 bg-background rounded border">
                      <div className="font-medium">"{group.title}"</div>
                      <div className="text-muted-foreground">
                        {group.count} copies • {group.related_type}/{group.related_id}
                      </div>
                    </div>
                  ))}
                  {analysisResult.groups.length > 5 && (
                    <p className="text-sm text-muted-foreground">
                      ...dan {analysisResult.groups.length - 5} group lainnya
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cleanup Section */}
        {analysisResult && analysisResult.duplicatesFound > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">2. Hapus Duplikat</h3>
              <Button 
                onClick={handleCleanup} 
                disabled={isCleaning}
                variant="destructive"
              >
                {isCleaning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus {analysisResult.duplicatesFound} Duplikat
                  </>
                )}
              </Button>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Peringatan:</strong> Aksi ini akan menghapus notifikasi duplikat secara permanen. 
                Notifikasi terbaru akan dipertahankan.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-4 pt-6 border-t">
          <h3 className="text-lg font-medium">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleQuickCleanup} 
              disabled={isCleaning}
              variant="secondary"
              size="sm"
            >
              {isCleaning ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Quick Clean (24h)
            </Button>
            
            <Button 
              onClick={handleWACCleanup} 
              disabled={isCleaning}
              variant="secondary"
              size="sm"
            >
              {isCleaning ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Clean WAC
            </Button>
            
            <Button 
              onClick={handleExpiredCleanup} 
              disabled={isCleaning}
              variant="secondary"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clean Expired
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Quick Clean: Hapus duplikat 24 jam terakhir • Clean WAC: Hapus duplikat WAC khusus • Clean Expired: Hapus notifikasi expired
          </p>
        </div>

        {/* Usage Stats */}
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            💡 Tip: Jalankan analisis secara berkala untuk menjaga performa aplikasi. 
            Tool ini aman dan hanya menghapus duplikat, bukan notifikasi unik.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationCleanup;
