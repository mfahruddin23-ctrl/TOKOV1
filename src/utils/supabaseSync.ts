import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Produk, Penjualan, Pembelian, Supplier, Pelanggan, Pengguna } from '../types';
import { SyncPayload } from './spreadsheetSync';

let supabaseInstance: SupabaseClient | null = null;
let currentConfig = { url: '', key: '' };
let activeRealtimeChannel: RealtimeChannel | null = null;

export function getSupabaseClient(url: string, key: string): SupabaseClient | null {
  if (!url || !key) return null;
  const cleanUrl = url.trim();
  const cleanKey = key.trim();

  if (supabaseInstance && currentConfig.url === cleanUrl && currentConfig.key === cleanKey) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(cleanUrl, cleanKey);
    currentConfig = { url: cleanUrl, key: cleanKey };
    return supabaseInstance;
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
}

/**
 * Format helpers for Realtime rows
 */
export function formatProdukFromRow(row: any): Produk {
  return {
    id: String(row.id),
    barcode: String(row.barcode),
    nama: String(row.nama),
    kategori: row.kategori || 'Umum',
    satuan: row.satuan || 'Pcs',
    hargaBeli: Number(row.harga_beli ?? row.hargaBeli ?? 0),
    hargaJual: Number(row.harga_jual ?? row.hargaJual ?? 0),
    stok: Number(row.stok ?? 0),
    minStok: Number(row.min_stok ?? row.minStok ?? 5),
    supplier: row.supplier || '',
    status: (row.status || 'Aktif') as 'Aktif' | 'Nonaktif',
    foto: row.foto || undefined,
  };
}

export function formatPenjualanFromRow(row: any): Penjualan {
  return {
    id: String(row.id),
    tanggal: row.tanggal,
    items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items || [],
    totalQty: Number(row.total_qty ?? row.totalQty ?? 0),
    subtotal: Number(row.subtotal ?? 0),
    diskonTotal: Number(row.diskon_total ?? row.diskonTotal ?? 0),
    pajak: Number(row.pajak ?? 0),
    totalBayar: Number(row.total_bayar ?? row.totalBayar ?? 0),
    jumlahUang: Number(row.jumlah_uang ?? row.jumlahUang ?? 0),
    kembalian: Number(row.kembalian ?? 0),
    kasir: row.kasir || 'Kasir',
    pelanggan: row.pelanggan || '',
    metodePembayaran: (row.metode_pembayaran || row.metodePembayaran || 'Tunai') as 'Tunai' | 'QRIS' | 'Transfer',
  };
}

export function formatPembelianFromRow(row: any): Pembelian {
  return {
    id: String(row.id),
    tanggal: row.tanggal,
    supplier: row.supplier,
    barcode: row.barcode,
    namaProduk: row.nama_produk || row.namaProduk,
    qty: Number(row.qty ?? 0),
    hargaBeli: Number(row.harga_beli ?? row.hargaBeli ?? 0),
    total: Number(row.total ?? 0),
    catatan: row.catatan || '',
  };
}

export function formatSupplierFromRow(row: any): Supplier {
  return {
    id: String(row.id),
    nama: row.nama,
    alamat: row.alamat || '',
    telepon: row.telepon || '',
    email: row.email || '',
  };
}

export function formatPelangganFromRow(row: any): Pelanggan {
  return {
    id: String(row.id),
    nama: row.nama,
    telepon: row.telepon || '',
    alamat: row.alamat || '',
    poin: Number(row.poin || 0),
  };
}

export function formatPenggunaFromRow(row: any): Pengguna {
  return {
    username: row.username,
    nama: row.nama,
    password: row.password || '',
    role: (row.role || 'Kasir') as 'Admin' | 'Kasir',
  };
}

/**
 * Test connectivity with Supabase project
 */
