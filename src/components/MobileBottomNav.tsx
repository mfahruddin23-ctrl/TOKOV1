import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Globe,
  Menu,
} from 'lucide-react';
import { DatabaseConfig } from '../types';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSyncModal: () => void;
  onOpenMobileDrawer: () => void;
  dbConfig: DatabaseConfig;
  cartCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenSyncModal,
  onOpenMobileDrawer,
  dbConfig,
  cartCount = 0,
}) => {
  // Provider status color
  const isOnlineDb = dbConfig.activeProvider !== 'local';

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1.5 flex items-center justify-around safe-bottom">
      {/* 1. Dashboard */}
      <button
        type="button"
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
          activeTab === 'dashboard' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Beranda</span>
      </button>

      {/* 2. Kasir POS */}
      <button
        type="button"
        onClick={() => setActiveTab('pos')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl relative transition ${
          activeTab === 'pos' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <div className="relative">
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
              {cartCount}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5">Kasir POS</span>
      </button>

      {/* 3. Produk */}
      <button
        type="button"
        onClick={() => setActiveTab('produk')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
          activeTab === 'produk' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <Package className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Produk</span>
      </button>

      {/* 4. Cloud Database Sync Modal Trigger */}
      <button
        type="button"
        onClick={onOpenSyncModal}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-xl transition text-slate-500 hover:text-blue-600 relative"
      >
        <div className="relative">
          <Globe className={`w-5 h-5 ${isOnlineDb ? 'text-indigo-600' : 'text-slate-400'}`} />
          <span
            className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-white ${
              isOnlineDb ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
            }`}
          />
        </div>
        <span className="text-[10px] mt-0.5">Database</span>
      </button>

      {/* 5. Menu Drawer */}
      <button
        type="button"
        onClick={onOpenMobileDrawer}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-xl transition text-slate-500 hover:text-slate-900"
      >
        <Menu className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Menu</span>
      </button>
    </nav>
  );
};
