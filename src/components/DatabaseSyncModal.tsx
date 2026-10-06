import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Database,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  Layers,
  Sparkles,
  Server,
  CloudCheck,
  Zap,
  Globe,
  HardDrive,
  Info,
  X,
  Play,
  ArrowDownCircle,
  ArrowUpCircle,
  ShieldCheck,
} from 'lucide-react';
import { DatabaseConfig, StoreSettings, Produk, Penjualan, Pembelian, Supplier, Pelanggan, Pengguna } from '../types';
import {
  extractSpreadsheetId,
  getSpreadsheetOpenUrl,
  testGasConnection,
  testSpreadsheetGvizConnection,
} from '../utils/spreadsheetSync';
import {
  testSupabaseConnection,
  generateSupabaseSqlSchema,
} from '../utils/supabaseSync';
import {
  generateMultiDeviceShareUrl,
  pullCloudData,
  pushCloudData,
  syncDirectlyToSupabaseRealtime,
} from '../utils/cloudSyncEngine';

interface DatabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DatabaseConfig;
  onSaveConfig: (newConfig: DatabaseConfig) => void;
  // Local current state for push / update
  localData: {
    products: Produk[];
    sales: Penjualan[];
    purchases: Pembelian[];
    suppliers: Supplier[];
    customers: Pelanggan[];
    users: Pengguna[];
    settings?: StoreSettings;
  };
  onApplyPulledData: (data: any) => void;
  onNotify: (msg: string) => void;
}