export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient(url, key);
  if (!client) {
    return { success: false, message: 'URL atau Anon Key Supabase tidak valid.' };
  }

  try {
    const { error } = await client.from('produk').select('id').limit(1);

    if (error) {
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Berhasil terhubung ke server Supabase! (Catatan: Tabel produk belum dibuat, silakan jalankan SQL Schema).',
        };
      }
      return { success: false, message: `Koneksi Supabase gagal: ${error.message}` };
    }

    return { success: true, message: 'Koneksi ke database Supabase Realtime berhasil & tabel terdeteksi!' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Gagal menghubungi server Supabase: ${msg}` };
  }
}

/**
 * Pull all data from Supabase tables
 */
export async function pullFromSupabase(url: string, key: string): Promise<Partial<SyncPayload>> {
  const client = getSupabaseClient(url, key);
  if (!client) throw new Error('Supabase client belum terkonfigurasi');

  const [resProduk, resPenjualan, resPembelian, resSupplier, resPelanggan, resPengguna] = await Promise.all([
    client.from('produk').select('*'),
    client.from('penjualan').select('*'),
    client.from('pembelian').select('*'),
    client.from('supplier').select('*'),
    client.from('pelanggan').select('*'),
    client.from('pengguna').select('*'),
  ]);

  const payload: Partial<SyncPayload> = {};

  if (resProduk.data) {
    payload.products = resProduk.data.map(formatProdukFromRow);
  }

  if (resPenjualan.data) {
    payload.sales = resPenjualan.data.map(formatPenjualanFromRow);
  }

  if (resPembelian.data) {
    payload.purchases = resPembelian.data.map(formatPembelianFromRow);
  }

  if (resSupplier.data) {
    payload.suppliers = resSupplier.data.map(formatSupplierFromRow);
  }

  if (resPelanggan.data) {
    payload.customers = resPelanggan.data.map(formatPelangganFromRow);
  }

  if (resPengguna.data) {
    payload.users = resPengguna.data.map(formatPenggunaFromRow);
  }

  return payload;
}

/**
 * Push all local data into Supabase tables (Upsert)
 */
export async function pushToSupabase(
  url: string,
  key: string,
  data: SyncPayload
): Promise<{ success: boolean; message: string; counts: Record<string, number> }> {
  const client = getSupabaseClient(url, key);
  if (!client) throw new Error('Supabase client belum terkonfigurasi');

  // Format Produk
  const produkRows = data.products.map((p) => ({
    id: p.id,
    barcode: p.barcode,
    nama: p.nama,
    kategori: p.kategori,
    satuan: p.satuan,
    harga_beli: p.hargaBeli,
    harga_jual: p.hargaJual,
    stok: p.stok,
    min_stok: p.minStok,
    supplier: p.supplier,
    status: p.status,
    foto: p.foto || null,
  }));

  // Format Penjualan
  const penjualanRows = data.sales.map((s) => ({
    id: s.id,
    tanggal: s.tanggal,
    items: JSON.stringify(s.items),
    total_qty: s.totalQty,
    subtotal: s.subtotal,
    diskon_total: s.diskonTotal,
    pajak: s.pajak,
    total_bayar: s.totalBayar,
    jumlah_uang: s.jumlahUang,
    kembalian: s.kembalian,
    kasir: s.kasir,
    pelanggan: s.pelanggan || null,
    metode_pembayaran: s.metodePembayaran,
  }));

  // Format Pembelian
  const pembelianRows = data.purchases.map((b) => ({
    id: b.id,
    tanggal: b.tanggal,
    supplier: b.supplier,
    barcode: b.barcode,
    nama_produk: b.namaProduk,
    qty: b.qty,
    harga_beli: b.hargaBeli,
    total: b.total,
    catatan: b.catatan || null,
  }));

  // Format Supplier
  const supplierRows = data.suppliers.map((sup) => ({
    id: sup.id,
    nama: sup.nama,
    alamat: sup.alamat,
    telepon: sup.telepon,
    email: sup.email,
  }));

  // Format Pelanggan
  const pelangganRows = data.customers.map((c) => ({
    id: c.id,
    nama: c.nama,
    telepon: c.telepon,
    alamat: c.alamat,
    poin: c.poin || 0,
  }));

  // Format Pengguna
  const penggunaRows = data.users.map((u) => ({
    username: u.username,
    password: u.password,
    nama: u.nama,
    role: u.role,
  }));

  // Upsert each table and capture exact response
  const [resProd, resPenj, resPemb, resSup, resPel, resPeng] = await Promise.all([
    produkRows.length > 0 ? client.from('produk').upsert(produkRows, { onConflict: 'id' }) : { error: null },
    penjualanRows.length > 0 ? client.from('penjualan').upsert(penjualanRows, { onConflict: 'id' }) : { error: null },
    pembelianRows.length > 0 ? client.from('pembelian').upsert(pembelianRows, { onConflict: 'id' }) : { error: null },
    supplierRows.length > 0 ? client.from('supplier').upsert(supplierRows, { onConflict: 'id' }) : { error: null },
    pelangganRows.length > 0 ? client.from('pelanggan').upsert(pelangganRows, { onConflict: 'id' }) : { error: null },
    penggunaRows.length > 0 ? client.from('pengguna').upsert(penggunaRows, { onConflict: 'username' }) : { error: null },
  ]);

  const errors: string[] = [];
  if (resProd?.error) errors.push(`Produk: ${resProd.error.message}`);
  if (resPenj?.error) errors.push(`Penjualan: ${resPenj.error.message}`);
  if (resPemb?.error) errors.push(`Pembelian: ${resPemb.error.message}`);
  if (resSup?.error) errors.push(`Supplier: ${resSup.error.message}`);
  if (resPel?.error) errors.push(`Pelanggan: ${resPel.error.message}`);
  if (resPeng?.error) errors.push(`Pengguna: ${resPeng.error.message}`);

  if (errors.length > 0) {
    throw new Error(`Sebagian tabel gagal disinkronkan ke Supabase: ${errors.join(', ')}`);
  }

  const counts = {
    products: produkRows.length,
    sales: penjualanRows.length,
    purchases: pembelianRows.length,
    suppliers: supplierRows.length,
    customers: pelangganRows.length,
    users: penggunaRows.length,
  };

  return {
    success: true,
    message: `Berhasil sinkron ke Supabase Realtime! (${produkRows.length} produk, ${penjualanRows.length} transaksi, ${pembelianRows.length} pembelian)`,
    counts,
  };
}

/**
 * Realtime Event Callbacks interface
 */
export interface SupabaseRealtimeCallbacks {
  onProductChange?: (eventType: 'INSERT' | 'UPDATE' | 'DELETE', product: Produk) => void;
  onSaleChange?: (eventType: 'INSERT' | 'UPDATE' | 'DELETE', sale: Penjualan) => void;
  onPurchaseChange?: (eventType: 'INSERT' | 'UPDATE' | 'DELETE', purchase: Pembelian) => void;
  onSupplierChange?: (eventType: 'INSERT' | 'UPDATE' | 'DELETE', supplier: Supplier) => void;
  onCustomerChange?: (eventType: 'INSERT' | 'UPDATE' | 'DELETE', customer: Pelanggan) => void;
  onUserChange?: (eventType: 'INSERT' | 'UPDATE' | 'DELETE', user: Pengguna) => void;
  onStatusChange?: (status: 'connected' | 'connecting' | 'disconnected' | 'error') => void;
}

/**
 * Setup continuous 2-way Realtime Listener via Supabase WebSocket
 */
export function subscribeToSupabaseRealtime(
  url: string,
  key: string,
  callbacks: SupabaseRealtimeCallbacks
): () => void {
  const client = getSupabaseClient(url, key);
  if (!client) {
    callbacks.onStatusChange?.('disconnected');
    return () => {};
  }

  // Cleanup existing channel if any
  if (activeRealtimeChannel) {
    client.removeChannel(activeRealtimeChannel);
    activeRealtimeChannel = null;
  }

  callbacks.onStatusChange?.('connecting');

  try {
    const channel = client
      .channel('tokoapp-realtime-hub')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'produk' },
        (payload) => {
          const row = payload.eventType === 'DELETE' ? payload.old : payload.new;
          if (row && callbacks.onProductChange) {
            callbacks.onProductChange(payload.eventType as any, formatProdukFromRow(row));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'penjualan' },
        (payload) => {
          const row = payload.eventType === 'DELETE' ? payload.old : payload.new;
          if (row && callbacks.onSaleChange) {
            callbacks.onSaleChange(payload.eventType as any, formatPenjualanFromRow(row));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pembelian' },
        (payload) => {
          const row = payload.eventType === 'DELETE' ? payload.old : payload.new;
          if (row && callbacks.onPurchaseChange) {
            callbacks.onPurchaseChange(payload.eventType as any, formatPembelianFromRow(row));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'supplier' },
        (payload) => {
          const row = payload.eventType === 'DELETE' ? payload.old : payload.new;
          if (row && callbacks.onSupplierChange) {
            callbacks.onSupplierChange(payload.eventType as any, formatSupplierFromRow(row));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pelanggan' },
        (payload) => {
          const row = payload.eventType === 'DELETE' ? payload.old : payload.new;
          if (row && callbacks.onCustomerChange) {
            callbacks.onCustomerChange(payload.eventType as any, formatPelangganFromRow(row));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pengguna' },
        (payload) => {
          const row = payload.eventType === 'DELETE' ? payload.old : payload.new;
          if (row && callbacks.onUserChange) {
            callbacks.onUserChange(payload.eventType as any, formatPenggunaFromRow(row));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          callbacks.onStatusChange?.('connected');
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          callbacks.onStatusChange?.('error');
        } else if (status === 'CLOSED') {
          callbacks.onStatusChange?.('disconnected');
        }
      });

    activeRealtimeChannel = channel;

    return () => {
      if (client && channel) {
        client.removeChannel(channel);
      }
      activeRealtimeChannel = null;
    };
  } catch (err) {
    console.error('Failed to subscribe to Supabase Realtime:', err);
    callbacks.onStatusChange?.('error');
    return () => {};
  }
}

/**
 * Generate 1-click SQL Schema for Supabase SQL Editor with Full Realtime Publication
 */
export function generateSupabaseSqlSchema(): string {
  return `-- ====================================================================
-- SKRIP SQL DATABASE SUPABASE REALTIME UNTUK APLIKASI TOKOAPPS
-- Jalankan skrip ini 1 KALI di Supabase Dashboard -> SQL Editor -> Run
-- ====================================================================

-- 1. Tabel Produk
CREATE TABLE IF NOT EXISTS produk (
  id TEXT PRIMARY KEY,
  barcode TEXT NOT NULL,
  nama TEXT NOT NULL,
  kategori TEXT,
  satuan TEXT,
  harga_beli NUMERIC DEFAULT 0,
  harga_jual NUMERIC DEFAULT 0,
  stok NUMERIC DEFAULT 0,
  min_stok NUMERIC DEFAULT 5,
  supplier TEXT,
  status TEXT DEFAULT 'Aktif',
  foto TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Penjualan
CREATE TABLE IF NOT EXISTS penjualan (
  id TEXT PRIMARY KEY,
  tanggal TIMESTAMPTZ DEFAULT NOW(),
  items JSONB NOT NULL,
  total_qty NUMERIC DEFAULT 0,
  subtotal NUMERIC DEFAULT 0,
  diskon_total NUMERIC DEFAULT 0,
  pajak NUMERIC DEFAULT 0,
  total_bayar NUMERIC DEFAULT 0,
  jumlah_uang NUMERIC DEFAULT 0,
  kembalian NUMERIC DEFAULT 0,
  kasir TEXT,
  pelanggan TEXT,
  metode_pembayaran TEXT DEFAULT 'Tunai',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Pembelian
CREATE TABLE IF NOT EXISTS pembelian (
  id TEXT PRIMARY KEY,
  tanggal TIMESTAMPTZ DEFAULT NOW(),
  supplier TEXT,
  barcode TEXT,
  nama_produk TEXT,
  qty NUMERIC DEFAULT 0,
  harga_beli NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Supplier
CREATE TABLE IF NOT EXISTS supplier (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  alamat TEXT,
  telepon TEXT,
  email TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Pelanggan
CREATE TABLE IF NOT EXISTS pelanggan (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  telepon TEXT,
  alamat TEXT,
  poin NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabel Pengguna
CREATE TABLE IF NOT EXISTS pengguna (
  username TEXT PRIMARY KEY,
  password TEXT,
  nama TEXT NOT NULL,
  role TEXT DEFAULT 'Kasir',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nonaktifkan Row Level Security (RLS) untuk kemudahan akses Anon Key
ALTER TABLE produk DISABLE ROW LEVEL SECURITY;
ALTER TABLE penjualan DISABLE ROW LEVEL SECURITY;
ALTER TABLE pembelian DISABLE ROW LEVEL SECURITY;
ALTER TABLE supplier DISABLE ROW LEVEL SECURITY;
ALTER TABLE pelanggan DISABLE ROW LEVEL SECURITY;
ALTER TABLE pengguna DISABLE ROW LEVEL SECURITY;

-- Set Replica Identity Full untuk Realtime Broadcast
ALTER TABLE produk REPLICA IDENTITY FULL;
ALTER TABLE penjualan REPLICA IDENTITY FULL;
ALTER TABLE pembelian REPLICA IDENTITY FULL;
ALTER TABLE supplier REPLICA IDENTITY FULL;
ALTER TABLE pelanggan REPLICA IDENTITY FULL;
ALTER TABLE pengguna REPLICA IDENTITY FULL;

-- ====================================================================
-- 7. AKTIFKAN REPLIKASI REALTIME SUPABASE (WEBSOCKET LIVE MULTI-DEVICE)
-- ====================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'produk'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE produk, penjualan, pembelian, supplier, pelanggan, pengguna;
  END IF;
END $$;
`;
}
