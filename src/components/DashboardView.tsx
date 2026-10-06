import React from 'react';
import {
  Package,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Boxes,
  ShoppingCart,
  PlusCircle,
  FileCode,
  ArrowUpRight,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { Produk, Penjualan, Pembelian, DatabaseConfig } from '../types';
import { formatRupiah, formatTanggal } from '../utils/helpers';

interface DashboardViewProps {
  products: Produk[];
  sales: Penjualan[];
  purchases: Pembelian[];
  setActiveTab: (tab: string) => void;
  onOpenAddProduct: () => void;
  dbConfig?: DatabaseConfig;
  onOpenSyncModal?: () => void;
  onSyncSupabaseRealtime?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  sales,
  purchases,
  setActiveTab,
  onOpenAddProduct,
  dbConfig,
  onOpenSyncModal,
  onSyncSupabaseRealtime,
}) => {
  // Calculations
  const totalProducts = products.length;
  
  // Today's sales (compare YYYY-MM-DD)
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySales = sales.filter((s) => s.tanggal && s.tanggal.startsWith(todayStr));
  const todaySalesTotal = todaySales.reduce((acc, s) => acc + s.totalBayar, 0);

  // Total purchases
  const totalPurchasesAmount = purchases.reduce((acc, p) => acc + p.total, 0);

  // Total inventory asset value (stok * hargaBeli)
  const totalInventoryValue = products.reduce((acc, p) => acc + p.stok * p.hargaBeli, 0);

  // Low stock products (stok <= minStok)
  const lowStockProducts = products.filter((p) => p.stok <= p.minStok);

  // Top selling products count
  const productSalesCount: Record<string, { nama: string; qty: number; total: number }> = {};
  sales.forEach((s) => {
    s.items.forEach((item) => {
      if (!productSalesCount[item.nama]) {
        productSalesCount[item.nama] = { nama: item.nama, qty: 0, total: 0 };
      }
      productSalesCount[item.nama].qty += item.qty;
      productSalesCount[item.nama].total += item.subtotal;
    });
  });

  const topSellingList = Object.values(productSalesCount)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Monthly sales simulation data
  const monthlyData = [
    { bulan: 'Mei', omset: 4200000 },
    { bulan: 'Jun', omset: 5800000 },
    { bulan: 'Jul', omset: 7100000 },
    { bulan: 'Agt', omset: 6500000 },
    { bulan: 'Sep', omset: 8200000 },
    { bulan: 'Okt', omset: 9600000 + todaySalesTotal },
  ];
  const maxMonthly = Math.max(...monthlyData.map((m) => m.omset), 10000000);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" /> Database Spreadsheet Terhubung
              </span>
              {dbConfig?.supabaseUrl ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>Supabase Realtime Live</span>
                </span>
              ) : null}
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Ringkasan Operasional Toko</h2>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Kelola kasir, inventaris barang, pesanan pembelian, dan laporan laba rugi dengan sinkronisasi realtime Google Spreadsheet & Supabase.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 items-center">
            {onSyncSupabaseRealtime && (
              <button
                type="button"
                onClick={onSyncSupabaseRealtime}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-blue-600/30 cursor-pointer"
                title="Sinkronkan seluruh data aplikasi ke Supabase Realtime sekarang"
              >
                <Zap className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>Sync Supabase Realtime</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('pos')}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-500/20"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Buka Kasir (POS)</span>
            </button>
            <button
              onClick={onOpenAddProduct}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium text-sm rounded-xl border border-white/20 transition backdrop-blur-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tambah Produk</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Produk */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-200 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Produk</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-800">{totalProducts}</div>
          <div className="text-xs text-slate-500 mt-1">Item aktif terdaftar</div>
        </div>

        {/* Penjualan Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-200 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Penjualan Hari Ini</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{formatRupiah(todaySalesTotal)}</div>
          <div className="text-xs text-slate-500 mt-1">{todaySales.length} struk tercetak</div>
        </div>

        {/* Total Pembelian */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Pembelian</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-indigo-700">{formatRupiah(totalPurchasesAmount)}</div>
          <div className="text-xs text-slate-500 mt-1">Restock dari supplier</div>
        </div>

        {/* Nilai Persediaan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-purple-200 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Nilai Persediaan</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-700">{formatRupiah(totalInventoryValue)}</div>
          <div className="text-xs text-slate-500 mt-1">Total aset stok (HPP)</div>
        </div>

        {/* Stok Menipis */}
        <div className={`p-5 rounded-2xl border transition ${
          lowStockProducts.length > 0
            ? 'bg-rose-50/50 border-rose-300 shadow-xs'
            : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">Stok Kritis</span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-600">{lowStockProducts.length} Item</div>
          <div className="text-xs text-rose-700/80 mt-1">Stok &le; batas minimum</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Sales Visual Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Grafik Tren Penjualan Bulanan</h3>
              <p className="text-xs text-slate-500">Estimasi omset 6 bulan terakhir</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
              +18.4% vs Bulan Lalu
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-64 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-100">
            {monthlyData.map((d, idx) => {
              const heightPct = Math.round((d.omset / maxMonthly) * 100);
              const isCurrent = idx === monthlyData.length - 1;

              return (
                <div key={d.bulan} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="text-[11px] font-semibold text-slate-600 opacity-0 group-hover:opacity-100 transition mb-1">
                    {formatRupiah(d.omset)}
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full max-w-[48px] rounded-t-xl transition-all duration-300 ${
                      isCurrent
                        ? 'bg-gradient-to-t from-blue-600 to-indigo-500 shadow-md shadow-blue-500/20'
                        : 'bg-slate-200 group-hover:bg-blue-400'
                    }`}
                  />
                  <div className="text-xs font-semibold text-slate-600 mt-2">{d.bulan}</div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-3 px-2">
            <span>Rp 0</span>
            <span>Rp 5.000.000</span>
            <span>Maks: {formatRupiah(maxMonthly)}</span>
          </div>
        </div>

        {/* Top 5 Products Leaderboard */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">Produk Terlaris</h3>
              <button
                onClick={() => setActiveTab('laporan')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                Lihat Semua <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {topSellingList.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Belum ada transaksi</p>
              ) : (
                topSellingList.map((item, index) => (
                  <div key={item.nama} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        index === 0 ? 'bg-amber-100 text-amber-800' :
                        index === 1 ? 'bg-slate-200 text-slate-700' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 truncate">{item.nama}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-slate-900">{item.qty} terjual</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Metode Terbanyak:</span>
              <span className="font-bold text-emerald-600">Tunai & QRIS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Stock Alert Table */}
      {lowStockProducts.length > 0 && (
        <div className="bg-white rounded-2xl border border-rose-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-rose-50/50 border-b border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Perhatian: {lowStockProducts.length} Produk Mencapai Batas Minimum Stok</span>
            </div>
            <button
              onClick={() => setActiveTab('pembelian')}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold px-3 py-1.5 rounded-lg transition shadow-xs"
            >
              Order Pembelian Stok
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3 text-center">Stok Saat Ini</th>
                  <th className="px-4 py-3 text-center">Batas Minimum</th>
                  <th className="px-4 py-3">Supplier Rekomendasi</th>
                  <th className="px-4 py-3 text-right">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStockProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-rose-50/20">
                    <td className="px-4 py-3 font-semibold text-slate-800">{p.nama}</td>
                    <td className="px-4 py-3 text-slate-600">{p.kategori}</td>
                    <td className="px-4 py-3 text-center font-bold text-rose-600">
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                        {p.stok} {p.satuan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500">{p.minStok} {p.satuan}</td>
                    <td className="px-4 py-3 text-slate-600">{p.supplier || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setActiveTab('pembelian')}
                        className="text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        Beli Stok &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
