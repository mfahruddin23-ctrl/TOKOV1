import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  Calendar,
  DollarSign,
  PackageCheck,
  Percent,
  Eye,
  X,
  FileCheck,
  Building2,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';
import { Produk, Penjualan, Pembelian, StoreSettings, Pengguna } from '../types';
import { formatRupiah, formatTanggal } from '../utils/helpers';

interface LaporanViewProps {
  products: Produk[];
  sales: Penjualan[];
  purchases: Pembelian[];
  settings: StoreSettings;
  currentUser: Pengguna | null;
}

export const LaporanView: React.FC<LaporanViewProps> = ({
  products,
  sales,
  purchases,
  settings,
  currentUser,
}) => {
  const [reportType, setReportType] = useState<'laba' | 'penjualan' | 'pembelian' | 'stok'>('laba');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Quick Date presets
  const handleSetToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    setStartDate(today);
    setEndDate(today);
  };

  const handleSetThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    setStartDate(firstDay);
    setEndDate(lastDay);
  };

  const handleResetFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  // Filter sales
  const filteredSales = sales.filter((s) => {
    const sDate = s.tanggal ? s.tanggal.slice(0, 10) : '';
    const matchStart = !startDate || sDate >= startDate;
    const matchEnd = !endDate || sDate <= endDate;
    return matchStart && matchEnd;
  });

  // Filter purchases
  const filteredPurchases = purchases.filter((p) => {
    const pDate = p.tanggal ? p.tanggal.slice(0, 10) : '';
    const matchStart = !startDate || pDate >= startDate;
    const matchEnd = !endDate || pDate <= endDate;
    return matchStart && matchEnd;
  });

  // Financial calculations
  let totalPendapatan = 0;
  let totalHPP = 0;
  let totalItemTerjual = 0;

  filteredSales.forEach((s) => {
    totalPendapatan += s.totalBayar;
    s.items.forEach((itm) => {
      totalHPP += (itm.hargaBeli || 0) * itm.qty;
      totalItemTerjual += itm.qty;
    });
  });

  const totalLabaKotor = totalPendapatan - totalHPP;
  const marginLaba = totalPendapatan > 0 ? ((totalLabaKotor / totalPendapatan) * 100).toFixed(1) : '0';

  // Purchases totals
  const totalPembelianAmount = filteredPurchases.reduce((acc, p) => acc + p.total, 0);
  const totalQtyBeli = filteredPurchases.reduce((acc, p) => acc + p.qty, 0);

  // Inventory valuation
  const totalValuasiStok = products.reduce((acc, p) => acc + p.stok * p.hargaBeli, 0);
  const totalPotensiOmsetStok = products.reduce((acc, p) => acc + p.stok * p.hargaJual, 0);
  const totalFisikStok = products.reduce((acc, p) => acc + p.stok, 0);

  // Report title & doc number
  const reportTitles: Record<string, string> = {
    laba: 'LAPORAN REKAPITULASI LABA RUGI & ANALISIS MARGIN',
    penjualan: 'LAPORAN RINCIAN TRANSAKSI PENJUALAN KASIR',
    pembelian: 'LAPORAN PEMBELIAN & RESTOCK BARANG MASUK',
    stok: 'LAPORAN VALUASI ASET PERSEDIAAN & INVENTORI GUDANG',
  };

  const currentDateFormatted = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date());

  const docNo = `RPT/FIN/${new Date().toISOString().slice(0, 7).replace('-', '')}/${String(
    filteredSales.length + 1
  ).padStart(3, '0')}`;

  const periodText =
    startDate && endDate
      ? `${startDate} s/d ${endDate}`
      : startDate
      ? `Mulai ${startDate}`
      : endDate
      ? `Sampai ${endDate}`
      : 'Semua Data Transaksi Tercatat';

  // CSV Exporter
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (reportType === 'laba') {
      headers = [
        'No Transaksi',
        'Tanggal',
        'Item Produk',
        'Qty',
        'Harga Jual',
        'HPP Satuan',
        'Subtotal Omset',
        'Total HPP',
        'Laba Kotor',
      ];
      filteredSales.forEach((s) => {
        s.items.forEach((itm) => {
          const itemHpp = (itm.hargaBeli || 0) * itm.qty;
          const laba = itm.subtotal - itemHpp;
          rows.push([
            s.id,
            s.tanggal,
            `"${itm.nama.replace(/"/g, '""')}"`,
            itm.qty,
            itm.harga,
            itm.hargaBeli || 0,
            itm.subtotal,
            itemHpp,
            laba,
          ]);
        });
      });
    } else if (reportType === 'stok') {
      headers = [
        'ID Produk',
        'Barcode',
        'Nama Produk',
        'Kategori',
        'Stok Fisik',
        'Satuan',
        'Harga Beli (HPP)',
        'Harga Jual',
        'Nilai Valuasi Aset',
      ];
      products.forEach((p) => {
        rows.push([
          p.id,
          p.barcode,
          `"${p.nama.replace(/"/g, '""')}"`,
          p.kategori,
          p.stok,
          p.satuan,
          p.hargaBeli,
          p.hargaJual,
          p.stok * p.hargaBeli,
        ]);
      });
    } else if (reportType === 'pembelian') {
      headers = ['No Pembelian', 'Tanggal', 'Supplier', 'Produk', 'Qty', 'Harga Beli', 'Total'];
      filteredPurchases.forEach((p) => {
        rows.push([
          p.id,
          p.tanggal,
          `"${p.supplier.replace(/"/g, '""')}"`,
          `"${p.namaProduk.replace(/"/g, '""')}"`,
          p.qty,
          p.hargaBeli,
          p.total,
        ]);
      });
    } else {
      headers = [
        'No Transaksi',
        'Tanggal',
        'Kasir',
        'Pelanggan',
        'Qty Item',
        'Metode Pembayaran',
        'Total Bayar',
      ];
      filteredSales.forEach((s) => {
        rows.push([
          s.id,
          s.tanggal,
          s.kasir,
          `"${(s.pelanggan || '').replace(/"/g, '""')}"`,
          s.totalQty,
          s.metodePembayaran,
          s.totalBayar,
        ]);
      });
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `${reportTitles[reportType].replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintClick = () => {
    setShowPrintModal(true);
  };

  const executeBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
              Modul Akuntansi
            </span>
            <span className="text-xs text-slate-400">Database: Google Spreadsheet</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 mt-1">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <span>Laporan Keuangan & Analisa Laba Rugi</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Perhitungan resmi laba kotor, margin penjualan, beban pokok penjualan (HPP), dan valuasi aset toko.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Ekspor CSV / Excel</span>
          </button>

          {/* Button to Open Formal Print Preview Modal */}
          <button
            onClick={handlePrintClick}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan Resmi (PDF)</span>
          </button>
        </div>
      </div>

      {/* 4 Financial Highlight Metric Cards */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omset */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Total Omset Penjualan
          </div>
          <div className="text-2xl font-extrabold text-blue-600">{formatRupiah(totalPendapatan)}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{filteredSales.length} Transaksi Struk</span>
            <span className="font-semibold text-slate-600">{totalItemTerjual} item</span>
          </div>
        </div>

        {/* HPP Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Beban Pokok Penjualan (HPP)
          </div>
          <div className="text-2xl font-extrabold text-slate-700">{formatRupiah(totalHPP)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Modal dasar barang terjual</div>
        </div>

        {/* Laba Kotor Bersih */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-5 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-1 flex items-center justify-between">
            <span>Laba Kotor Bersih</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
              {marginLaba}% Margin
            </span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">{formatRupiah(totalLabaKotor)}</div>
          <div className="text-[11px] text-emerald-700/80 mt-1 font-medium">
            (Total Omset - Beban Pokok HPP)
          </div>
        </div>

        {/* Valuasi Persediaan */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50/50 p-5 rounded-2xl border border-purple-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-purple-800 mb-1 flex items-center justify-between">
            <span>Valuasi Aset Gudang</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200/80 text-purple-900">
              {totalFisikStok} Unit
            </span>
          </div>
          <div className="text-2xl font-extrabold text-purple-700">{formatRupiah(totalValuasiStok)}</div>
          <div className="text-[11px] text-purple-600/80 mt-1">
            Potensi Omset: {formatRupiah(totalPotensiOmsetStok)}
          </div>
        </div>
      </div>

      {/* Tabs and Date Filter */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Navigation Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setReportType('laba')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              reportType === 'laba'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Laba Kotor Per Item
          </button>
          <button
            onClick={() => setReportType('penjualan')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              reportType === 'penjualan'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Rekap Penjualan
          </button>
          <button
            onClick={() => setReportType('pembelian')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              reportType === 'pembelian'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pembelian Restock
          </button>
          <button
            onClick={() => setReportType('stok')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              reportType === 'stok'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Valuasi Stok Barang
          </button>
        </div>

        {/* Date Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={handleSetToday}
              className="px-2.5 py-1 bg-white hover:bg-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 shadow-2xs"
            >
              Hari Ini
            </button>
            <button
              onClick={handleSetThisMonth}
              className="px-2.5 py-1 bg-white hover:bg-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 shadow-2xs"
            >
              Bulan Ini
            </button>
            {(startDate || endDate) && (
              <button
                onClick={handleResetFilter}
                className="px-2 py-1 text-[11px] text-red-600 hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white"
              title="Dari Tanggal"
            />
            <span className="text-slate-400 text-xs">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white"
              title="Sampai Tanggal"
            />
          </div>
        </div>
      </div>

      {/* Dynamic Report Table (On Screen) */}
      <div className="no-print bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="font-semibold text-slate-700">
            {reportTitles[reportType]} • Periode: <span className="font-mono text-blue-600">{periodText}</span>
          </div>
          <div className="text-slate-400">
            {reportType === 'laba'
              ? `${filteredSales.length} Transaksi`
              : reportType === 'stok'
              ? `${products.length} Produk`
              : reportType === 'pembelian'
              ? `${filteredPurchases.length} Pembelian`
              : `${filteredSales.length} Transaksi`}
          </div>
        </div>

        <div className="overflow-x-auto">
          {reportType === 'laba' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-3">No Transaksi</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Nama Produk</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Harga Jual</th>
                  <th className="px-4 py-3 text-right">HPP</th>
                  <th className="px-4 py-3 text-right">Subtotal Omset</th>
                  <th className="px-4 py-3 text-right font-bold text-emerald-700">Laba Kotor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Tidak ada transaksi penjualan pada periode ini.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((s) =>
                    s.items.map((item, idx) => {
                      const hppTotal = (item.hargaBeli || 0) * item.qty;
                      const labaItem = item.subtotal - hppTotal;
                      return (
                        <tr key={`${s.id}-${idx}`} className="hover:bg-slate-50/80">
                          <td className="px-4 py-2.5 font-mono text-blue-600 font-medium">{s.id}</td>
                          <td className="px-4 py-2.5 text-slate-500">{s.tanggal.slice(0, 10)}</td>
                          <td className="px-4 py-2.5 font-semibold text-slate-800">{item.nama}</td>
                          <td className="px-4 py-2.5 text-center font-bold">{item.qty}</td>
                          <td className="px-4 py-2.5 text-right font-mono">{formatRupiah(item.harga)}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-500">
                            {formatRupiah(item.hargaBeli)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-800">
                            {formatRupiah(item.subtotal)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-600">
                            +{formatRupiah(labaItem)}
                          </td>
                        </tr>
                      );
                    })
                  )
                )}
              </tbody>
              {filteredSales.length > 0 && (
                <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-800">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right uppercase text-[10px] tracking-wider">
                      TOTAL REKAPITULASI:
                    </td>
                    <td className="px-4 py-3 text-center">{totalItemTerjual}</td>
                    <td colSpan={2} className="px-4 py-3 text-right font-mono text-slate-600">
                      HPP: {formatRupiah(totalHPP)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-blue-600">
                      {formatRupiah(totalPendapatan)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-700">
                      +{formatRupiah(totalLabaKotor)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}

          {reportType === 'stok' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-3">ID / Barcode</th>
                  <th className="px-4 py-3">Nama Produk</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3 text-center">Stok Fisik</th>
                  <th className="px-4 py-3 text-right">Harga Beli (HPP)</th>
                  <th className="px-4 py-3 text-right">Total Nilai Aset</th>
                  <th className="px-4 py-3 text-right">Potensi Omset</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-mono">
                      <div className="font-bold text-slate-800">{p.id}</div>
                      <div className="text-[10px] text-slate-400">{p.barcode}</div>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-800">{p.nama}</td>
                    <td className="px-4 py-2.5 text-slate-500">{p.kategori}</td>
                    <td className="px-4 py-2.5 text-center font-bold">
                      {p.stok} {p.satuan}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-600">
                      {formatRupiah(p.hargaBeli)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-purple-700">
                      {formatRupiah(p.stok * p.hargaBeli)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-blue-600">
                      {formatRupiah(p.stok * p.hargaJual)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-800">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right uppercase text-[10px]">
                    TOTAL VALUASI ASET:
                  </td>
                  <td className="px-4 py-3 text-center">{totalFisikStok} Unit</td>
                  <td className="px-4 py-3 text-right"></td>
                  <td className="px-4 py-3 text-right font-mono text-purple-800">
                    {formatRupiah(totalValuasiStok)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-blue-600">
                    {formatRupiah(totalPotensiOmsetStok)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}

          {reportType === 'penjualan' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-3">No Transaksi</th>
                  <th className="px-4 py-3">Tanggal & Waktu</th>
                  <th className="px-4 py-3">Kasir</th>
                  <th className="px-4 py-3">Pelanggan</th>
                  <th className="px-4 py-3 text-center">Total Item</th>
                  <th className="px-4 py-3">Metode Bayar</th>
                  <th className="px-4 py-3 text-right">Total Bayar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-mono font-bold text-blue-600">{s.id}</td>
                    <td className="px-4 py-2.5 text-slate-500">{formatTanggal(s.tanggal)}</td>
                    <td className="px-4 py-2.5 text-slate-800 font-medium">{s.kasir}</td>
                    <td className="px-4 py-2.5 text-slate-600">{s.pelanggan || '-'}</td>
                    <td className="px-4 py-2.5 text-center font-bold">{s.totalQty}</td>
                    <td className="px-4 py-2.5 font-semibold">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold">
                        {s.metodePembayaran}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(s.totalBayar)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-800">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right uppercase text-[10px]">
                    TOTAL PENJUALAN:
                  </td>
                  <td className="px-4 py-3 text-center">{totalItemTerjual}</td>
                  <td></td>
                  <td className="px-4 py-3 text-right font-mono text-blue-600">
                    {formatRupiah(totalPendapatan)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}

          {reportType === 'pembelian' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-3">No Pembelian</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Produk Masuk</th>
                  <th className="px-4 py-3 text-center">Qty Masuk</th>
                  <th className="px-4 py-3 text-right">Harga Beli</th>
                  <th className="px-4 py-3 text-right">Total Pembelian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-mono font-bold text-indigo-600">{p.id}</td>
                    <td className="px-4 py-2.5 text-slate-500">{formatTanggal(p.tanggal)}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-800">{p.supplier}</td>
                    <td className="px-4 py-2.5 text-slate-700">{p.namaProduk}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-emerald-600">+{p.qty}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-600">
                      {formatRupiah(p.hargaBeli)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(p.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-800">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right uppercase text-[10px]">
                    TOTAL PEMBELIAN:
                  </td>
                  <td className="px-4 py-3 text-center text-emerald-600">+{totalQtyBeli}</td>
                  <td></td>
                  <td className="px-4 py-3 text-right font-mono text-slate-900">
                    {formatRupiah(totalPembelianAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL PRATINJAU CETAK LAPORAN PROFESIONAL (FORMAL REPORT PRINT PREVIEW) */}
      {/* ========================================================================= */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden border border-slate-200 flex flex-col max-h-[95vh]">
            {/* Modal Control Bar (Excluded from Print) */}
            <div className="no-print p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm">Pratinjau Dokumen Laporan Resmi (A4)</h3>
                  <p className="text-[11px] text-slate-400">
                    Kop surat resmi, metadata laporan, tabel rekapitulasi, dan lembar pengesahan.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={executeBrowserPrint}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Dokumen Sekarang (Print / PDF)</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                  title="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Printable Container */}
            <div className="p-6 sm:p-10 overflow-y-auto bg-white text-slate-900 font-sans printable-report-area">
              {/* ------------------------------------------------------------- */}
              {/* KOP SURAT FORMAL RESMI (OFFICIAL STORE LETTERHEAD) */}
              {/* ------------------------------------------------------------- */}
              <div className="flex items-center justify-between gap-6 pb-4 border-b-2 border-slate-900">
                <div className="flex items-center gap-4">
                  {settings.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt="Logo Toko"
                      className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-xl shrink-0">
                      <Building2 className="w-8 h-8" />
                    </div>
                  )}

                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase">
                      {settings.namaToko}
                    </h1>
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      {settings.slogan || 'Sistem Pengelolaan Kasir & Toko Terpadu'}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      {settings.alamat} • Telp: {settings.telepon}
                    </p>
                  </div>
                </div>

                <div className="text-right hidden sm:block shrink-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Status Dokumen
                  </div>
                  <div className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 mt-1 inline-block">
                    RESMI & TERVALIDASI
                  </div>
                </div>
              </div>

              {/* Garis Ganda Kop Surat Resmi */}
              <div className="h-0.5 bg-slate-900 mt-1 mb-5"></div>

              {/* ------------------------------------------------------------- */}
              {/* JUDUL DOKUMEN & METADATA RESMI */}
              {/* ------------------------------------------------------------- */}
              <div className="text-center my-4">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase underline decoration-2 underline-offset-4">
                  {reportTitles[reportType]}
                </h2>
                <div className="text-xs text-slate-600 mt-1.5 font-medium">
                  Periode Transaksi: <span className="font-bold text-slate-900">{periodText}</span>
                </div>
              </div>

              {/* Metadata Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 my-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">No. Dokumen:</span>
                  <span className="font-mono font-bold text-slate-800">{docNo}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Waktu Cetak:</span>
                  <span className="font-medium text-slate-800">{currentDateFormatted}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Petugas / Operator:</span>
                  <span className="font-bold text-slate-800">{currentUser?.nama || 'Administrator'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Basis Database:</span>
                  <span className="font-medium text-slate-800">Google Spreadsheet</span>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* RINGKASAN EKSEKUTIF KEUANGAN (EXECUTIVE SUMMARY TILES) */}
              {/* ------------------------------------------------------------- */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4 page-break-inside-avoid">
                <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-center">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Total Omset</div>
                  <div className="text-sm font-extrabold text-blue-700 mt-0.5">
                    {formatRupiah(totalPendapatan)}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-center">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Beban Pokok (HPP)</div>
                  <div className="text-sm font-extrabold text-slate-800 mt-0.5">
                    {formatRupiah(totalHPP)}
                  </div>
                </div>

                <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-center">
                  <div className="text-[10px] text-emerald-800 uppercase font-bold">Laba Kotor</div>
                  <div className="text-sm font-extrabold text-emerald-700 mt-0.5">
                    {formatRupiah(totalLabaKotor)}
                  </div>
                </div>

                <div className="p-2.5 bg-purple-50 border border-purple-300 rounded-lg text-center">
                  <div className="text-[10px] text-purple-800 uppercase font-bold">Valuasi Persediaan</div>
                  <div className="text-sm font-extrabold text-purple-700 mt-0.5">
                    {formatRupiah(totalValuasiStok)}
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* TABEL DATA RESMI UNTUK CETAK */}
              {/* ------------------------------------------------------------- */}
              <div className="my-5 overflow-x-auto page-break-inside-avoid">
                {reportType === 'laba' && (
                  <table className="w-full text-left border-collapse text-[11px] border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-900 font-bold uppercase text-[10px]">
                        <th className="p-2 border border-slate-300 text-center w-8">No</th>
                        <th className="p-2 border border-slate-300">No Transaksi</th>
                        <th className="p-2 border border-slate-300">Tanggal</th>
                        <th className="p-2 border border-slate-300">Nama Produk</th>
                        <th className="p-2 border border-slate-300 text-center">Qty</th>
                        <th className="p-2 border border-slate-300 text-right">Harga Jual</th>
                        <th className="p-2 border border-slate-300 text-right">HPP</th>
                        <th className="p-2 border border-slate-300 text-right">Omset</th>
                        <th className="p-2 border border-slate-300 text-right font-bold">Laba Kotor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-4 text-center text-slate-500 italic">
                            Tidak ada data transaksi.
                          </td>
                        </tr>
                      ) : (
                        (() => {
                          let rowNumber = 1;
                          return filteredSales.map((s) =>
                            s.items.map((item, idx) => {
                              const hppItem = (item.hargaBeli || 0) * item.qty;
                              const laba = item.subtotal - hppItem;
                              const currentNum = rowNumber++;
                              return (
                                <tr key={`${s.id}-${idx}`} className="border-b border-slate-200">
                                  <td className="p-2 border border-slate-200 text-center">{currentNum}</td>
                                  <td className="p-2 border border-slate-200 font-mono font-bold text-slate-800">
                                    {s.id}
                                  </td>
                                  <td className="p-2 border border-slate-200 text-slate-600">
                                    {s.tanggal.slice(0, 10)}
                                  </td>
                                  <td className="p-2 border border-slate-200 font-medium text-slate-900">
                                    {item.nama}
                                  </td>
                                  <td className="p-2 border border-slate-200 text-center font-bold">
                                    {item.qty}
                                  </td>
                                  <td className="p-2 border border-slate-200 text-right font-mono">
                                    {formatRupiah(item.harga)}
                                  </td>
                                  <td className="p-2 border border-slate-200 text-right font-mono text-slate-600">
                                    {formatRupiah(item.hargaBeli)}
                                  </td>
                                  <td className="p-2 border border-slate-200 text-right font-mono font-semibold">
                                    {formatRupiah(item.subtotal)}
                                  </td>
                                  <td className="p-2 border border-slate-200 text-right font-mono font-bold text-emerald-800">
                                    +{formatRupiah(laba)}
                                  </td>
                                </tr>
                              );
                            })
                          );
                        })()
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold border-t-2 border-slate-400 text-slate-950">
                        <td colSpan={4} className="p-2 text-right uppercase text-[10px]">
                          TOTAL KESELURUHAN:
                        </td>
                        <td className="p-2 text-center">{totalItemTerjual}</td>
                        <td colSpan={2} className="p-2 text-right font-mono">
                          HPP: {formatRupiah(totalHPP)}
                        </td>
                        <td className="p-2 text-right font-mono text-blue-700">
                          {formatRupiah(totalPendapatan)}
                        </td>
                        <td className="p-2 text-right font-mono text-emerald-800">
                          +{formatRupiah(totalLabaKotor)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}

                {reportType === 'stok' && (
                  <table className="w-full text-left border-collapse text-[11px] border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-900 font-bold uppercase text-[10px]">
                        <th className="p-2 border border-slate-300 text-center w-8">No</th>
                        <th className="p-2 border border-slate-300">ID Produk</th>
                        <th className="p-2 border border-slate-300">Barcode</th>
                        <th className="p-2 border border-slate-300">Nama Produk</th>
                        <th className="p-2 border border-slate-300">Kategori</th>
                        <th className="p-2 border border-slate-300 text-center">Stok</th>
                        <th className="p-2 border border-slate-300 text-right">HPP Satuan</th>
                        <th className="p-2 border border-slate-300 text-right">Harga Jual</th>
                        <th className="p-2 border border-slate-300 text-right font-bold">
                          Total Nilai Aset
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p, idx) => (
                        <tr key={p.id} className="border-b border-slate-200">
                          <td className="p-2 border border-slate-200 text-center">{idx + 1}</td>
                          <td className="p-2 border border-slate-200 font-mono font-bold">{p.id}</td>
                          <td className="p-2 border border-slate-200 font-mono text-slate-600">{p.barcode}</td>
                          <td className="p-2 border border-slate-200 font-semibold text-slate-900">
                            {p.nama}
                          </td>
                          <td className="p-2 border border-slate-200 text-slate-600">{p.kategori}</td>
                          <td className="p-2 border border-slate-200 text-center font-bold">
                            {p.stok} {p.satuan}
                          </td>
                          <td className="p-2 border border-slate-200 text-right font-mono">
                            {formatRupiah(p.hargaBeli)}
                          </td>
                          <td className="p-2 border border-slate-200 text-right font-mono">
                            {formatRupiah(p.hargaJual)}
                          </td>
                          <td className="p-2 border border-slate-200 text-right font-mono font-bold text-purple-900">
                            {formatRupiah(p.stok * p.hargaBeli)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold border-t-2 border-slate-400 text-slate-950">
                        <td colSpan={5} className="p-2 text-right uppercase text-[10px]">
                          TOTAL VALUASI FISIK GUDANG:
                        </td>
                        <td className="p-2 text-center">{totalFisikStok} Unit</td>
                        <td colSpan={2}></td>
                        <td className="p-2 text-right font-mono text-purple-900">
                          {formatRupiah(totalValuasiStok)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}

                {reportType === 'penjualan' && (
                  <table className="w-full text-left border-collapse text-[11px] border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-900 font-bold uppercase text-[10px]">
                        <th className="p-2 border border-slate-300 text-center w-8">No</th>
                        <th className="p-2 border border-slate-300">No Transaksi</th>
                        <th className="p-2 border border-slate-300">Waktu</th>
                        <th className="p-2 border border-slate-300">Kasir</th>
                        <th className="p-2 border border-slate-300">Pelanggan</th>
                        <th className="p-2 border border-slate-300 text-center">Items</th>
                        <th className="p-2 border border-slate-300">Metode</th>
                        <th className="p-2 border border-slate-300 text-right font-bold">Total Transaksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.map((s, idx) => (
                        <tr key={s.id} className="border-b border-slate-200">
                          <td className="p-2 border border-slate-200 text-center">{idx + 1}</td>
                          <td className="p-2 border border-slate-200 font-mono font-bold text-blue-700">
                            {s.id}
                          </td>
                          <td className="p-2 border border-slate-200 text-slate-600">{s.tanggal}</td>
                          <td className="p-2 border border-slate-200 font-medium text-slate-900">{s.kasir}</td>
                          <td className="p-2 border border-slate-200 text-slate-600">
                            {s.pelanggan || 'Umum'}
                          </td>
                          <td className="p-2 border border-slate-200 text-center font-bold">{s.totalQty}</td>
                          <td className="p-2 border border-slate-200 font-medium">{s.metodePembayaran}</td>
                          <td className="p-2 border border-slate-200 text-right font-mono font-bold text-slate-900">
                            {formatRupiah(s.totalBayar)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold border-t-2 border-slate-400 text-slate-950">
                        <td colSpan={5} className="p-2 text-right uppercase text-[10px]">
                          TOTAL PENJUALAN:
                        </td>
                        <td className="p-2 text-center">{totalItemTerjual}</td>
                        <td></td>
                        <td className="p-2 text-right font-mono text-blue-700">
                          {formatRupiah(totalPendapatan)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}

                {reportType === 'pembelian' && (
                  <table className="w-full text-left border-collapse text-[11px] border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-900 font-bold uppercase text-[10px]">
                        <th className="p-2 border border-slate-300 text-center w-8">No</th>
                        <th className="p-2 border border-slate-300">No Pembelian</th>
                        <th className="p-2 border border-slate-300">Tanggal</th>
                        <th className="p-2 border border-slate-300">Supplier</th>
                        <th className="p-2 border border-slate-300">Nama Produk</th>
                        <th className="p-2 border border-slate-300 text-center">Qty Masuk</th>
                        <th className="p-2 border border-slate-300 text-right">Harga Beli</th>
                        <th className="p-2 border border-slate-300 text-right font-bold">Total Tagihan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPurchases.map((p, idx) => (
                        <tr key={p.id} className="border-b border-slate-200">
                          <td className="p-2 border border-slate-200 text-center">{idx + 1}</td>
                          <td className="p-2 border border-slate-200 font-mono font-bold text-indigo-700">
                            {p.id}
                          </td>
                          <td className="p-2 border border-slate-200 text-slate-600">{p.tanggal}</td>
                          <td className="p-2 border border-slate-200 font-medium text-slate-900">
                            {p.supplier}
                          </td>
                          <td className="p-2 border border-slate-200">{p.namaProduk}</td>
                          <td className="p-2 border border-slate-200 text-center font-bold text-emerald-700">
                            +{p.qty}
                          </td>
                          <td className="p-2 border border-slate-200 text-right font-mono">
                            {formatRupiah(p.hargaBeli)}
                          </td>
                          <td className="p-2 border border-slate-200 text-right font-mono font-bold text-slate-900">
                            {formatRupiah(p.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold border-t-2 border-slate-400 text-slate-950">
                        <td colSpan={5} className="p-2 text-right uppercase text-[10px]">
                          TOTAL PEMBELIAN:
                        </td>
                        <td className="p-2 text-center text-emerald-800">+{totalQtyBeli}</td>
                        <td></td>
                        <td className="p-2 text-right font-mono text-slate-900">
                          {formatRupiah(totalPembelianAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>

              {/* ------------------------------------------------------------- */}
              {/* LEMBAR PENGESAHAN / TANDA TANGAN RESMI (SIGNATURE BLOCK) */}
              {/* ------------------------------------------------------------- */}
              <div className="mt-8 pt-6 border-t border-slate-300 page-break-inside-avoid">
                <div className="flex justify-between items-start text-xs text-slate-800">
                  {/* Bagian Pembuat Laporan */}
                  <div className="text-center w-52">
                    <div className="text-[11px] text-slate-500 mb-1">Dibuat Oleh,</div>
                    <div className="font-bold text-slate-900">Bagian Keuangan / Kasir</div>
                    <div className="h-16 flex items-end justify-center">
                      <span className="text-[10px] text-slate-400 italic font-mono">[Tanda Tangan Digital]</span>
                    </div>
                    <div className="border-b border-slate-900 w-44 mx-auto my-1"></div>
                    <div className="font-bold text-slate-950">{currentUser?.nama || 'Dewi Rahayu'}</div>
                    <div className="text-[10px] text-slate-500 font-mono">NIP: KSR-{new Date().getFullYear()}01</div>
                  </div>

                  {/* Catatan Kaki Legal */}
                  <div className="text-center max-w-xs text-[10px] text-slate-500 self-center hidden sm:block">
                    <p className="italic leading-relaxed">
                      Laporan ini dicetak secara sah dan otomatis dari database Google Spreadsheet terintegrasi.
                      Harap disimpan sebagai arsip pembukuan resmi toko.
                    </p>
                  </div>

                  {/* Bagian Penanggung Jawab / Pemilik */}
                  <div className="text-center w-52">
                    <div className="text-[11px] text-slate-500 mb-1">
                      Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div className="font-bold text-slate-900">Mengetahui, Pemilik Toko</div>
                    <div className="h-16 flex items-end justify-center">
                      <span className="text-[10px] text-slate-400 italic font-mono">[Tanda Tangan Digital]</span>
                    </div>
                    <div className="border-b border-slate-900 w-44 mx-auto my-1"></div>
                    <div className="font-bold text-slate-950">Pimpinan / Manajemen</div>
                    <div className="text-[10px] text-slate-500 font-mono">ID: MGR-STORE-01</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                Tip: Pilih opsi <strong>"Save as PDF"</strong> pada dialog print browser untuk menyimpan file PDF formal.
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition"
                >
                  Tutup Pratinjau
                </button>
                <button
                  onClick={executeBrowserPrint}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Sekarang (Print / PDF)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
