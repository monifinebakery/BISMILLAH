// src/components/assets/types/api.ts

// Database Asset Schema (snake_case)
export interface DatabaseAsset {
  id: string;
  user_id: string;
  nama: string;
  kategori: string;
  nilai_awal: number;
  nilai_sekarang: number;
  tanggal_beli: string;
  kondisi: string;
  lokasi: string;
  deskripsi: string | null;
  depresiasi: number | null;
  created_at: string;
  updated_at: string;
}

// Database Insert/Update Payload
export interface DatabaseAssetInput {
  user_id: string;
  nama: string;
  kategori: string;
  nilai_awal: number;
  nilai_sekarang: number;
  tanggal_beli: string;
  kondisi: string;
  lokasi: string;
  deskripsi?: string | null;
  depresiasi?: number | null;
}

export interface DatabaseAssetUpdate {
  nama?: string;
  kategori?: string;
  nilai_awal?: number;
  nilai_sekarang?: number;
  tanggal_beli?: string;
  kondisi?: string;
  lokasi?: string;
  deskripsi?: string | null;
  depresiasi?: number | null;
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface AssetListResponse {
  assets: DatabaseAsset[];
  total: number;
}

// Realtime Event Types
export interface RealtimeAssetEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: DatabaseAsset;
  old?: { id: string };
}

// Query Options
export interface AssetQueryOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
}

// Error Types
export interface AssetError {
  message: string;
  code?: string;
  details?: any;
}