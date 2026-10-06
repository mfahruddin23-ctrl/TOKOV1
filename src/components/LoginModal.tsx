import React, { useState } from 'react';
import { Lock, User, ShieldCheck, ShoppingBag, X } from 'lucide-react';
import { Pengguna } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: Pengguna) => void;
  users: Pengguna[];
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  users,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const matched = users.find(
      (u) =>
        u.username.toLowerCase() === username.trim().toLowerCase() &&
        u.password === password.trim()
    );

    if (matched) {
      onLogin(matched);
      onClose();
    } else {
      setError('Username atau password salah! Coba admin / admin123 atau kasir / kasir123');
    }
  };

  const handleQuickSelect = (u: Pengguna) => {
    setUsername(u.username);
    setPassword(u.password || '');
    onLogin(u);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
        <div className="p-6 bg-slate-900 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Masuk Akun Toko</h3>
              <p className="text-xs text-slate-400">Autentikasi Hak Akses Google Apps Script</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin / kasir"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition"
          >
            Masuk Sekarang
          </button>

          {/* Quick Demo Switcher */}
          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-2 text-center">
              Pilih Cepat Akun Demo (1-Klik):
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickSelect(users[0])}
                className="flex items-center gap-2 p-2.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 text-left transition"
              >
                <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold">Admin</div>
                  <div className="text-[10px] text-purple-600">Akses Penuh</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect(users[1])}
                className="flex items-center gap-2 p-2.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 text-left transition"
              >
                <ShoppingBag className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold">Kasir</div>
                  <div className="text-[10px] text-blue-600">POS & Pelanggan</div>
                </div>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
