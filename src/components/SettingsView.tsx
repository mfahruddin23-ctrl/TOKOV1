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
} from 'lucide-react';
import { StoreSettings } from '../types';

interface SettingsViewProps {
  settings: StoreSettings;
  onSaveSettings: (settings: StoreSettings) => void;
  onResetData: () => void;
  onExportAllData: () => void;
  onImportAllData: (jsonData: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onResetData,
  onExportAllData,
  onImportAllData,
}) => {
  const [form, setForm] = useState<StoreSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

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

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          <span>Pengaturan Profil Toko & Sistem</span>
        </h2>
        <p className="text-xs text-slate-500">
          Ubah identitas toko, tarif PPN, format struk, dan backup data spreadsheet.
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

        {/* GAS Web App Link */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Link className="w-4 h-4 text-blue-600" />
            <span>Koneksi URL Web App Google Apps Script (Opsional)</span>
          </h3>

          <div className="text-xs">
            <label className="block font-semibold text-slate-700 mb-1">
              Google Apps Script Deployed Web App URL
            </label>
            <input
              type="text"
              value={form.gasWebAppUrl || ''}
              onChange={(e) => setForm({ ...form, gasWebAppUrl: e.target.value })}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Jika diisi, aplikasi dapat mengirim data transaksi langsung ke webhook Apps Script Anda.
            </p>
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
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2 transition ml-auto"
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>Reset Data Contoh Bawaan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
