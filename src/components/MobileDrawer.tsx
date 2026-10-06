import React from 'react';
import {
  X,
  LayoutDashboard,
  ShoppingCart,
  Package,
  ReceiptText,
  Boxes,
  Truck,
  Users,
  BarChart3,
  UserCog,
  Smartphone,
  Code2,
  Settings,
  Globe,
  LogOut,
  User,
  Store,
} from 'lucide-react';
import { Pengguna, StoreSettings, DatabaseConfig } from '../types';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: Pengguna | null;
  settings: StoreSettings;
  dbConfig: DatabaseConfig;
  onOpenSyncModal: () => void;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  lowStockCount: number;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  currentUser,
  settings,
  dbConfig,
  onOpenSyncModal,
  onOpenLoginModal,
  onLogout,
  lowStockCount,
}) => {
  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'Admin';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
    { id: 'pos', label: 'Kasir (POS)', icon: ShoppingCart, badge: 'Kasir', adminOnly: false },
    {
      id: 'produk',
      label: 'Kelola Produk',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} menipis` : undefined,
      adminOnly: false,
    },
    { id: 'riwayat', label: 'Riwayat Penjualan', icon: ReceiptText, adminOnly: false },
    { id: 'pembelian', label: 'Pembelian Stok', icon: Boxes, adminOnly: true },
    { id: 'supplier', label: 'Supplier', icon: Truck, adminOnly: true },
    { id: 'pelanggan', label: 'Pelanggan', icon: Users, adminOnly: false },
    { id: 'laporan', label: 'Laporan Keuangan', icon: BarChart3, adminOnly: true },
    { id: 'users', label: 'Manajemen Pengguna', icon: UserCog, badge: 'User', adminOnly: true },
    { id: 'apk', label: 'Aplikasi HP & APK', icon: Smartphone, badge: 'Android', adminOnly: false },
    { id: 'gas', label: 'Kode Apps Script', icon: Code2, badge: 'GAS', adminOnly: false },
    { id: 'pengaturan', label: 'Pengaturan Toko', icon: Settings, adminOnly: true },
  ];

  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Content */}
      <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm leading-tight">{settings.namaToko}</div>
              <div className="text-[10px] text-slate-400">Navigasi Seluler</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Database Status Button Banner */}
        <div className="p-3 bg-slate-50 border-b border-slate-200">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSyncModal();
            }}
            className="w-full p-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between text-left hover:border-blue-400 transition"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <div>
                <span className="text-xs font-bold text-slate-900 block leading-tight">Database Multi-Device</span>
                <span className="text-[10px] text-slate-500 capitalize">
                  Mode: <strong className="text-blue-700">{dbConfig.activeProvider}</strong>
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-600 text-white shadow-xs">
              Atur
            </span>
          </button>
        </div>

        {/* Nav list */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {menuItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User profile footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200">
          {currentUser ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                  {currentUser.nama.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 leading-tight">{currentUser.nama}</div>
                  <div className="text-[10px] text-slate-500">{currentUser.role}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                title="Ganti Akun"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLoginModal();
              }}
              className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <User className="w-4 h-4" />
              <span>Masuk Akun</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
