import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUpdates } from './UpdateContext';
import { AppUpdate } from './types';
import { UpdateCard } from './UpdateCard';
import { Loader2, RefreshCw, CheckCircle2, Bell, Filter } from 'lucide-react';

export const UpdatesPage: React.FC = React.memo(() => {
  const { markAllAsSeen, hasUnseenUpdates, refreshUpdates, loading: contextLoading, unseenUpdates } = useUpdates();
  
  // Consolidated state for pagination and filters
  const [pageState, setPageState] = useState({
    updates: [] as AppUpdate[],
    loading: true,
    currentPage: 1,
    itemsPerPage: 10,
    filter: 'all' as 'all' | 'unread',
    priorityFilter: 'all' as 'all' | 'critical' | 'high' | 'normal' | 'low'
  });
  
  const [paginationInfo, setPaginationInfo] = useState<{
    total: number;
    totalPages: number;
    currentPage: number;
    hasMore: boolean;
  } | null>(null);


  const fetchUpdatesPaginated = useCallback(async (page: number, limit: number) => {
    setPageState(prev => ({ ...prev, loading: true }));
    try {
      // Get total count
      const { count, error: countError } = await supabase
        .from('app_updates')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (countError) throw countError;

      // Get paginated data
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error } = await supabase
        .from('app_updates')
        .select('id, version, title, description, release_date, is_active, priority, created_by, created_at, updated_at')
        .eq('is_active', true)
        .order('release_date', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        currentPage: page,
        hasMore: to < (count || 0) - 1
      };
    } catch (error) {
      console.error('Error fetching paginated updates:', error);
      throw error;
    } finally {
      setPageState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const loadPaginatedData = useCallback(async () => {
    try {
      const result = await fetchUpdatesPaginated(pageState.currentPage, pageState.itemsPerPage);
      setPageState(prev => ({ ...prev, updates: result.data }));
      setPaginationInfo({
        total: result.total,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        hasMore: result.hasMore
      });
    } catch (error) {
      console.error('Error loading paginated data:', error);
    }
  }, [fetchUpdatesPaginated, pageState.currentPage, pageState.itemsPerPage]);

  useEffect(() => {
    loadPaginatedData();
  }, [loadPaginatedData]);

  const handleRefresh = useCallback(async () => {
    await loadPaginatedData();
    await refreshUpdates();
  }, [loadPaginatedData, refreshUpdates]);

  const handleMarkAllAsSeen = useCallback(async () => {
    await markAllAsSeen();
    await loadPaginatedData();
  }, [markAllAsSeen, loadPaginatedData]);

  // Memoized filtered updates to prevent unnecessary re-calculations
  const filteredUpdates = useMemo(() => {
    return pageState.updates.filter(update => {
      const matchesPriority = pageState.priorityFilter === 'all' || update.priority === pageState.priorityFilter;
      const matchesFilter = pageState.filter === 'all' || (pageState.filter === 'unread' && unseenUpdates.some(u => u.id === update.id));
      return matchesPriority && matchesFilter;
    });
  }, [pageState.updates, pageState.priorityFilter, pageState.filter, unseenUpdates]);

  if (pageState.loading || contextLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Memuat pembaruan terbaru...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Pembaruan Aplikasi</h1>
                <p className="text-gray-600 mt-1">
                  Ikuti perkembangan dan fitur terbaru aplikasi
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {hasUnseenUpdates && (
                <button
                  onClick={handleMarkAllAsSeen}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Tandai Semua Sudah Dibaca
                </button>
              )}
              
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                disabled={pageState.loading || contextLoading}
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Kontrol Paginasi */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <label htmlFor="itemsPerPage">Items per page:</label>
                  <select
                    id="itemsPerPage"
                    value={pageState.itemsPerPage}
                    onChange={(e) => {
                      setPageState(prev => ({ ...prev, itemsPerPage: Number(e.target.value), currentPage: 1 }));
                    }}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                {paginationInfo && (
                  <span className="text-blue-600 font-medium">
                    Total: {paginationInfo.total} update
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
            </div>
            
            <select
              value={pageState.filter}
              onChange={(e) => setPageState(prev => ({ ...prev, filter: e.target.value as 'all' | 'unread' }))}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 mr-4"
            >
              <option value="all">Semua</option>
              <option value="unread">Belum Dibaca</option>
            </select>

            <select
              value={pageState.priorityFilter}
              onChange={(e) => setPageState(prev => ({ ...prev, priorityFilter: e.target.value as any }))}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Prioritas</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {filteredUpdates.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Belum Ada Pembaruan
            </h3>
            <p className="text-gray-600">
              {pageState.updates.length === 0
                ? "Belum ada pembaruan aplikasi. Pantau terus halaman ini untuk mendapatkan info terbaru!"
                : "Tidak ada pembaruan yang sesuai dengan filter yang dipilih."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredUpdates.map((update, index) => (
              <UpdateCard
                key={update.id}
                update={update}
                isLatest={index === 0}
                isUnread={unseenUpdates.some(u => u.id === update.id)}
              />
            ))}
          </div>
        )}
        
        {/* Pagination Controls */}
        {paginationInfo && paginationInfo.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Halaman {paginationInfo.currentPage} dari {paginationInfo.totalPages}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPageState(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
                disabled={pageState.currentPage === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              
              <span className="px-3 py-2 text-sm">
                {pageState.currentPage} / {paginationInfo.totalPages}
              </span>
              
              <button
                onClick={() => setPageState(prev => ({ ...prev, currentPage: Math.min(paginationInfo.totalPages, prev.currentPage + 1) }))}
                disabled={pageState.currentPage === paginationInfo.totalPages}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default UpdatesPage;
