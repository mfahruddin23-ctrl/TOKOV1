import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Produk, Penjualan, Pembelian, Supplier, Pelanggan, Pengguna } from '../types';
import { SyncPayload } from './spreadsheetSync';

let supabaseInstance: SupabaseClient | null = null;
let currentConfig = { url: '', key: '' };

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
 * Test connectivity with Supabase project
 */
export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient(url, key);
  if (!client) {
    return { success: false, message: 'URL atau Anon Key Supabase tidak valid.' };
  }

  try {
    // Try pinging or querying any table (e.g. produk or auth)
    const { error } = await client.from('produk').select('id').limit(1);

    if (error) {
      // If table doesn't exist yet, it still proves credentials and network connection to Supabase are valid!
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Berhasil terhubung ke Supabase! (Catatan: Tabel produk belum dibuat, silakan jalankan SQL Schema).',
        };
      }
      return { success: false, message: `Koneksi Supabase gagal: ${error.message}` };
    }

    return { success: true, message: 'Koneksi ke database Supabase berhasil & tabel terdeteksi!' };
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
    payload.products = resProduk.data.map((row: any) => ({
      id: row.id,
      barcode: row.barcode,
      nama: row.nama,
      kategori: row.kategori,
      satuan: row.satuan,
      hargaBeli: Number(row.harga_beli ?? row.hargaBeli ?? 0),
      hargaJual: Number(row.harga_jual ?? row.hargaJual ?? 0),
      stok: Number(row.stok ?? 0),
      minStok: Number(row.min_stok ?? row.minStok ?? 5),
      supplier: row.supplier || '',
      status: row.status || 'Aktif',
      foto: row.foto || undefined,
    }));
  }

  if (resPenjualan.data) {
    payload.sales = resPenjualan.data.map((row: any) => ({
      id: row.id,
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
      metodePembayaran: row.metode_pembayaran || row.metodePembayaran || 'Tunai',
    }));
  }

  if (resPembelian.data) {
    payload.purchases = resPembelian.data.map((row: any) => ({
      id: row.id,
      tanggal: row.tanggal,
      supplier: row.supplier,
      barcode: row.barcode,
      namaProduk: row.nama_produk || row.namaProduk,
      qty: Number(row.qty ?? 0),
      hargaBeli: Number(row.harga_beli ?? row.hargaBeli ?? 0),
      total: Number(row.total ?? 0),
      catatan: row.catatan || '',
    }));
  }

  if (resSupplier.data) {
    payload.suppliers = resSupplier.data.map((row: any) => ({
      id: row.id,
      nama: row.nama,
      alamat: row.alamat || '',
      telepon: row.telepon || '',
      email: row.email || '',
    }));
  }

  if (resPelanggan.data) {
    payload.customers = resPelanggan.data.map((row: any) => ({
      id: row.id,
      nama: row.nama,
      telepon: row.telepon || '',
      alamat: row.alamat || '',
      poin: Number(row.poin || 0),
    }));
  }

  if (resPengguna.data) {
    payload.users = resPengguna.data.map((row: any) => ({
      username: row.username,
      nama: row.nama,
      password: row.password || '',
      role: row.role || 'Kasir',
    }));
  }

  return payload;
}

/**
 * Push all local data into Supabase tables (Upsert)
 */
export async function pushToSupabase(url: string, key: string, data: SyncPayload): Promise<{ success: boolean; message: string }> {
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

  // Upsert concurrently
  const results = await Promise.allSettled([
    produkRows.length > 0 ? client.from('produk').upsert(produkRows, { onConflict: 'id' }) : Promise.resolve(),
    penjualanRows.length > 0 ? client.from('penjualan').upsert(penjualanRows, { onConflict: 'id' }) : Promise.resolve(),
    pembelianRows.length > 0 ? client.from('pembelian').upsert(pembelianRows, { onConflict: 'id' }) : Promise.resolve(),
    supplierRows.length > 0 ? client.from('supplier').upsert(supplierRows, { onConflict: 'id' }) : Promise.resolve(),
    pelangganRows.length > 0 ? client.from('pelanggan').upsert(pelangganRows, { onConflict: 'id' }) : Promise.resolve(),
    penggunaRows.length > 0 ? client.from('pengguna').upsert(penggunaRows, { onConflict: 'username' }) : Promise.resolve(),
  ]);

  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map((r) => r.reason?.message || 'Error');

  if (errors.length > 0) {
    throw new Error(`Sebagian data gagal disimpan ke Supabase: ${errors.join(', ')}`);
  }

  return { success: true, message: 'Seluruh data berhasil disinkronkan ke Supabase!' };
}

/**
 * Generate 1-click SQL Schema for Supabase SQL Editor
 */
export function generateSupabaseSqlSchema(): string {
  return `-- ====================================================================
-- SKRIP SQL DATABASE SUPABASE UNTUK APLIKASI TOKOAPPS
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

-- Izinkan Akses Publik / Anon Key (Disable RLS untuk kemudahan akses POS)
ALTER TABLE produk DISABLE ROW LEVEL SECURITY;
ALTER TABLE penjualan DISABLE ROW LEVEL SECURITY;
ALTER TABLE pembelian DISABLE ROW LEVEL SECURITY;
ALTER TABLE supplier DISABLE ROW LEVEL SECURITY;
ALTER TABLE pelanggan DISABLE ROW LEVEL SECURITY;
ALTER TABLE pengguna DISABLE ROW LEVEL SECURITY;
`;
}
