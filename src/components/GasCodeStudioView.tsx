import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  FileCode,
  FileText,
  FileSpreadsheet,
  Download,
  BookOpen,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  PlayCircle,
  HelpCircle,
} from 'lucide-react';
import { GAS_FILES, GasFile } from '../gas/codeTemplates';

export const GasCodeStudioView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<GasFile>(GAS_FILES[0]);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'files' | 'setup' | 'guide'>('files');

  const copyToClipboard = (text: string, fileName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(fileName);
    setTimeout(() => setCopiedFile(null), 2500);
  };

  const downloadFile = (file: GasFile) => {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 p-6 rounded-3xl border border-amber-500/30 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950">
              KODE RESMI GAS
            </span>
            <span className="text-xs text-amber-300 font-medium">100% Siap Ditempel ke Google Apps Script</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            Pusat Kode Google Apps Script & Setup Spreadsheet
          </h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Semua file backend (.gs) dan frontend HTML Service (.html) dipisah secara modular dan siap digunakan langsung di editor Google Apps Script tanpa database eksternal.
          </p>

          <div className="flex flex-wrap gap-2.5 mt-4">
            <button
              onClick={() => setActiveSubTab('files')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                activeSubTab === 'files'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Jelajahi File Kode ({GAS_FILES.length} File)</span>
            </button>

            <button
              onClick={() => setActiveSubTab('setup')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                activeSubTab === 'setup'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <PlayCircle className="w-4 h-4 text-emerald-400" />
              <span>1-Klik Setup 6 Sheet Otomatis</span>
            </button>

            <button
              onClick={() => setActiveSubTab('guide')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                activeSubTab === 'guide'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Panduan Instalasi & Deploy</span>
            </button>
          </div>
        </div>
      </div>

      {/* SubTab 1: File Explorer & Code Viewer */}
      {activeSubTab === 'files' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* File List (Left) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Daftar File Project Apps Script
              </span>
            </div>

            <div className="p-2 space-y-1 max-h-[640px] overflow-y-auto">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Backend Apps Script (.gs)
              </div>
              {GAS_FILES.filter((f) => f.type === 'gs').map((f) => {
                const isSelected = selectedFile.name === f.name;
                return (
                  <button
                    key={f.name}
                    onClick={() => setSelectedFile(f)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                      <span className="font-mono">{f.name}</span>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      GS
                    </span>
                  </button>
                );
              })}

              <div className="px-2 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Frontend HTML Service (.html)
              </div>
              {GAS_FILES.filter((f) => f.type === 'html').map((f) => {
                const isSelected = selectedFile.name === f.name;
                return (
                  <button
                    key={f.name}
                    onClick={() => setSelectedFile(f)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                      isSelected
                        ? 'bg-orange-600 text-white shadow-xs font-bold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-orange-600'}`} />
                      <span className="font-mono">{f.name}</span>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      HTML
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Code Viewer Panel (Right) */}
          <div className="lg:col-span-8 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
            {/* Toolbar */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-amber-400">
                    {selectedFile.name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {selectedFile.type === 'gs' ? 'Google Apps Script' : 'HTML Service Template'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{selectedFile.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadFile(selectedFile)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                <button
                  onClick={() => copyToClipboard(selectedFile.content, selectedFile.name)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm ${
                    copiedFile === selectedFile.name
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  }`}
                >
                  {copiedFile === selectedFile.name ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Berhasil Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Seluruh Kode</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Code Body */}
            <div className="p-4 overflow-x-auto max-h-[580px] bg-slate-900/90 font-mono text-xs text-slate-200 leading-relaxed">
              <pre>{selectedFile.content}</pre>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 2: Auto Spreadsheet Setup Code */}
      {activeSubTab === 'setup' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm">
          <div className="max-w-3xl">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
              <span>Otomatisasi Struktur Database Google Spreadsheet</span>
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Fungsi <code className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">setupSpreadsheet()</code> berikut akan membuat 6 sheet secara instan beserta header kolom warna biru gelap dan baris data awal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span> 1. Sheet Produk
              </div>
              <p className="text-xs text-slate-500">
                <strong>Kolom:</strong> ID Produk, Barcode, Nama Produk, Kategori, Satuan, Harga Beli, Harga Jual, Stok, Minimum Stok, Supplier, Status
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span> 2. Sheet Penjualan
              </div>
              <p className="text-xs text-slate-500">
                <strong>Kolom:</strong> No Transaksi, Tanggal, Barcode, Nama Produk, Qty, Harga, Diskon, Subtotal, Kasir, Metode Pembayaran
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span> 3. Sheet Pembelian
              </div>
              <p className="text-xs text-slate-500">
                <strong>Kolom:</strong> No Pembelian, Tanggal, Supplier, Barcode, Nama Produk, Qty, Harga Beli, Total
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-600"></span> 4. Sheet Supplier
              </div>
              <p className="text-xs text-slate-500">
                <strong>Kolom:</strong> ID Supplier, Nama, Alamat, Telepon, Email
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-600"></span> 5. Sheet Pelanggan
              </div>
              <p className="text-xs text-slate-500">
                <strong>Kolom:</strong> ID Pelanggan, Nama, Telepon, Alamat
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span> 6. Sheet Pengguna
              </div>
              <p className="text-xs text-slate-500">
                <strong>Kolom:</strong> Username, Password, Nama, Role (Admin/Kasir)
              </p>
            </div>
          </div>

          {/* Code block for setup */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-slate-200 font-mono text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-amber-400 font-bold">Fungsi setupSpreadsheet() (Di dalam Code.gs)</span>
              <button
                onClick={() =>
                  copyToClipboard(
                    `function setupSpreadsheet() {\n  var ss = SpreadsheetApp.getActiveSpreadsheet();\n  // ... (lihat file Code.gs)\n}`,
                    'setup'
                  )
                }
                className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded text-white"
              >
                Salin Potongan Kode
              </button>
            </div>
            <pre className="text-slate-300">
              {`// CARA MENJALANKAN DI APPS SCRIPT:
// 1. Tempel isi Code.gs ke Apps Script Editor
// 2. Pada dropdown fungsi di toolbar atas editor, pilih "setupSpreadsheet"
// 3. Klik tombol "Jalankan" (Run)
// 4. Berikan izin akses (Review Permissions -> Allow)
// 5. Buka spreadsheet Anda: Seluruh 6 Sheet & Kolom langsung tercipta otomatis!`}
            </pre>
          </div>
        </div>
      )}

      {/* SubTab 3: Installation & Deployment Guide */}
      {activeSubTab === 'guide' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <span>Panduan Lengkap Instalasi & Deployment Google Apps Script</span>
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Ikuti 6 langkah mudah berikut untuk menjalankan aplikasi toko ini 100% gratis di Google Cloud Google Workspace Anda.
            </p>
          </div>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                1
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">Buat Google Spreadsheet Baru</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Buka browser Anda dan akses <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">sheets.new</a>. Beri nama spreadsheet misalnya: <span className="font-semibold text-slate-800">"Database Toko Berkah Mandiri"</span>.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                2
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">Buka Editor Apps Script</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Di menu atas Spreadsheet, klik menu <strong>Ekstensi (Extensions)</strong> &rarr; pilih <strong>Apps Script</strong>. Tab baru editor skrip akan terbuka.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                3
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">Buat File Skrip (.gs) dan File HTML (.html)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Klik tanda <strong>(+)</strong> di samping Files pada editor Apps Script:
                </p>
                <ul className="text-xs text-slate-600 list-disc list-inside space-y-0.5 pt-1">
                  <li>Buat file Script: <code>Code.gs</code>, <code>Auth.gs</code>, <code>Product.gs</code>, <code>Sales.gs</code>, <code>Purchase.gs</code>, <code>Report.gs</code>, <code>Utils.gs</code>.</li>
                  <li>Buat file HTML: <code>Index.html</code>, <code>Dashboard.html</code>, <code>Produk.html</code>, <code>Penjualan.html</code>, <code>Pembelian.html</code>, <code>Supplier.html</code>, <code>Pelanggan.html</code>, <code>Laporan.html</code>, <code>Login.html</code>, <code>Style.html</code>, <code>Script.html</code>.</li>
                  <li>Salin seluruh isi kode dari tab <em>"Jelajahi File Kode"</em> di atas dan tempelkan ke masing-masing file yang bersangkutan.</li>
                </ul>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                4
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">Jalankan Inisialisasi Database Otomatis</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Di toolbar atas editor skrip, pada pilihan fungsi, pilih <code>setupSpreadsheet</code> lalu klik tombol <strong>Jalankan (Run)</strong>. Berikan izin saat dialog otorisasi Google muncul. Seluruh 6 Sheet akan otomatis dibuat rapi dalam hitungan detik!
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                5
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">Terapkan Sebagai Aplikasi Web (Deploy as Web App)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Klik tombol biru <strong>Terapkan (Deploy)</strong> di pojok kanan atas &rarr; pilih <strong>Penerapan baru (New deployment)</strong> &rarr; pilih jenis roda gigi: <strong>Aplikasi Web (Web App)</strong>.
                </p>
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs font-mono space-y-1 mt-2 text-slate-800">
                  <div><strong>Jalankan sebagai (Execute as):</strong> Saya (email Anda)</div>
                  <div><strong>Yang memiliki akses (Who has access):</strong> Siapa saja (Anyone)</div>
                </div>
              </div>
            </div>

            {/* Step 6 */}
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                6
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-emerald-900 text-sm">Selesai! Aplikasi Siap Digunakan</h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Salin tautan Web App URL yang diberikan Google (berakhiran <code>/exec</code>). Buka di browser laptop atau HP kasir Anda. Masuk menggunakan akun admin: <code>admin</code> / <code>admin123</code> atau kasir: <code>kasir</code> / <code>kasir123</code>!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
