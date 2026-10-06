import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  Users,
  BarChart3,
  Settings,
  ReceiptText,
  Boxes,
  Code2,
  FileSpreadsheet,
} from 'lucide-react';
import { Pengguna } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: Pengguna | null;
  lowStockCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  lowStockCount,
}) => {
  const isAdmin = currentUser?.role === 'Admin';

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      adminOnly: false,
    },
    {
      id: 'pos',
      label: 'Kasir (POS)',
      icon: ShoppingCart,
      badge: 'Kasir',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      adminOnly: false,
    },
    {
      id: 'produk',
      label: 'Kelola Produk',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} menipis` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      adminOnly: false,
    },
    {
      id: 'riwayat',
      label: 'Riwayat Penjualan',
      icon: ReceiptText,
      adminOnly: false,
    },
    {
      id: 'pembelian',
      label: 'Pembelian Stok',
      icon: Boxes,
      adminOnly: true,
    },
    {
      id: 'supplier',
      label: 'Supplier',
      icon: Truck,
      adminOnly: true,
    },
    {
      id: 'pelanggan',
      label: 'Pelanggan',
      icon: Users,
      adminOnly: false,
    },
    {
      id: 'laporan',
      label: 'Laporan Keuangan',
      icon: BarChart3,
      adminOnly: true,
    },
    {
      id: 'gas',
      label: 'Kode Apps Script',
      icon: Code2,
      badge: 'Full Code',
      badgeColor: 'bg-amber-500 text-slate-950 font-bold',
      adminOnly: false,
    },
    {
      id: 'pengaturan',
      label: 'Pengaturan Toko',
      icon: Settings,
      adminOnly: true,
    },
  ];

  return (
    <aside className="w-full lg:w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
      <div className="p-4 border-b border-slate-100 hidden lg:block">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Database: Google Sheets</span>
        </div>
      </div>

      <nav className="p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null;

          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    isActive ? 'bg-white/20 text-white border-white/30' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Role notice footer */}
      <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="text-xs text-slate-500 flex items-center justify-between">
          <span>Mode Hak Akses:</span>
          <span className="font-semibold text-slate-800">{currentUser?.role || 'Guest'}</span>
        </div>
        {!isAdmin && (
          <p className="text-[11px] text-amber-600 mt-1">
            Menu Pembelian, Supplier & Laporan hanya dapat diakses oleh Admin.
          </p>
        )}
      </div>
    </aside>
  );
};
