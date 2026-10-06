import React, { useState } from 'react';
import { ReceiptText, Search, Printer, Calendar, Eye, X, ArrowUpDown, Trash2, AlertTriangle } from 'lucide-react';
import { Penjualan, StoreSettings, Pengguna } from '../types';
import { formatRupiah, formatTanggal } from '../utils/helpers';

interface RiwayatPenjualanViewProps {
  sales: Penjualan[];
  settings: StoreSettings;
  currentUser?: Pengguna | null;
  onClearSales?: () => void;
}

export const RiwayatPenjualanView: React.FC<RiwayatPenjualanViewProps> = ({
  sales,
  settings,
  currentUser,
  onClearSales,
}) => {
  const [search, setSearch] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [selectedSale, setSelectedSale] = useState<Penjualan | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filteredSales = sales.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      s.id.toLowerCase().includes(q) ||
      (s.kasir && s.kasir.toLowerCase().includes(q)) ||
      (s.pelanggan && s.pelanggan.toLowerCase().includes(q)) ||
      s.items.some((itm) => itm.nama.toLowerCase().includes(q));

    const sDate = s.tanggal ? s.tanggal.slice(0, 10) : '';
    const matchStart = !filterDateStart || sDate >= filterDateStart;
    const matchEnd = !filterDateEnd || sDate <= filterDateEnd;

    return matchSearch && matchStart && matchEnd;
  });

  const totalOmsetFiltered = filteredSales.reduce((acc, s) => acc + s.totalBayar, 0);

  const handleConfirmClear = () => {
    if (onClearSales) {
      onClearSales();
    }
    setShowClearConfirm(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ReceiptText className="w-6 h-6 text-blue-600" />
            <span>Riwayat Transaksi Penjualan</span>
          </h2>
          <p className="text-xs text-slate-500">
            Daftar seluruh struk dan transaksi kasir yang tersimpan di Google Spreadsheet.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onClearSales && currentUser?.role === 'Admin' && (
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={sales.length === 0}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                sales.length > 0
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
              title="Kosongkan seluruh data transaksi penjualan"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Clear Data Penjualan</span>
            </button>
          )}

          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-right">
            <div className="text-[10px] text-emerald-700 uppercase font-semibold">Total Omset Terpilih</div>
            <div className="text-lg font-extrabold text-emerald-800">{formatRupiah(totalOmsetFiltered)}</div>
          </div>
        </div>
      </div>

      {/* Filter Box */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari no transaksi (TRX-...), kasir, atau pelanggan..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-3">
            <input
              type="date"
              value={filterDateStart}
              onChange={(e) => setFilterDateStart(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
              title="Dari Tanggal"
            />
          </div>

          <div className="sm:col-span-3">
            <input
              type="date"
              value={filterDateEnd}
              onChange={(e) => setFilterDateEnd(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
              title="Sampai Tanggal"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="px-4 py-3.5">No Transaksi</th>
                <th className="px-4 py-3.5">Waktu</th>
                <th className="px-4 py-3.5">Kasir</th>
                <th className="px-4 py-3.5">Pelanggan</th>
                <th className="px-4 py-3.5 text-center">Items</th>
                <th className="px-4 py-3.5">Metode</th>
                <th className="px-4 py-3.5 text-right">Total Bayar</th>
                <th className="px-4 py-3.5 text-center">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada transaksi penjualan yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{s.id}</td>
                    <td className="px-4 py-3 text-slate-500">{formatTanggal(s.tanggal)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{s.kasir}</td>
                    <td className="px-4 py-3 text-slate-600">{s.pelanggan || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {s.totalQty} item
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          s.metodePembayaran === 'Tunai'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.metodePembayaran === 'QRIS'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {s.metodePembayaran}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 font-mono">
                      {formatRupiah(s.totalBayar)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedSale(s)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Lihat Detail & Cetak Ulang Struk"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Detail & Re-print Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Detail Struk Transaksi</h3>
                <p className="text-[10px] text-slate-400 font-mono">{selectedSale.id}</p>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Preview */}
            <div className="p-5 font-mono text-xs bg-slate-50 space-y-3">
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                <div className="font-extrabold text-slate-900">{settings.namaToko}</div>
                <div className="text-[10px] text-slate-500">{settings.alamat}</div>
              </div>

              <div className="text-[11px] space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                <div className="flex justify-between">
                  <span>Waktu:</span>
                  <span>{selectedSale.tanggal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span>{selectedSale.kasir}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span>{selectedSale.pelanggan || '-'}</span>
                </div>
              </div>

              <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-2">
                {selectedSale.items.map((itm, i) => (
                  <div key={i} className="flex justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{itm.nama}</div>
                      <div className="text-[10px] text-slate-500">
                        {itm.qty} x {formatRupiah(itm.harga)}
                      </div>
                    </div>
                    <div className="font-bold text-slate-900">{formatRupiah(itm.subtotal)}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatRupiah(selectedSale.subtotal)}</span>
                </div>
                {selectedSale.diskonTotal > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Diskon:</span>
                    <span>-{formatRupiah(selectedSale.diskonTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-300">
                  <span>TOTAL:</span>
                  <span>{formatRupiah(selectedSale.totalBayar)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bayar ({selectedSale.metodePembayaran}):</span>
                  <span>{formatRupiah(selectedSale.jumlahUang)}</span>
                </div>
                {selectedSale.kembalian > 0 && (
                  <div className="flex justify-between font-bold text-emerald-600">
                    <span>Kembali:</span>
                    <span>{formatRupiah(selectedSale.kembalian)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Ulang Struk</span>
              </button>
              <button
                onClick={() => setSelectedSale(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Clear Riwayat Penjualan */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-rose-200 animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-rose-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-200" />
                <h3 className="font-bold text-base">Hapus Riwayat Penjualan?</h3>
              </div>
              <button onClick={() => setShowClearConfirm(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-700 leading-relaxed">
                Anda akan menghapus <strong>seluruh {sales.length} transaksi penjualan</strong> di database spreadsheet. Semua catatan struk dan rekapitulasi kasir akan dikosongkan ke Rp 0.
              </p>

              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-[11px] text-rose-800">
                <strong>Aman:</strong> Master produk, data harga, stok barang gudang, dan supplier tidak akan terhapus.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClear}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20"
                >
                  Ya, Kosongkan Riwayat Penjualan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
