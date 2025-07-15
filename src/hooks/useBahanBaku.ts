const updateBahanBaku = async (id: string, updatedBahan: Partial<BahanBaku>) => {
  console.log('Received updatedBahan:', updatedBahan); // Log input

  const bahanToUpdate: Partial<any> = {
    updated_at: new Date().toISOString(),
  };

  // Pastikan semua field yang mungkin diubah selalu dimasukkan
  if (updatedBahan.nama !== undefined) bahanToUpdate.nama = updatedBahan.nama;
  if (updatedBahan.kategori !== undefined) bahanToUpdate.kategori = updatedBahan.kategori;
  if (updatedBahan.stok !== undefined) bahanToUpdate.stok = updatedBahan.stok;
  if (updatedBahan.satuan !== undefined) bahanToUpdate.satuan = updatedBahan.satuan;
  if (updatedBahan.minimum !== undefined) bahanToUpdate.minimum = updatedBahan.minimum;
  if (updatedBahan.supplier !== undefined) bahanToUpdate.supplier = updatedBahan.supplier;
  if (updatedBahan.hargaSatuan !== undefined) bahanToUpdate.harga_satuan = updatedBahan.hargaSatuan;
  if (updatedBahan.tanggalKadaluwarsa !== undefined) {
    bahanToUpdate.tanggal_kadaluwarsa = updatedBahan.tanggalKadaluwarsa?.toISOString() || null;
  } else if (Object.prototype.hasOwnProperty.call(updatedBahan, 'tanggalKadaluwarsa') && updatedBahan.tanggalKadaluwarsa === null) {
    bahanToUpdate.tanggal_kadaluwarsa = null;
  }

  // Pastikan purchase details selalu diperbarui, bahkan jika null
  bahanToUpdate.jumlah_beli_kemasan = updatedBahan.jumlahBeliKemasan ?? null;
  bahanToUpdate.satuan_kemasan = updatedBahan.satuanKemasan ?? null;
  bahanToUpdate.harga_total_beli_kemasan = updatedBahan.hargaTotalBeliKemasan ?? null;

  console.log('Final bahanToUpdate before update:', bahanToUpdate); // Log sebelum update

  const { error, data } = await supabase.from('bahan_baku').update(bahanToUpdate).eq('id', id).select();

  if (error) {
    console.error('Error updating bahan baku in DB:', error);
    toast.error(`Gagal memperbarui bahan baku: ${error.message}`);
    return false;
  }

  if (data && data.length > 0) {
    const updatedItem = data[0];
    setBahanBaku(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              ...updatedBahan,
              tanggalKadaluwarsa: safeParseDate(updatedItem.tanggal_kadaluwarsa),
              hargaSatuan: parseFloat(updatedItem.harga_satuan) || 0,
              jumlahBeliKemasan: updatedItem.jumlah_beli_kemasan !== null ? parseFloat(updatedItem.jumlah_beli_kemasan) : null,
              satuanKemasan: updatedItem.satuan_kemasan || null,
              hargaTotalBeliKemasan: updatedItem.harga_total_beli_kemasan !== null ? parseFloat(updatedItem.harga_total_beli_kemasan) : null,
              updatedAt: safeParseDate(updatedItem.updated_at),
            }
          : item
      )
    );
    console.log('Updated bahanBaku state:', bahanBaku); // Log state setelah update
  } else {
    console.warn('No data returned from Supabase update, falling back to local update');
    setBahanBaku(prev =>
      prev.map(item =>
        item.id === id ? { ...item, ...updatedBahan, updatedAt: new Date() } : item
      )
    );
  }

  await syncToCloud();
  toast.success(`Bahan baku berhasil diperbarui!`);
  return true;
};