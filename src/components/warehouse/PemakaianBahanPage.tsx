// src/components/warehouse/PemakaianBahanPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSkeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Save } from 'lucide-react';

type BahanItem = {
  id: string;
  nama: string;
  satuan?: string;
  harga_rata_rata?: number | null;
  harga_satuan?: number | null;
};

type UsageRow = {
  id: string;
  bahan_baku_id: string;
  qty_base: number;
  tanggal: string;
  harga_efektif?: number | null;
  hpp_value?: number | null;
};

function formatYMD(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function PemakaianBahanPage() {
  const [bahan, setBahan] = useState<BahanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recent, setRecent] = useState<UsageRow[]>([]);

  const [selectedId, setSelectedId] = useState<string>('');
  const [qty, setQty] = useState<string>('');
  const [tanggal, setTanggal] = useState<string>(formatYMD(new Date()));
  const [catatan, setCatatan] = useState<string>('');

  const bahanMap = useMemo(() => {
    const m: Record<string, BahanItem> = {};
    bahan.forEach(b => (m[b.id] = b));
    return m;
  }, [bahan]);

  const effectivePrice = useMemo(() => {
    const b = selectedId ? bahanMap[selectedId] : undefined;
    if (!b) return 0;
    const wac = Number(b.harga_rata_rata ?? 0);
    const base = Number(b.harga_satuan ?? 0);
    return wac > 0 ? wac : base;
  }, [selectedId, bahanMap]);

  const totalValue = useMemo(() => {
    const q = Number(qty || 0);
    return q > 0 ? q * effectivePrice : 0;
  }, [qty, effectivePrice]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setBahan([]);
        setRecent([]);
        setLoading(false);
        return;
      }
      const { data: items, error } = await supabase
        .from('bahan_baku')
        .select('id, nama, satuan, harga_rata_rata, harga_satuan')
        .eq('user_id', user.id)
        .order('nama', { ascending: true });
      if (error) throw error;
      setBahan(items || []);

      const { data: usages, error: usageErr } = await (supabase as any)
        .from('pemakaian_bahan')
        .select('id, bahan_baku_id, qty_base, tanggal, harga_efektif, hpp_value')
        .eq('user_id', user.id)
        .order('tanggal', { ascending: false })
        .limit(10);
      if (usageErr) throw usageErr;
      setRecent(Array.isArray(usages) ? usages : []);
    } catch (e: any) {
      toast.error(e?.message || 'Gagal memuat data pemakaian');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    if (!selectedId) return toast.error('Pilih bahan dulu');
    const q = Number(qty);
    if (!q || q <= 0) return toast.error('Qty harus lebih dari 0');
    if (!tanggal) return toast.error('Tanggal harus diisi');

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Anda belum login');

      const harga_efektif = effectivePrice;
      const hpp_value = q * harga_efektif;

      const { error } = await (supabase as any)
        .from('pemakaian_bahan')
        .insert({
          user_id: user.id,
          bahan_baku_id: selectedId,
          qty_base: q,
          tanggal,
          harga_efektif,
          hpp_value,
          keterangan: catatan || null,
          source_type: 'manual'
        });
      if (error) throw error;

      toast.success('Pemakaian berhasil dicatat');
      setQty('');
      setCatatan('');
      await loadData();
    } catch (e: any) {
      toast.error(e?.message || 'Gagal menyimpan pemakaian');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <LoadingSkeleton type="form" />
        <LoadingSkeleton type="table" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Catat Pemakaian Bahan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Bahan</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih bahan" />
                </SelectTrigger>
                <SelectContent>
                  {bahan.map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.nama}{b.satuan ? ` (${b.satuan})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tanggal</Label>
              <Input type="date" className="mt-1" value={tanggal} onChange={e => setTanggal(e.target.value)} />
            </div>
            <div>
              <Label>Qty</Label>
              <Input type="number" min="0" step="0.01" className="mt-1" value={qty} onChange={e => setQty(e.target.value)} />
            </div>
            <div>
              <Label>Harga Efektif</Label>
              <Input value={effectivePrice.toLocaleString('id-ID')} readOnly className="mt-1" />
            </div>
            <div className="md:col-span-2">
              <Label>Catatan (opsional)</Label>
              <Input className="mt-1" value={catatan} onChange={e => setCatatan(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-gray-600">Total nilai: <span className="font-semibold text-gray-900">Rp {totalValue.toLocaleString('id-ID')}</span></div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadData} disabled={saving}>
                <RefreshCw className="h-4 w-4 mr-2" /> Muat Ulang
              </Button>
              <Button onClick={handleSave} disabled={saving || !selectedId || Number(qty) <= 0}>
                {saving ? (
                  <>
                    <Save className="h-4 w-4 mr-2 animate-pulse" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" /> Simpan Pemakaian
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pemakaian Terakhir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recent.length === 0 ? (
            <div className="text-sm text-gray-500">Belum ada data pemakaian.</div>
          ) : (
            <div className="space-y-2">
              {recent.map((row) => {
                const b = bahanMap[row.bahan_baku_id];
                return (
                  <div key={row.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium text-gray-900">{b?.nama || 'Bahan'}</div>
                      <div className="text-xs text-gray-500">{row.tanggal}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-700">Qty: {row.qty_base} {b?.satuan || ''}</div>
                      <div className="text-sm text-gray-900 font-semibold">Rp {(Number(row.hpp_value || 0)).toLocaleString('id-ID')}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