export const DatabaseSyncModal: React.FC<DatabaseSyncModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  localData,
  onApplyPulledData,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'spreadsheet' | 'supabase' | 'sync' | 'share'>('spreadsheet');

  // Form states
  const [form, setForm] = useState<DatabaseConfig>({ ...config });
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: '',
  });

  // Action states
  const [isPulling, setIsPulling] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [copiedShareUrl, setCopiedShareUrl] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    setForm({ ...config });
  }, [config, isOpen]);

  if (!isOpen) return null;

  // Auto-extract Spreadsheet ID when URL changes
  const handleSpreadsheetUrlChange = (val: string) => {
    const id = extractSpreadsheetId(val);
    setForm((prev) => ({
      ...prev,
      spreadsheetUrl: val,
      spreadsheetId: id,
    }));
  };

  // Test Spreadsheet Connection
  const handleTestSpreadsheet = async () => {
    setTestResult({ status: 'testing', message: 'Menguji koneksi ke Google Spreadsheet...' });

    // 1. If GAS Web App URL provided, test it
    if (form.gasWebAppUrl && form.gasWebAppUrl.trim()) {
      const gasRes = await testGasConnection(form.gasWebAppUrl);
      if (gasRes.success) {
        setTestResult({
          status: 'success',
          message: `Koneksi Berhasil! Google Apps Script Web App aktif & siap sinkronisasi 2 arah.`,
        });
        return;
      }
    }

    // 2. Fallback to direct Spreadsheet GViz test
    if (form.spreadsheetId || form.spreadsheetUrl) {
      const gvizRes = await testSpreadsheetGvizConnection(form.spreadsheetId || form.spreadsheetUrl);
      if (gvizRes.success) {
        setTestResult({
          status: 'success',
          message: `${gvizRes.message} (Untuk mode simpan/write, tambahkan juga URL Web App Apps Script).`,
        });
        return;
      } else {
        setTestResult({
          status: 'error',
          message: gvizRes.message,
        });
        return;
      }
    }

    setTestResult({
      status: 'error',
      message: 'Masukkan Link Google Spreadsheet atau URL Web App Apps Script terlebih dahulu.',
    });
  };

  // Test Supabase Connection
  const handleTestSupabase = async () => {
    if (!form.supabaseUrl || !form.supabaseAnonKey) {
      setTestResult({
        status: 'error',
        message: 'Harap isi URL Project Supabase dan Anon Key publik.',
      });
      return;
    }

    setTestResult({ status: 'testing', message: 'Menghubungi database Supabase...' });
    const res = await testSupabaseConnection(form.supabaseUrl, form.supabaseAnonKey);
    setTestResult({
      status: res.success ? 'success' : 'error',
      message: res.message,
    });
  };

  // Sync entire application data to Supabase Realtime
  const handleSyncAllToSupabaseRealtime = async () => {
    if (!form.supabaseUrl || !form.supabaseAnonKey) {
      setTestResult({
        status: 'error',
        message: 'Masukkan URL Project Supabase dan Anon Key publik terlebih dahulu.',
      });
      return;
    }

    setIsSyncingSupabase(true);
    setTestResult({
      status: 'testing',
      message: 'Mengirim dan menyinkronkan seluruh data aplikasi ke Supabase Realtime...',
    });

    try {
      const res = await syncDirectlyToSupabaseRealtime(
        form.supabaseUrl,
        form.supabaseAnonKey,
        localData
      );

      if (res.success) {
        const updatedConfig: DatabaseConfig = {
          ...form,
          activeProvider: form.activeProvider === 'local' ? 'supabase' : form.activeProvider,
          supabaseRealtimeEnabled: true,
          realtimeStatus: 'connected',
          lastSyncTime: res.timestamp,
          lastSyncStatus: 'success',
        };
        setForm(updatedConfig);
        onSaveConfig(updatedConfig);
        setTestResult({
          status: 'success',
          message: `⚡ ${res.message}`,
        });
        onNotify(`⚡ Seluruh data berhasil disinkronkan ke Supabase Realtime!`);
      } else {
        setTestResult({
          status: 'error',
          message: res.message,
        });
        onNotify(res.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestResult({
        status: 'error',
        message: `Gagal: ${msg}`,
      });
      onNotify(`Gagal: ${msg}`);
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  // Pull latest data
  const handlePullData = async () => {
    setIsPulling(true);
    try {
      const res = await pullCloudData(form);
      if (res.success && res.pulledData) {
        onApplyPulledData(res.pulledData);
        const updatedConfig = {
          ...form,
          lastSyncTime: res.timestamp,
          lastSyncStatus: 'success' as const,
        };
        setForm(updatedConfig);
        onSaveConfig(updatedConfig);
        onNotify(res.message);
      } else {
        onNotify(`Gagal: ${res.message}`);
      }
    } catch (e: any) {
      onNotify(`Gagal menarik data: ${e.message}`);
    } finally {
      setIsPulling(false);
    }
  };

  // Push local data
  const handlePushData = async () => {
    setIsPushing(true);
    try {
      const res = await pushCloudData(form, localData);
      if (res.success) {
        const updatedConfig = {
          ...form,
          lastSyncTime: res.timestamp,
          lastSyncStatus: 'success' as const,
        };
        setForm(updatedConfig);
        onSaveConfig(updatedConfig);
        onNotify(res.message);
      } else {
        onNotify(`Gagal: ${res.message}`);
      }
    } catch (e: any) {
      onNotify(`Gagal mengirim data: ${e.message}`);
    } finally {
      setIsPushing(false);
    }
  };

  // Save Settings
  const handleSaveAndConnect = () => {
    onSaveConfig(form);
    onNotify('Konfigurasi database cloud berhasil disimpan!');
    onClose();
  };

  // Multi device share link & QR
  const shareUrl = generateMultiDeviceShareUrl(form);
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(
    shareUrl
  )}`;

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedShareUrl(true);
    setTimeout(() => setCopiedShareUrl(false), 2500);
  };

  const handleCopySqlSchema = () => {
    const sql = generateSupabaseSqlSchema();
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-inner">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg tracking-tight">Koneksi Database Cloud & Multi-Device</h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Realtime
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Hubungkan Google Spreadsheet & Supabase agar data toko tetap sama di seluruh perangkat (HP, Tablet, PC).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-4 sm:px-6 pt-3 gap-1 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('spreadsheet');
              setTestResult({ status: 'idle', message: '' });
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 whitespace-nowrap ${
              activeTab === 'spreadsheet'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Google Spreadsheet</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('supabase');
              setTestResult({ status: 'idle', message: '' });
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 whitespace-nowrap ${
              activeTab === 'supabase'
                ? 'bg-white text-blue-700 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Zap className="w-4 h-4 text-blue-600" />
            <span>Supabase Database</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('sync');
              setTestResult({ status: 'idle', message: '' });
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 whitespace-nowrap ${
              activeTab === 'sync'
                ? 'bg-white text-indigo-700 border-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <RefreshCw className="w-4 h-4 text-indigo-600" />
            <span>Sinkronisasi & Mode</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('share');
              setTestResult({ status: 'idle', message: '' });
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 whitespace-nowrap ${
              activeTab === 'share'
                ? 'bg-white text-purple-700 border-purple-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Smartphone className="w-4 h-4 text-purple-600" />
            <span>Hubungkan HP (QR Code)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Test Status Callout */}
          {testResult.status !== 'idle' && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 ${
                testResult.status === 'testing'
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : testResult.status === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {testResult.status === 'testing' && <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0 mt-0.5" />}
              {testResult.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {testResult.status === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
              <span className="leading-relaxed font-medium">{testResult.message}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: GOOGLE SPREADSHEET */}
          {/* ========================================================================= */}
          {activeTab === 'spreadsheet' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950 flex items-start gap-3">
                <FileSpreadsheet className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold">Hubungkan Spreadsheet Anda:</span>
                  <p className="text-emerald-900 leading-relaxed">
                    Tempelkan link Google Spreadsheet yang Anda buat. Aplikasi akan otomatis mendeteksi ID Spreadsheet
                    dan menyinkronkan 6 sheet: <strong>Produk, Penjualan, Pembelian, Supplier, Pelanggan, Pengguna</strong>.
                  </p>
                </div>
              </div>

              {/* Input Link Spreadsheet */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Link Google Spreadsheet (Google Sheets URL)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={form.spreadsheetUrl}
                    onChange={(e) => handleSpreadsheetUrlChange(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                    className="w-full pl-3 pr-24 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {form.spreadsheetId && (
                    <a
                      href={getSpreadsheetOpenUrl(form.spreadsheetId)}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute right-2 top-2 px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1 transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Buka Sheet</span>
                    </a>
                  )}
                </div>
                {form.spreadsheetId ? (
                  <p className="text-[11px] text-emerald-700 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ID Spreadsheet terdeteksi: <strong>{form.spreadsheetId}</strong></span>
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Contoh: Buka spreadsheet di browser lalu salin seluruh link URL dari address bar.
                  </p>
                )}
              </div>

              {/* Input Google Apps Script Web App URL */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>URL Web App Google Apps Script (Untuk Akses Simpan/Tulis Otomatis)</span>
                  <span className="text-[10px] text-blue-600 font-normal">Disarankan untuk 2-Way Sync</span>
                </label>
                <input
                  type="url"
                  value={form.gasWebAppUrl}
                  onChange={(e) => setForm({ ...form, gasWebAppUrl: e.target.value })}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-500">
                  Dapatkan URL ini setelah menerapkan (Deploy) skrip di Google Apps Script editor sebagai Web App (Akses: Anyone).
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleTestSpreadsheet}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tes Koneksi Spreadsheet</span>
                </button>

                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, activeProvider: 'spreadsheet' }))}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                    form.activeProvider === 'spreadsheet'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  {form.activeProvider === 'spreadsheet' ? '✓ Provider Aktif: Spreadsheet' : 'Jadikan Database Utama'}
                </button>
              </div>

              {/* 3 Step Guide */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-emerald-600" />
                  <span>Panduan 3 Langkah Menghubungkan Google Spreadsheet:</span>
                </span>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
                  <li>
                    Pastikan spreadsheet Anda diatur berbagi: <strong>"Siapa saja yang memiliki link dapat melihat"</strong>.
                  </li>
                  <li>
                    Buka menu <strong>"Kode Apps Script"</strong> di aplikasi ini, salin kode ke <em>script.google.com</em>, lalu jalankan fungsi <code>setupSpreadsheet()</code>.
                  </li>
                  <li>
                    Klik <strong>Deploy &gt; New Deployment &gt; Web App</strong> (Execute as: Me, Who has access: Anyone), lalu salin link URL-nya ke kolom di atas.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: SUPABASE DATABASE */}
          {/* ========================================================================= */}
          {activeTab === 'supabase' && (
            <div className="space-y-4">
              {/* Hero: Sync all data to Supabase Realtime */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md space-y-3 border border-blue-500/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <h4 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Sinkronkan Seluruh Data ke Supabase Realtime</span>
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 self-start sm:self-auto flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Live WebSocket Realtime</span>
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Unggah seluruh isi data lokal toko ({localData.products.length} produk, {localData.sales.length} penjualan, {localData.purchases.length} pembelian, {localData.suppliers.length} supplier, {localData.customers.length} pelanggan) ke database Supabase agar langsung tersinkronisasi realtime multi-perangkat.
                </p>

                {/* Counts Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center text-[10px] font-mono">
                  <div className="bg-white/10 rounded-lg p-1.5 border border-white/5">
                    <span className="block font-bold text-emerald-300 text-xs">{localData.products.length}</span>
                    <span className="text-slate-400">Produk</span>
                  </div>
                  <div className="bg-white/10 rounded-lg p-1.5 border border-white/5">
                    <span className="block font-bold text-blue-300 text-xs">{localData.sales.length}</span>
                    <span className="text-slate-400">Penjualan</span>
                  </div>
                  <div className="bg-white/10 rounded-lg p-1.5 border border-white/5">
                    <span className="block font-bold text-indigo-300 text-xs">{localData.purchases.length}</span>
                    <span className="text-slate-400">Pembelian</span>
                  </div>
                  <div className="bg-white/10 rounded-lg p-1.5 border border-white/5">
                    <span className="block font-bold text-amber-300 text-xs">{localData.suppliers.length}</span>
                    <span className="text-slate-400">Supplier</span>
                  </div>
                  <div className="bg-white/10 rounded-lg p-1.5 border border-white/5">
                    <span className="block font-bold text-purple-300 text-xs">{localData.customers.length}</span>
                    <span className="text-slate-400">Pelanggan</span>
                  </div>
                  <div className="bg-white/10 rounded-lg p-1.5 border border-white/5">
                    <span className="block font-bold text-pink-300 text-xs">{localData.users.length}</span>
                    <span className="text-slate-400">User</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isSyncingSupabase}
                  onClick={handleSyncAllToSupabaseRealtime}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                >
                  <Zap className={`w-4 h-4 ${isSyncingSupabase ? 'animate-spin' : ''}`} />
                  <span>
                    {isSyncingSupabase
                      ? 'Sedang Mengunggah & Menyinkronkan ke Supabase Realtime...'
                      : '⚡ SINKRONKAN SELURUH DATA KE SUPABASE REALTIME SEKARANG'}
                  </span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-950 flex items-start gap-3">
                <Zap className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold">Konfigurasi Database Online Supabase:</span>
                  <p className="text-blue-900 leading-relaxed">
                    Setelah mengisi URL dan Anon Key, klik tombol di atas untuk menyinkronkan seluruh data. Perubahan di satu HP/perangkat akan otomatis langsung ter-update di perangkat lain secara instan (*Live Realtime*).
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  value={form.supabaseUrl}
                  onChange={(e) => setForm({ ...form, supabaseUrl: e.target.value })}
                  placeholder="https://abcdefghijklmno.supabase.co"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Supabase Anon Public API Key
                </label>
                <input
                  type="password"
                  value={form.supabaseAnonKey}
                  onChange={(e) => setForm({ ...form, supabaseAnonKey: e.target.value })}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleTestSupabase}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                >
                  <Zap className="w-4 h-4" />
                  <span>Tes Koneksi Supabase</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySqlSchema}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                >
                  {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSql ? 'SQL Tersalin ke Clipboard!' : 'Salin Skrip SQL Schema (6 Tabel)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, activeProvider: 'supabase' }))}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                    form.activeProvider === 'supabase'
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  {form.activeProvider === 'supabase' ? '✓ Provider Aktif: Supabase' : 'Jadikan Database Utama'}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-800">Petunjuk Pembuatan Tabel Supabase:</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  1. Masuk ke <em>supabase.com</em> &gt; Buka project Anda &gt; menu <strong>SQL Editor</strong>.<br />
                  2. Klik tombol hitam <strong>"Salin Skrip SQL Schema"</strong> di atas, lalu tempel (Paste) di SQL Editor.<br />
                  3. Klik tombol <strong>Run</strong>. Keenam tabel (produk, penjualan, pembelian, supplier, pelanggan, pengguna) akan langsung dibuat!
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: MODE SINKRONISASI & AUTO-SYNC */}
          {/* ========================================================================= */}
          {activeTab === 'sync' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Pilih Database Aktif Utama:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option 1: Dual */}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, activeProvider: 'dual' })}
                    className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition ${
                      form.activeProvider === 'dual'
                        ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Globe className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs text-indigo-900 flex items-center gap-1.5">
                        <span>Dual Cloud (Spreadsheet + Supabase)</span>
                        <span className="text-[9px] bg-indigo-200/80 text-indigo-800 px-1.5 py-0.2 rounded font-bold">Rekomendasi</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Data tersimpan di Google Spreadsheet DAN database Supabase secara bersamaan.
                      </p>
                    </div>
                  </button>

                  {/* Option 2: Spreadsheet */}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, activeProvider: 'spreadsheet' })}
                    className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition ${
                      form.activeProvider === 'spreadsheet'
                        ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs text-emerald-900">Google Spreadsheet Only</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Seluruh data dibaca & ditulis langsung ke Google Spreadsheet Anda.
                      </p>
                    </div>
                  </button>

                  {/* Option 3: Supabase */}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, activeProvider: 'supabase' })}
                    className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition ${
                      form.activeProvider === 'supabase'
                        ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Zap className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs text-blue-900">Supabase Online Database</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Penyimpanan cloud PostgreSQL Supabase dengan performa cepat.
                      </p>
                    </div>
                  </button>

                  {/* Option 4: Local */}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, activeProvider: 'local' })}
                    className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition ${
                      form.activeProvider === 'local'
                        ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400/20'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <HardDrive className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs text-slate-800">Penyimpanan Lokal (Offline)</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Hanya disimpan di browser/aplikasi perangkat ini tanpa sinkronisasi internet.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Auto Sync Toggle */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 block">
                    Sinkronisasi Otomatis Setiap Transaksi (Auto-Sync)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Otomatis mengirim data penjualan POS, stok, dan produk baru ke cloud setiap kali ada perubahan.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    type="checkbox"
                    checked={form.autoSync}
                    onChange={(e) => setForm({ ...form, autoSync: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Manual Sync Trigger Buttons */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Aksi Sinkronisasi Manual Antar Perangkat:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isPulling}
                    onClick={handlePullData}
                    className="p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    <ArrowDownCircle className={`w-4 h-4 text-blue-600 ${isPulling ? 'animate-spin' : ''}`} />
                    <span>{isPulling ? 'Menarik Data...' : 'Tarik Data Terbaru dari Cloud (Pull)'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isPushing}
                    onClick={handlePushData}
                    className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    <ArrowUpCircle className={`w-4 h-4 text-emerald-600 ${isPushing ? 'animate-spin' : ''}`} />
                    <span>{isPushing ? 'Mengunggah Data...' : 'Unggah Data Saat Ini ke Cloud (Push)'}</span>
                  </button>
                </div>

                {/* Direct Supabase Realtime Sync Button */}
                <button
                  type="button"
                  disabled={isSyncingSupabase}
                  onClick={handleSyncAllToSupabaseRealtime}
                  className="w-full p-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-md shadow-blue-600/20 disabled:opacity-50 mt-2"
                >
                  <Zap className={`w-4 h-4 text-amber-300 ${isSyncingSupabase ? 'animate-spin' : ''}`} />
                  <span>
                    {isSyncingSupabase
                      ? 'Menyinkronkan ke Supabase Realtime...'
                      : '⚡ Sinkronkan Seluruh Data ke Database Supabase Realtime'}
                  </span>
                </button>
              </div>

              {/* Status info */}
              <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-3">
                <span>Waktu Sinkronisasi Terakhir:</span>
                <span className="font-mono font-semibold text-slate-700">
                  {form.lastSyncTime ? `${form.lastSyncTime} WIB` : 'Belum pernah sinkron'}
                </span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: HUBUNGKAN PERANGKAT LAIN (MULTI-DEVICE SHARE) */}
          {/* ========================================================================= */}
          {activeTab === 'share' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 text-xs text-purple-950 flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold">Akses Toko di HP, Tablet, & Komputer Lain:</span>
                  <p className="text-purple-900 leading-relaxed">
                    Scan QR Code atau salin tautan berikut untuk membuka toko di perangkat kasir lain.
                    Konfigurasi database akan otomatis terpasang dan data yang terbuka dijamin sama persis!
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                {/* QR Code */}
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 shrink-0 flex flex-col items-center">
                  <img
                    src={qrCodeImageUrl}
                    alt="Scan QR Multi Device"
                    className="w-44 h-44 object-contain rounded-xl"
                  />
                  <span className="text-[10px] text-slate-500 font-semibold mt-2 flex items-center gap-1">
                    <QrCode className="w-3 h-3 text-purple-600" />
                    <span>Scan dengan Kamera HP</span>
                  </span>
                </div>

                {/* Instructions & Share link */}
                <div className="space-y-3 flex-1 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900">Cara Penggunaan:</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                      1. Buka aplikasi kamera di HP kasir atau smartphone staf Anda.<br />
                      2. Arahkan kamera ke QR Code di samping.<br />
                      3. Tekan tautan yang muncul. Aplikasi langsung terbuka dengan seluruh produk & transaksi yang sama!
                    </p>
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Tautan Sinkronisasi Multi-Device:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={shareUrl}
                        className="flex-1 p-2 bg-white border border-slate-300 rounded-xl font-mono text-[11px] text-slate-600 select-all"
                      />
                      <button
                        type="button"
                        onClick={handleCopyShareLink}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0"
                      >
                        {copiedShareUrl ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedShareUrl ? 'Tersalin!' : 'Salin Link'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              Mode Terpilih:{' '}
              <strong className="text-slate-800 uppercase font-mono">
                {form.activeProvider}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSaveAndConnect}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan & Terapkan Database</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
