import React from 'react';
import {
  Store,
  LogOut,
  Code,
  User,
  Smartphone,
  Globe,
  FileSpreadsheet,
  Zap,
  HardDrive,
  Menu,
} from 'lucide-react';
import { Pengguna, StoreSettings, DatabaseConfig } from '../types';

interface NavbarProps {
  currentUser: Pengguna | null;
  settings: StoreSettings;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onOpenLoginModal: () => void;
  dbConfig: DatabaseConfig;
  onOpenSyncModal: () => void;
  onOpenMobileDrawer?: () => void;
  onSyncSupabaseRealtime?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  settings,
  activeTab,
  setActiveTab,
  onLogout,
  onOpenLoginModal,
  dbConfig,
  onOpenSyncModal,
  onOpenMobileDrawer,
  onSyncSupabaseRealtime,
}) => {
  // Provider badge configuration
  const getProviderBadge = () => {
    switch (dbConfig.activeProvider) {
      case 'spreadsheet':
        return {
          icon: FileSpreadsheet,
          label: 'Google Sheets',
          mobileLabel: 'Sheets',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30',
          dot: 'bg-emerald-400',
        };
      case 'supabase':
        return {
          icon: Zap,
          label: 'Supabase DB',
          mobileLabel: 'Supabase',
          color: 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30',
          dot: 'bg-blue-400',
        };
      case 'dual':
        return {
          icon: Globe,
          label: 'Dual Cloud Sync',
          mobileLabel: 'Dual Cloud',
          color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30',
          dot: 'bg-indigo-400',
        };
      default:
        return {
          icon: HardDrive,
          label: 'Lokal (Offline)',
          mobileLabel: 'Lokal',
          color: 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700',
          dot: 'bg-amber-400',
        };
    }
  };

  const badge = getProviderBadge();
  const BadgeIcon = badge.icon;

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile Menu Toggle + Logo & Store Info */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {onOpenMobileDrawer && (
              <button
                type="button"
                onClick={onOpenMobileDrawer}
                aria-label="Buka Menu"
                className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
              <Store className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-sm sm:text-lg tracking-tight text-white line-clamp-1">
                  {settings.namaToko}
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  GAS Edition
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-xs">{settings.slogan}</p>
            </div>
          </div>

          {/* Right: Cloud Sync Pill + Quick Buttons + Profile */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Cloud Database Sync Pill Button */}
            <button
              type="button"
              onClick={onOpenSyncModal}
              title="Pengaturan Database Cloud & Multi-Device"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border ${badge.color}`}
            >
              <span className={`w-2 h-2 rounded-full ${badge.dot} animate-pulse`} />
              <BadgeIcon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{badge.label}</span>
              <span className="md:hidden text-[11px]">{badge.mobileLabel}</span>
            </button>

            {/* Quick Supabase Realtime Sync Button */}
            <button
              type="button"
              onClick={onSyncSupabaseRealtime || onOpenSyncModal}
              title="Sinkronkan Isi Data ke Supabase Realtime"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition border border-blue-400/40 bg-blue-600 hover:bg-blue-500 text-white shadow-xs cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span className="hidden sm:inline">Sync Supabase Realtime</span>
              <span className="sm:hidden text-[11px]">Sync Live</span>
            </button>

            {/* Quick Button to APK / Android */}
            <button
              onClick={() => setActiveTab('apk')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                activeTab === 'apk'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-emerald-300 border-emerald-500/30 hover:bg-slate-700'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Pasang APK</span>
            </button>

            {/* Quick Button to GAS Code Studio */}
            <button
              onClick={() => setActiveTab('gas')}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                activeTab === 'gas'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-amber-300 border-amber-500/30 hover:bg-slate-700'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Kode GAS</span>
            </button>

            {/* User Profile / Status */}
            {currentUser ? (
              <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-700">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-white leading-tight">{currentUser.nama}</div>
                  <span
                    className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                      currentUser.role === 'Admin'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {currentUser.role}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold">
                  {currentUser.nama.charAt(0)}
                </div>
                <button
                  onClick={onLogout}
                  title="Ganti Akun / Logout"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
              >
                <User className="w-4 h-4" />
                <span>Masuk</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
