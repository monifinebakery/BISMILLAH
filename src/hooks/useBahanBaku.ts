const updateBahanBaku = async (id: string, updatedBahan: Partial<BahanBaku>) => {
  const bahanToUpdate: Partial<any> = {
    updated_at: new Date().toISOString(), // Always update the timestamp
  };

  // Explicitly map all possible fields from updatedBahan to snake_case
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

  // Ensure purchase details are included
  if (updatedBahan.jumlahBeliKemasan !== undefined) {
    bahanToUpdate.jumlah_beli_kemasan = updatedBahan.jumlahBeliKemasan ?? null;
  }
  if (updatedBahan.satuanKemasan !== undefined) {
    bahanToUpdate.satuan_kemasan = updatedBahan.satuanKemasan ?? null;
  }
  if (updatedBahan.hargaTotalBeliKemasan !== undefined) {
    bahanToUpdate.harga_total_beli_kemasan = updatedBahan.hargaTotalBeliKemasan ?? null;
  }

  const { error, data } = await supabase.from('bahan_baku').update(bahanToUpdate).eq('id', id).select();

  if (error) {
    console.error('Error updating bahan baku in DB:', error);
    toast.error(`Gagal memperbarui bahan baku: ${error.message}`);
    return false;
  }

  // Update local state with the response from Supabase to ensure consistency
  if (data && data.length > 0) {
    const updatedItem = data[0];
    setBahanBaku(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              ...updatedBahan,
              tanggalKadaluwarsa: updatedItem.tanggal_kadaluwarsa ? new Date(updatedItem.tanggal_kadaluwarsa) : undefined,
              hargaSatuan: updatedItem.harga_satuan,
              jumlahBeliKemasan: updatedItem.jumlah_beli_kemasan,
              satuanKemasan: updatedItem.satuan_kemasan,
              hargaTotalBeliKemasan: updatedItem.harga_total_beli_kemasan,
              updatedAt: new Date(updatedItem.updated_at),
            }
          : item
      )
    );
  } else {
    // Fallback to local update if data is not returned
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