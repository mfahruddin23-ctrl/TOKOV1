import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  QrCode,
  CheckCircle2,
  ExternalLink,
  Terminal,
  ShieldCheck,
  FileCode,
  Package,
  Layers,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { StoreSettings } from '../types';

interface ApkBuilderViewProps {
  settings: StoreSettings;
}

export const ApkBuilderView: React.FC<ApkBuilderViewProps> = ({ settings }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [copiedCode, setCopiedCode] = useState(false);

  // App live URL
  const currentAppUrl = typeof window !== 'undefined' ? window.location.href : 'https://tokoapp.web.app';

  const bubblewrapScript = `# 1. Instal Bubblewrap CLI (Google Trusted Web Activity Tool)
npm install -g @bubblewrap/cli

# 2. Inisialisasi Project APK Android dari Web App URL
bubblewrap init --manifest="${currentAppUrl}"

# 3. Kompilasi Menjadi File APK Android Standalone
bubblewrap build

# File APK Anda siap dipasang: ./app-release-signed.apk`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(bubblewrapScript);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Download Manifest & Android Config Bundle
  const handleDownloadApkPackage = () => {
    const manifestJson = {
      id: '/',
      name: `${settings.namaToko} - Kasir & Toko`,
      short_name: 'TokoApps',
      description: 'Aplikasi Pengelolaan Toko, Kasir POS & Inventori Google Spreadsheet.',
      theme_color: '#0f172a',
      background_color: '#0f172a',
      display: 'standalone',
      orientation: 'portrait-primary',
      start_url: '/',
      scope: '/',
      icons: [
        {
          src: '/icon.svg',
          sizes: '192x192 512x512',
          type: 'image/svg+xml',
          purpose: 'any',
        },
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
      ],
    };

    const blob = new Blob([JSON.stringify(manifestJson, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manifest-android-apk.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 p-6 md:p-8 rounded-3xl border border-emerald-500/30 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Pusat Instalasi & Generator APK Android</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Pasang Aplikasi Toko di HP Android (APK & PWA Standalone)
          </h2>
          <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
            Aplikasi ini telah mendukung arsitektur <strong>Progressive Web App (PWA) & WebAPK</strong> standar resmi Google. Anda dapat memasang aplikasi langsung ke layar utama HP Android tanpa browser bar, atau mengompilasi file <code>.apk</code> mandiri.
          </p>
        </div>
      </div>

      {/* 3 Main Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* METODE 1: 1-Klik Pasang di HP (WebAPK) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3">
              <Smartphone className="w-6 h-6" />
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              Metode 1 (Paling Mudah)
            </div>
            <h3 className="font-bold text-slate-900 text-base mt-0.5">Pasang Langsung di HP Android</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Otomatis dipasang ke aplikasi HP Android Anda (WebAPK). Memiliki ikon mandiri di menu aplikasi, membuka layar penuh (standalone), dan bekerja cepat.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            {isInstalled ? (
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Aplikasi sudah terpasang di perangkat Anda!</span>
              </div>
            ) : isInstallable ? (
              <button
                onClick={install}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Pasang Aplikasi Sekarang</span>
              </button>
            ) : (
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <strong>Cara Pasang di Browser Chrome HP:</strong>
                  <ol className="list-decimal list-inside space-y-0.5 text-slate-500">
                    <li>Buka menu titik tiga (⋮) di pojok kanan atas Chrome.</li>
                    <li>Pilih <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Install App"</strong>.</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* METODE 2: 1-Klik APK Generator via PWABuilder */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 transition">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-3">
              <Package className="w-6 h-6" />
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
              Metode 2 (File APK Standalone)
            </div>
            <h3 className="font-bold text-slate-900 text-base mt-0.5">Unduh File .APK via PWABuilder</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Layanan resmi buatan Microsoft & Google untuk mengubah Web App menjadi file biner <strong>.apk</strong> (Android Package Kit) atau <strong>.aab</strong> (Google Play).
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <a
              href={`https://www.pwabuilder.com/?site=${encodeURIComponent(currentAppUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 text-center"
            >
              <span>Buka PWABuilder (Unduh APK)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={handleDownloadApkPackage}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <FileCode className="w-3.5 h-3.5 text-slate-500" />
              <span>Unduh Android Manifest JSON</span>
            </button>
          </div>
        </div>

        {/* METODE 3: CLI Bubblewrap & Capacitor Builder */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-purple-300 transition">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-3">
              <Terminal className="w-6 h-6" />
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
              Metode 3 (Developer / CLI)
            </div>
            <h3 className="font-bold text-slate-900 text-base mt-0.5">Build APK dengan Bubblewrap CLI</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Gunakan perangkat lunak CLI resmi dari Google Chrome Team untuk mengompilasi APK langsung dari terminal komputer Anda.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <button
              onClick={handleCopyScript}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/20 transition flex items-center justify-center gap-2"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Perintah Disalin!' : 'Salin Perintah Build Terminal'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* QR Code & Mobile Connection Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-6">
        <div className="w-40 h-40 bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-center shrink-0">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
              currentAppUrl
            )}`}
            alt="Scan QR untuk pasang di HP"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="space-y-2 text-xs flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
            Pindai Langsung dari Kamera HP
          </span>
          <h4 className="font-bold text-base text-slate-900">
            Akses dan Pasang Aplikasi Toko di Ponsel Android Anda
          </h4>
          <p className="text-slate-600 leading-relaxed">
            Arahkan kamera ponsel Android Anda ke kode QR di samping untuk langsung membuka aplikasi kasir ini di Google Chrome HP. Kemudian ketuk <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Install App"</strong> untuk memasangnya sebagai aplikasi Android native mandiri!
          </p>
          <div className="pt-1">
            <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-1 rounded">
              URL: {currentAppUrl}
            </span>
          </div>
        </div>
      </div>

      {/* Bubblewrap Command Terminal Preview */}
      <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 text-slate-200 space-y-3 font-mono text-xs shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <Terminal className="w-4 h-4" />
            <span>Skrip Pembuatan File APK Mandiri (Android SDK / CLI)</span>
          </div>
          <button
            onClick={handleCopyScript}
            className="text-[11px] bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-lg text-slate-200 flex items-center gap-1.5 transition"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Disalin' : 'Salin Skrip'}</span>
          </button>
        </div>

        <pre className="text-emerald-400 leading-relaxed overflow-x-auto p-2">
          {bubblewrapScript}
        </pre>
      </div>
    </div>
  );
};
