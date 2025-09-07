import type { NewOrder, OrderItem } from '../types';

export type ImportedOrder = NewOrder;

/**
 * Helper function to get supported column headers for order import
 */
export const getSupportedOrderImportHeaders = () => {
  return {
    required: {
      pelanggan: 'Nama pelanggan atau toko',
      nama: 'Nama produk/item',
      kuantitas: 'Jumlah pesanan (angka)',
      satuan: 'Satuan kuantitas (porsi, pcs, gelas, dll)',
      harga: 'Harga default (untuk backward compatibility)'
    },
    optional: {
      tanggal_pesanan: 'Tanggal pesanan (YYYY-MM-DD) - default: hari ini',
      tanggal_selesai: 'Tanggal selesai pesanan (YYYY-MM-DD) - opsional',
      tanggal: 'Tanggal pesanan (backward compatibility)',
      pricing_mode: 'Mode pricing: per_portion atau per_piece',
      price_per_portion: 'Harga per porsi (wajib jika pricing_mode = per_portion)',
      price_per_piece: 'Harga per pcs (wajib jika pricing_mode = per_piece)'
    }
  };
};

/**
 * Validate CSV headers to ensure compatibility
 */
export const validateOrderImportHeaders = (headers: string[]): { isValid: boolean; errors: string[]; warnings: string[] } => {
  const normalizedHeaders = headers.map(h => h.trim().toLowerCase());
  const supportedHeaders = getSupportedOrderImportHeaders();
  const requiredHeaders = Object.keys(supportedHeaders.required);
  const optionalHeaders = Object.keys(supportedHeaders.optional);
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check required headers
  const missingRequired = requiredHeaders.filter(header => !normalizedHeaders.includes(header));
  if (missingRequired.length > 0) {
    errors.push(`Kolom wajib tidak ditemukan: ${missingRequired.join(', ')}`);
  }
  
  // Check for unknown headers
  const knownHeaders = [...requiredHeaders, ...optionalHeaders];
  const unknownHeaders = normalizedHeaders.filter(header => !knownHeaders.includes(header) && !header.startsWith('#'));
  if (unknownHeaders.length > 0) {
    warnings.push(`Kolom tidak dikenal akan diabaikan: ${unknownHeaders.join(', ')}`);
  }
  
  // Check for pricing completeness
  const hasPricingMode = normalizedHeaders.includes('pricing_mode');
  const hasPricePerPortion = normalizedHeaders.includes('price_per_portion');
  const hasPricePerPiece = normalizedHeaders.includes('price_per_piece');
  
  if (hasPricingMode && !hasPricePerPortion && !hasPricePerPiece) {
    warnings.push('pricing_mode ditemukan tapi price_per_portion dan price_per_piece tidak ada. Mode pricing mungkin tidak berfungsi optimal.');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

interface RawRow {
  pelanggan: string;
  tanggal_pesanan?: string;
  tanggal_selesai?: string;
  tanggal?: string; // backward compatibility
  nama: string;
  kuantitas: number;
  satuan: string;
  harga: number;
  // New pricing fields
  pricing_mode?: 'per_portion' | 'per_piece' | string;
  price_per_portion?: number;
  price_per_piece?: number;
}

/**
 * Parse CSV file menjadi array pesanan.
 * Format kolom yang didukung:
 * Kolom wajib: pelanggan,tanggal,nama,kuantitas,satuan,harga
 * Kolom opsional: pricing_mode,price_per_portion,price_per_piece
 * 
 * Format pricing_mode:
 * - per_portion: menggunakan price_per_portion untuk kalkulasi
 * - per_piece: menggunakan price_per_piece untuk kalkulasi
 * - jika kosong: fallback ke kolom harga
 */
export async function parseOrderCSV(file: File): Promise<ImportedOrder[]> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Deteksi pemisah kolom: dukung koma dan titik koma
  const delimiter = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0]
    .split(delimiter)
    .map((h) => h.trim().toLowerCase());

  const getIndex = (name: string) => headers.indexOf(name);
  const idxPelanggan = getIndex('pelanggan');
  const idxTanggalPesanan = getIndex('tanggal_pesanan');
  const idxTanggalSelesai = getIndex('tanggal_selesai');
  const idxTanggal = getIndex('tanggal'); // backward compatibility
  const idxNama = getIndex('nama');
  const idxQty = getIndex('kuantitas');
  const idxSatuan = getIndex('satuan');
  const idxHarga = getIndex('harga');
  
  // New pricing fields (optional)
  const idxPricingMode = getIndex('pricing_mode');
  const idxPricePerPortion = getIndex('price_per_portion');
  const idxPricePerPiece = getIndex('price_per_piece');

  // Check required columns - tanggal is optional now (can use tanggal_pesanan or default to today)
  if ([idxPelanggan, idxNama, idxQty, idxSatuan, idxHarga].some((i) => i === -1)) {
    throw new Error('Kolom wajib tidak lengkap. Diperlukan: pelanggan, nama, kuantitas, satuan, harga');
  }

  const rows: RawRow[] = lines.slice(1).map((line, lineIndex) => {
    const values = line.split(delimiter).map((v) => v.trim());
    
    // Parse pricing fields with proper validation
    const pricingMode = idxPricingMode >= 0 ? values[idxPricingMode] : '';
    const pricePerPortion = idxPricePerPortion >= 0 ? parseFloat(values[idxPricePerPortion] || '0') || undefined : undefined;
    const pricePerPiece = idxPricePerPiece >= 0 ? parseFloat(values[idxPricePerPiece] || '0') || undefined : undefined;
    
    return {
      pelanggan: values[idxPelanggan] || '',
      tanggal_pesanan: idxTanggalPesanan >= 0 ? values[idxTanggalPesanan] : undefined,
      tanggal_selesai: idxTanggalSelesai >= 0 ? values[idxTanggalSelesai] : undefined,
      tanggal: idxTanggal >= 0 ? values[idxTanggal] : undefined, // backward compatibility
      nama: values[idxNama] || '',
      kuantitas: parseFloat(values[idxQty] || '0'),
      satuan: values[idxSatuan] || '',
      harga: parseFloat(values[idxHarga] || '0'),
      pricing_mode: pricingMode || undefined,
      price_per_portion: pricePerPortion,
      price_per_piece: pricePerPiece,
    };
  });

  /**
   * Helper function to validate and calculate pricing based on pricing mode
   */
  const calculateItemPricing = (row: RawRow, rowIndex: number) => {
    const { pricing_mode, price_per_portion, price_per_piece, harga, kuantitas } = row;
    
    let pricingMode: 'per_portion' | 'per_piece' | undefined;
    let activePrice: number;
    let total: number;
    
    // Normalize pricing mode
    if (pricing_mode === 'per_portion' || pricing_mode === 'per_piece') {
      pricingMode = pricing_mode;
    }
    
    // Validate pricing data consistency
    if (pricingMode === 'per_portion') {
      if (!price_per_portion || price_per_portion <= 0) {
        throw new Error(`Baris ${rowIndex + 2}: pricing_mode 'per_portion' memerlukan price_per_portion yang valid`);
      }
      activePrice = price_per_portion;
      total = kuantitas * price_per_portion;
    } else if (pricingMode === 'per_piece') {
      if (!price_per_piece || price_per_piece <= 0) {
        throw new Error(`Baris ${rowIndex + 2}: pricing_mode 'per_piece' memerlukan price_per_piece yang valid`);
      }
      activePrice = price_per_piece;
      total = kuantitas * price_per_piece;
    } else {
      // Fallback to legacy harga column
      if (!harga || harga <= 0) {
        throw new Error(`Baris ${rowIndex + 2}: harga harus lebih dari 0`);
      }
      activePrice = harga;
      total = kuantitas * harga;
    }
    
    return {
      pricingMode,
      activePrice,
      total,
      pricePerPortion: price_per_portion,
      pricePerPiece: price_per_piece
    };
  };

  const grouped = new Map<string, ImportedOrder>();
  const errors: string[] = [];

  rows.forEach((r, index) => {
    if (!r.pelanggan || !r.nama) {
      errors.push(`Baris ${index + 2}: Pelanggan dan nama barang wajib diisi`);
      return;
    }
    
    // Determine order date: prefer tanggal_pesanan, then tanggal, then today
    const orderDate = r.tanggal_pesanan || r.tanggal || new Date().toISOString().split('T')[0];
    
    if (!orderDate) {
      errors.push(`Baris ${index + 2}: Tanggal pesanan tidak valid`);
      return;
    }
    
    if (!r.kuantitas || r.kuantitas <= 0) {
      errors.push(`Baris ${index + 2}: Kuantitas harus lebih dari 0`);
      return;
    }
    
    try {
      const pricing = calculateItemPricing(r, index);
      
      const orderDate = r.tanggal_pesanan || r.tanggal || new Date().toISOString().split('T')[0];
      const key = `${r.pelanggan}-${orderDate}`;
      let order = grouped.get(key);
      if (!order) {
        order = {
          namaPelanggan: r.pelanggan,
          tanggal: new Date(orderDate),
          tanggalSelesai: r.tanggal_selesai ? new Date(r.tanggal_selesai) : undefined,
          items: [],
        };
        grouped.set(key, order);
      }

      const item: OrderItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: r.nama,
        quantity: r.kuantitas,
        price: pricing.activePrice,
        total: pricing.total,
        unit: r.satuan,
        // Enhanced pricing support
        pricingMode: pricing.pricingMode,
        pricePerPortion: pricing.pricePerPortion,
        pricePerPiece: pricing.pricePerPiece,
      };
      order.items.push(item);
      
    } catch (pricingError) {
      errors.push(pricingError instanceof Error ? pricingError.message : String(pricingError));
    }
  });
  
  // Throw accumulated errors if any
  if (errors.length > 0) {
    throw new Error(`Kesalahan parsing CSV:\n${errors.join('\n')}`);
  }

  return Array.from(grouped.values()).map(order => {
    const subtotal = order.items.reduce((sum, item) => sum + item.total, 0);
    return {
      namaPelanggan: order.namaPelanggan,
      tanggal: order.tanggal,
      tanggalSelesai: order.tanggalSelesai,
      items: order.items,
      subtotal,
      pajak: 0,
      totalPesanan: subtotal,
      status: 'pending' as const,
    };
  });
}
