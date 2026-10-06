export interface Produk {
  id: string; // ID Produk e.g. PRD-001
  barcode: string;
  nama: string;
  kategori: string;
  satuan: string; // Pcs, Pack, Dus, Kg, Botol, dll
  hargaBeli: number;
  hargaJual: number;
  stok: number;
  minStok: number;
  supplier: string;
  status: 'Aktif' | 'Nonaktif';
  foto?: string;
}

export interface PenjualanItem {
  barcode: string;
  nama: string;
  qty: number;
  harga: number;
  diskon: number; // Diskon nominal per item
  subtotal: number;
  hargaBeli: number; // Untuk kalkulasi laba kotor
}

export interface Penjualan {
  id: string; // No Transaksi e.g. TRX-20261005-001
  tanggal: string; // YYYY-MM-DD HH:mm:ss
  items: PenjualanItem[];
  totalQty: number;
  subtotal: number;
  diskonTotal: number;
  pajak: number; // PPN
  totalBayar: number;
  jumlahUang: number;
  kembalian: number;
  kasir: string;
  pelanggan?: string;
  metodePembayaran: 'Tunai' | 'QRIS' | 'Transfer';
  catatan?: string;
}

export interface Pembelian {
  id: string; // No Pembelian e.g. PB-20261005-001
  tanggal: string;
  supplier: string;
  barcode: string;
  namaProduk: string;
  qty: number;
  hargaBeli: number;
  total: number;
  catatan?: string;
}

export interface Supplier {
  id: string; // SUP-001
  nama: string;
  alamat: string;
  telepon: string;
  email: string;
}

export interface Pelanggan {
  id: string; // CUST-001
  nama: string;
  telepon: string;
  alamat: string;
  poin?: number;
}

export interface Pengguna {
  username: string;
  password?: string;
  nama: string;
  role: 'Admin' | 'Kasir';
}

export interface DatabaseConfig {
  activeProvider: 'local' | 'spreadsheet' | 'supabase' | 'dual';
  spreadsheetUrl: string;
  spreadsheetId: string;
  gasWebAppUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  autoSync: boolean;
  syncIntervalSec: number;
  lastSyncTime: string | null;
  lastSyncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncErrorMessage?: string;
}

export const defaultDatabaseConfig: DatabaseConfig = {
  activeProvider: 'local',
  spreadsheetUrl: '',
  spreadsheetId: '',
  gasWebAppUrl: '',
  supabaseUrl: '',
  supabaseAnonKey: '',
  autoSync: true,
  syncIntervalSec: 30,
  lastSyncTime: null,
  lastSyncStatus: 'idle',
};

export interface StoreSettings {
  namaToko: string;
  slogan: string;
  alamat: string;
  telepon: string;
  logoUrl: string;
  pajakPersen: number; // e.g. 11% PPN
  pajakAktif: boolean;
  mataUang: string; // Rp
  pesanStruk: string;
  gasWebAppUrl?: string;
  spreadsheetUrl?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}
