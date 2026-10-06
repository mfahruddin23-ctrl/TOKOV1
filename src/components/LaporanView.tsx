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
} from 'lucide-react';
import { Produk, Penjualan, Pembelian } from '../types';
import { formatRupiah, formatTanggal } from '../utils/helpers';

interface LaporanViewProps {
  products: Produk[];
  sales: Penjualan[];
  purchases: Pembelian[];
}

export const LaporanView: React.FC<LaporanViewProps> = ({ products, sales, purchases }) => {
  const [reportType, setReportType] = useState<'laba' | 'penjualan' | 'pembelian' | 'stok'>('laba');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  filteredSales.forEach((s) => {
    totalPendapatan += s.totalBayar;
    s.items.forEach((itm) => {
      totalHPP += (itm.hargaBeli || 0) * itm.qty;
    });
  });

  const totalLabaKotor = totalPendapatan - totalHPP;
  const marginLaba = totalPendapatan > 0 ? ((totalLabaKotor / totalPendapatan) * 100).toFixed(1) : '0';

  // Total inventory valuation
  const totalValuasiStok = products.reduce((acc, p) => acc + p.stok * p.hargaBeli, 0);
  const totalPotensiOmsetStok = products.reduce((acc, p) => acc + p.stok * p.hargaJual, 0);

  // CSV Exporter
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (reportType === 'laba') {
      headers = ['No Transaksi', 'Tanggal', 'Item', 'Qty', 'Harga Jual', 'HPP (Harga Beli)', 'Subtotal Omset', 'Laba Bersih'];
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
            laba,
          ]);
        });
      });
    } else if (reportType === 'stok') {
      headers = ['ID', 'Barcode', 'Nama Produk', 'Stok', 'Satuan', 'Harga Beli', 'Total Nilai Aset'];
      products.forEach((p) => {
        rows.push([p.id, p.barcode, `"${p.nama.replace(/"/g, '""')}"`, p.stok, p.satuan, p.hargaBeli, p.stok * p.hargaBeli]);
      });
    } else if (reportType === 'pembelian') {
      headers = ['No Pembelian', 'Tanggal', 'Supplier', 'Produk', 'Qty', 'Harga Beli', 'Total'];
      filteredPurchases.forEach((p) => {
        rows.push([p.id, p.tanggal, `"${p.supplier.replace(/"/g, '""')}"`, `"${p.namaProduk.replace(/"/g, '""')}"`, p.qty, p.hargaBeli, p.total]);
      });
    } else {
      headers = ['No Transaksi', 'Tanggal', 'Kasir', 'Pelanggan', 'Qty Item', 'Metode', 'Total Bayar'];
      filteredSales.forEach((s) => {
        rows.push([s.id, s.tanggal, s.kasir, `"${(s.pelanggan || '').replace(/"/g, '""')}"`, s.totalQty, s.metodePembayaran, s.totalBayar]);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <span>Laporan Akuntansi & Analisa Keuangan</span>
          </h2>
          <p className="text-xs text-slate-500">
            Kalkulasi laba kotor, HPP, omset penjualan kasir, dan valuasi aset persediaan barang.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Financial Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omset */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Total Omset Penjualan
          </div>
          <div className="text-2xl font-extrabold text-blue-600">
            {formatRupiah(totalPendapatan)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{filteredSales.length} transaksi kasir</div>
        </div>

        {/* HPP Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Beban Pokok Penjualan (HPP)
          </div>
          <div className="text-2xl font-extrabold text-slate-700">
            {formatRupiah(totalHPP)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Modal dasar barang terjual</div>
        </div>

        {/* Laba Kotor */}
        <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
            Estimasi Laba Kotor
          </div>
          <div className="text-2xl font-extrabold text-emerald-800">
            {formatRupiah(totalLabaKotor)}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Margin Laba: {marginLaba}%</span>
          </div>
        </div>

        {/* Valuasi Persediaan */}
        <div className="bg-purple-50/70 p-5 rounded-2xl border border-purple-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-1">
            Valuasi Aset Gudang
          </div>
          <div className="text-2xl font-extrabold text-purple-800">
            {formatRupiah(totalValuasiStok)}
          </div>
          <div className="text-[11px] text-purple-600 mt-1">
            Potensi Omset: {formatRupiah(totalPotensiOmsetStok)}
          </div>
        </div>
      </div>

      {/* Tabs and Date Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
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
            Daftar Penjualan
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

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            title="Dari Tanggal"
          />
          <span className="text-slate-400 text-xs">s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            title="Sampai Tanggal"
          />
        </div>
      </div>

      {/* Dynamic Report Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
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
                  <th className="px-4 py-3 text-right">Subtotal</th>
                  <th className="px-4 py-3 text-right font-bold text-emerald-700">Laba Bersih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((s) =>
                  s.items.map((item, idx) => {
                    const hppTotal = (item.hargaBeli || 0) * item.qty;
                    const labaItem = item.subtotal - hppTotal;
                    return (
                      <tr key={`${s.id}-${idx}`} className="hover:bg-slate-50">
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
                )}
              </tbody>
            </table>
          )}

          {reportType === 'stok' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-3">ID / Barcode</th>
                  <th className="px-4 py-3">Nama Produk</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3 text-center">Stok</th>
                  <th className="px-4 py-3 text-right">Harga Beli (HPP)</th>
                  <th className="px-4 py-3 text-right">Total Nilai Aset</th>
                  <th className="px-4 py-3 text-right">Potensi Penjualan</th>
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
            </table>
          )}

          {reportType === 'penjualan' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-3">No Transaksi</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Kasir</th>
                  <th className="px-4 py-3">Pelanggan</th>
                  <th className="px-4 py-3 text-center">Qty Item</th>
                  <th className="px-4 py-3">Metode</th>
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
                    <td className="px-4 py-2.5 font-semibold">{s.metodePembayaran}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(s.totalBayar)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'pembelian' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-3">No Pembelian</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Produk</th>
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
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
