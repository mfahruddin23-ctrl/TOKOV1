import React from 'react';
import { Store, LogOut, Code, User, Store as StoreIcon, ShieldAlert, Smartphone } from 'lucide-react';
import { Pengguna, StoreSettings } from '../types';

interface NavbarProps {
  currentUser: Pengguna | null;
  settings: StoreSettings;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onOpenLoginModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  settings,
  activeTab,
  setActiveTab,
  onLogout,
  onOpenLoginModal,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Store Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">{settings.namaToko}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  GAS Edition
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">{settings.slogan}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Button to APK / Android */}
            <button
              onClick={() => setActiveTab('apk')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                activeTab === 'apk'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-emerald-300 border-emerald-500/30 hover:bg-slate-700'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pasang APK</span>
              <span className="sm:hidden">APK</span>
            </button>

            {/* Quick Button to GAS Code Studio */}
            <button
              onClick={() => setActiveTab('gas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                activeTab === 'gas'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-amber-300 border-amber-500/30 hover:bg-slate-700'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Kode Apps Script</span>
              <span className="md:hidden">GAS</span>
            </button>

            {/* User Profile / Status */}
            {currentUser ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-700">
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
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                  <User className="w-4 h-4" />
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
