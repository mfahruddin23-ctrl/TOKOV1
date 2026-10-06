import React, { useState } from 'react';
import {
  Settings,
  Store,
  Save,
  Download,
  Upload,
  RotateCcw,
  Percent,
  Receipt,
  Link,
  CheckCircle,
  Trash2,
  AlertTriangle,
  ReceiptText,
  Boxes,
  ShieldAlert,
  X,
  Globe,
  FileSpreadsheet,
  Zap,
  QrCode,
  Info,
} from 'lucide-react';
import { StoreSettings, DatabaseConfig } from '../types';

interface SettingsViewProps {
  settings: StoreSettings;
  salesCount: number;
  purchasesCount: number;
  onSaveSettings: (settings: StoreSettings) => void;
  onResetData: () => void;
  onExportAllData: () => void;
  onImportAllData: (jsonData: string) => void;
  onClearSales: () => void;
  onClearPurchases: () => void;
  onClearAllTransactions: () => void;
  dbConfig?: DatabaseConfig;
  onOpenSyncModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  salesCount,
  purchasesCount,
  onSaveSettings,
  onResetData,
  onExportAllData,
  onImportAllData,
  onClearSales,
  onClearPurchases,
  onClearAllTransactions,
  dbConfig,
  onOpenSyncModal,
}) => {
  const [form, setForm] = useState<StoreSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Clear modal confirmation state
  const [clearTarget, setClearTarget] = useState<'sales' | 'purchases' | 'all' | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportAllData(content);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteClear = () => {
    if (clearTarget === 'sales') {
      onClearSales();
    } else if (clearTarget === 'purchases') {
      onClearPurchases();
    } else if (clearTarget === 'all') {
      onClearAllTransactions();
    }
    setClearTarget(null);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          <span>Pengaturan Profil Toko & Sistem</span>
        </h2>
        <p className="text-xs text-slate-500">
          Ubah identitas toko, tarif PPN, format struk, backup data, dan manajemen pembersihan data transaksi.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-xs">
        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Pengaturan toko berhasil disimpan!</span>
          </div>
        )}

        {/* Profil Toko */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
            Identitas Toko & Informasi Kontak
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Toko</label>
              <input
                type="text"
                value={form.namaToko}
                onChange={(e) => setForm({ ...form, namaToko: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Slogan / Deskripsi Singkat</label>
              <input
                type="text"
                value={form.slogan}
                onChange={(e) => setForm({ ...form, slogan: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
              <input
                type="text"
                value={form.telepon}
                onChange={(e) => setForm({ ...form, telepon: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Logo / Banner URL</label>
              <input
                type="text"
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                placeholder="https://..."
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Alamat Lengkap Toko</label>
              <input
                type="text"
                value={form.alamat}
                onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
                required
              />
            </div>
          </div>
        </div>

        {/* Pajak & Kasir */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
            Pajak (PPN) & Konfigurasi Struk Kasir
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tarif Pajak PPN (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.pajakPersen}
                onChange={(e) => setForm({ ...form, pajakPersen: Number(e.target.value) || 0 })}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status Pajak Otomatis di POS</label>
              <div className="pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.pajakAktif}
                    onChange={(e) => setForm({ ...form, pajakAktif: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Aktifkan pemotongan PPN {form.pajakPersen}% secara default</span>
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Catatan Kaki Struk Kasir (Thermal Receipt Footer)
              </label>
              <textarea
                rows={3}
                value={form.pesanStruk}
                onChange={(e) => setForm({ ...form, pesanStruk: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Koneksi Database Cloud Multi-Device (Spreadsheet & Supabase) */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>Koneksi Database Cloud Multi-Device (Google Spreadsheet & Supabase)</span>
            </h3>
            {onOpenSyncModal && (
              <button
                type="button"
                onClick={onOpenSyncModal}
                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition self-start sm:self-auto"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Buka Hub Sinkronisasi & QR HP</span>
              </button>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Agar saat toko dibuka di perangkat lain (HP kasir, tablet, komputer lain) seluruh data yang dibuka tetap sama,
              masukkan link Google Spreadsheet atau database Supabase di bawah ini.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Link Google Spreadsheet */}
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Link Google Spreadsheet (Google Sheets Link)</span>
              </label>
              <input
                type="text"
                value={form.spreadsheetUrl || ''}
                onChange={(e) => setForm({ ...form, spreadsheetUrl: e.target.value })}
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Salin link lengkap Google Spreadsheet Anda. Pastikan sheet diatur dapat dilihat oleh siapa saja dengan link.
              </p>
            </div>

            {/* Google Apps Script Deployed Web App URL */}
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-blue-600" />
                <span>URL Web App Google Apps Script (Untuk Simpan & Update Otomatis)</span>
              </label>
              <input
                type="text"
                value={form.gasWebAppUrl || ''}
                onChange={(e) => setForm({ ...form, gasWebAppUrl: e.target.value })}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Dapatkan dari Google Apps Script &gt; Deploy &gt; Web App (Who has access: Anyone).
              </p>
            </div>

            {/* Supabase URL */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-blue-600" />
                <span>Supabase Project URL</span>
              </label>
              <input
                type="text"
                value={form.supabaseUrl || ''}
                onChange={(e) => setForm({ ...form, supabaseUrl: e.target.value })}
                placeholder="https://xyz.supabase.co"
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs"
              />
            </div>

            {/* Supabase Anon Key */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Supabase Anon Public Key</span>
              </label>
              <input
                type="password"
                value={form.supabaseAnonKey || ''}
                onChange={(e) => setForm({ ...form, supabaseAnonKey: e.target.value })}
                placeholder="eyJhbGciOi..."
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Submit Save */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan Pengaturan</span>
          </button>
        </div>
      </form>

      {/* ========================================================================= */}
      {/* MENU CLEAR DATA TRANSAKSI (PEMBERSIHAN DATA TRANSAKSI) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-rose-200 p-6 md:p-8 space-y-5 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-rose-700 font-bold text-base">
              <Trash2 className="w-5 h-5 text-rose-600" />
              <span>Menu Pembersihan Data Transaksi (Clear Data)</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Gunakan menu ini untuk mengosongkan riwayat transaksi kasir atau pembelian barang masuk.
            </p>
          </div>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
            Akses Admin
          </span>
        </div>

        {/* Information Callout */}
        <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">Keamanan Data Master Terjamin:</span>
            <p className="text-[11px] text-amber-800">
              Pembersihan data transaksi hanya akan menghapus catatan riwayat transaksi (Sheet Penjualan / Pembelian).
              <strong> Master Produk, Stok Barang, Supplier, Pelanggan, dan Akun Pengguna TIDAK AKAN TERHAPUS.</strong>
            </p>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* 1. Clear Sales */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-slate-700 mb-1">
                <span className="font-bold text-xs flex items-center gap-1.5">
                  <ReceiptText className="w-4 h-4 text-blue-600" />
                  <span>Riwayat Penjualan</span>
                </span>
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {salesCount} TRX
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Mengosongkan seluruh riwayat struk penjualan kasir di sheet Penjualan.
              </p>
            </div>

            <button
              type="button"
              disabled={salesCount === 0}
              onClick={() => setClearTarget('sales')}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                salesCount > 0
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan Penjualan</span>
            </button>
          </div>

          {/* 2. Clear Purchases */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-slate-700 mb-1">
                <span className="font-bold text-xs flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-indigo-600" />
                  <span>Riwayat Pembelian</span>
                </span>
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {purchasesCount} Nota
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Mengosongkan seluruh riwayat nota pembelian supplier di sheet Pembelian.
              </p>
            </div>

            <button
              type="button"
              disabled={purchasesCount === 0}
              onClick={() => setClearTarget('purchases')}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                purchasesCount > 0
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan Pembelian</span>
            </button>
          </div>

          {/* 3. Clear All Transactions */}
          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-rose-900 mb-1">
                <span className="font-bold text-xs flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Reset Total Transaksi</span>
                </span>
                <span className="font-mono text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                  {salesCount + purchasesCount} Total
                </span>
              </div>
              <p className="text-[11px] text-rose-800/80">
                Mengosongkan semua data transaksi penjualan & pembelian sekaligus ke nol (0).
              </p>
            </div>

            <button
              type="button"
              disabled={salesCount === 0 && purchasesCount === 0}
              onClick={() => setClearTarget('all')}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                salesCount > 0 || purchasesCount > 0
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan Semua Transaksi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Backup and Restore Cards */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-4 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900">Cadangkan & Pulihkan Data Toko</h3>
        <p className="text-xs text-slate-500">
          Ekspor semua basis data toko (produk, transaksi, pelanggan, supplier) ke file JSON atau pulihkan dari file cadangan.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={onExportAllData}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Unduh Cadangan JSON</span>
          </button>

          <label className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer">
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Pulihkan dari File JSON</span>
            <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
          </label>

          <button
            onClick={() => {
              if (confirm('Kembalikan semua data ke pengaturan awal (Reset to Default)? Data perubahan akan direset.')) {
                onResetData();
              }
            }}
            className="px-4 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2 transition ml-auto"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Reset Data Contoh Bawaan</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Clear Transaction */}
      {clearTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-rose-200 animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-rose-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-200" />
                <h3 className="font-bold text-base">Konfirmasi Pembersihan Data</h3>
              </div>
              <button onClick={() => setClearTarget(null)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-700 leading-relaxed">
                {clearTarget === 'sales' && (
                  <>
                    Anda akan menghapus <strong>seluruh {salesCount} data riwayat transaksi penjualan</strong> kasir. Total omset hari ini dan riwayat transaksi akan kembali ke <strong>Rp 0</strong>.
                  </>
                )}
                {clearTarget === 'purchases' && (
                  <>
                    Anda akan menghapus <strong>seluruh {purchasesCount} data riwayat pembelian</strong> dari supplier.
                  </>
                )}
                {clearTarget === 'all' && (
                  <>
                    Anda akan menghapus <strong>seluruh data penjualan ({salesCount} trx)</strong> dan <strong>pembelian ({purchasesCount} nota)</strong> secara permanen.
                  </>
                )}
              </p>

              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-[11px] text-rose-800">
                <strong>Catatan:</strong> Master produk, harga, dan stok barang Anda tetap aman dan tidak akan dihapus.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setClearTarget(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteClear}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20"
                >
                  Ya, Bersihkan Data Transaksi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
