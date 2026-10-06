import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  KeyRound,
  ShieldCheck,
  ShoppingBag,
  X,
  Check,
  AlertTriangle,
  Lock,
  User,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Pengguna } from '../types';

interface UserManagementViewProps {
  users: Pengguna[];
  currentUser: Pengguna | null;
  onAddUser: (user: Pengguna) => void;
  onUpdateUser: (user: Pengguna) => void;
  onChangePassword: (username: string, newPass: string) => void;
  onDeleteUser: (username: string) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onChangePassword,
  onDeleteUser,
}) => {
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Pengguna | null>(null);
  const [passwordModalUser, setPasswordModalUser] = useState<Pengguna | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<Pengguna | null>(null);

  // Form states for Add / Edit
  const [formUsername, setFormUsername] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formRole, setFormRole] = useState<'Admin' | 'Kasir'>('Kasir');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form state for Change Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormUsername('');
    setFormNama('');
    setFormRole('Kasir');
    setFormPassword('');
    setShowPassword(false);
    setErrorMsg('');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (u: Pengguna) => {
    setEditingUser(u);
    setFormUsername(u.username);
    setFormNama(u.nama);
    setFormRole(u.role);
    setErrorMsg('');
  };

  // Open Change Password Modal
  const handleOpenPassword = (u: Pengguna) => {
    setPasswordModalUser(u);
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setErrorMsg('');
  };

  // Submit Add
  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = formUsername.trim().toLowerCase();
    if (!cleanUser || !formNama.trim() || !formPassword.trim()) {
      setErrorMsg('Semua kolom wajib diisi!');
      return;
    }

    // Check duplicate username
    if (users.some((u) => u.username.toLowerCase() === cleanUser)) {
      setErrorMsg(`Username "${cleanUser}" sudah digunakan! Gunakan username lain.`);
      return;
    }

    onAddUser({
      username: cleanUser,
      nama: formNama.trim(),
      role: formRole,
      password: formPassword.trim(),
    });

    setIsAddModalOpen(false);
  };

  // Submit Edit
  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!formNama.trim()) {
      setErrorMsg('Nama lengkap tidak boleh kosong!');
      return;
    }

    onUpdateUser({
      ...editingUser,
      nama: formNama.trim(),
      role: formRole,
    });

    setEditingUser(null);
  };

  // Submit Change Password
  const handleSubmitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser) return;

    if (!newPassword.trim()) {
      setErrorMsg('Password baru tidak boleh kosong!');
      return;
    }

    if (newPassword.length < 4) {
      setErrorMsg('Password minimal 4 karakter!');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok!');
      return;
    }

    onChangePassword(passwordModalUser.username, newPassword.trim());
    setPasswordModalUser(null);
  };

  // Handle Delete
  const handleExecuteDelete = () => {
    if (!deleteConfirmUser) return;

    if (deleteConfirmUser.username === currentUser?.username) {
      alert('Anda tidak dapat menghapus akun yang sedang Anda gunakan untuk login!');
      setDeleteConfirmUser(null);
      return;
    }

    const adminCount = users.filter((u) => u.role === 'Admin').length;
    if (deleteConfirmUser.role === 'Admin' && adminCount <= 1) {
      alert('Tidak dapat menghapus Admin terakhir! Sistem harus memiliki minimal satu Admin.');
      setDeleteConfirmUser(null);
      return;
    }

    onDeleteUser(deleteConfirmUser.username);
    setDeleteConfirmUser(null);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800">
              Hak Akses & Pengguna
            </span>
            <span className="text-xs text-slate-400">Sheet: Pengguna</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 mt-1">
            <Users className="w-6 h-6 text-purple-600" />
            <span>Manajemen Pengguna & Hak Akses</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola akun kasir dan administrator, ubah nama profil, sesuaikan hak akses role, serta perbarui password login.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Role Information Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl flex items-start gap-3">
          <div className="p-2 rounded-xl bg-purple-100 text-purple-700 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-purple-900">Hak Akses: Administrator</h4>
            <p className="text-purple-800/80 leading-relaxed">
              Memiliki akses ke seluruh menu sistem (Dashboard, Kasir POS, Produk, Pembelian Stok, Supplier, Pelanggan, Laporan Keuangan, Kode GAS, dan Pengaturan).
            </p>
          </div>
        </div>

        <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start gap-3">
          <div className="p-2 rounded-xl bg-blue-100 text-blue-700 shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-blue-900">Hak Akses: Kasir</h4>
            <p className="text-blue-800/80 leading-relaxed">
              Fokus pada operasional penjualan kasir harian (Dashboard, Kasir POS, Melihat Katalog Produk, dan Manajemen Data Pelanggan/Member).
            </p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700">Daftar Akun Terdaftar ({users.length} Akun)</span>
          <span className="text-slate-400">Sinkron ke Sheet Pengguna</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="px-4 py-3.5">Username</th>
                <th className="px-4 py-3.5">Nama Lengkap</th>
                <th className="px-4 py-3.5">Hak Akses (Role)</th>
                <th className="px-4 py-3.5 text-center">Status Sesi</th>
                <th className="px-4 py-3.5 text-right">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isCurrent = u.username.toLowerCase() === currentUser?.username.toLowerCase();

                return (
                  <tr key={u.username} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-mono font-bold text-xs uppercase">
                          {u.username.slice(0, 2)}
                        </div>
                        <div>
                          <span className="font-mono font-bold text-slate-900">{u.username}</span>
                          {isCurrent && (
                            <span className="ml-1.5 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                              Anda
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-medium text-slate-800">{u.nama}</td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                          u.role === 'Admin'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {u.role === 'Admin' ? (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        ) : (
                          <ShoppingBag className="w-3.5 h-3.5" />
                        )}
                        <span>{u.role}</span>
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Aktif</span>
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Role & Name */}
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                          title="Edit Nama & Hak Akses"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Edit</span>
                        </button>

                        {/* Change Password */}
                        <button
                          onClick={() => handleOpenPassword(u)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                          title="Ganti Password Login"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                          <span>Password</span>
                        </button>

                        {/* Delete User */}
                        <button
                          disabled={isCurrent}
                          onClick={() => setDeleteConfirmUser(u)}
                          className={`p-1.5 rounded-lg transition ${
                            isCurrent
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-rose-600 hover:bg-rose-50'
                          }`}
                          title={isCurrent ? 'Tidak dapat menghapus akun sendiri' : 'Hapus Pengguna'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: TAMBAH PENGGUNA BARU */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-purple-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="font-bold text-base">Tambah Pengguna Baru</h3>
                  <p className="text-[11px] text-purple-200">Buat akun untuk kasir atau administrator</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-purple-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username Login</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="contoh: kasir2 / kasir_budi"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Nama karyawan / petugas kasir"
                  className="w-full p-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hak Akses (Role)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormRole('Kasir')}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-2 ${
                      formRole === 'Kasir'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 text-blue-600" />
                    <div>
                      <div>Kasir</div>
                      <div className="text-[10px] text-slate-400 font-normal">POS & Pelanggan</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormRole('Admin')}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-2 ${
                      formRole === 'Admin'
                        ? 'bg-purple-50 border-purple-500 text-purple-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <div>
                      <div>Admin</div>
                      <div className="text-[10px] text-slate-400 font-normal">Semua Menu</div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password Awal</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Password login"
                    className="w-full pl-9 pr-9 py-2 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT NAMA USER & HAK AKSES */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">Edit Profil & Hak Akses</h3>
                <p className="text-[11px] text-slate-400 font-mono">Username: {editingUser.username}</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hak Akses (Role)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormRole('Kasir')}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-2 ${
                      formRole === 'Kasir'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 text-blue-600" />
                    <div>
                      <div>Kasir</div>
                      <div className="text-[10px] text-slate-400 font-normal">POS & Pelanggan</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormRole('Admin')}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-2 ${
                      formRole === 'Admin'
                        ? 'bg-purple-50 border-purple-500 text-purple-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <div>
                      <div>Admin</div>
                      <div className="text-[10px] text-slate-400 font-normal">Semua Menu</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: GANTI PASSWORD PENGGUNA */}
      {/* ========================================================================= */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-amber-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-200" />
                <div>
                  <h3 className="font-bold text-base">Ganti Password Login</h3>
                  <p className="text-[11px] text-amber-100">User: {passwordModalUser.nama} ({passwordModalUser.username})</p>
                </div>
              </div>
              <button onClick={() => setPasswordModalUser(null)} className="text-amber-100 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPassword} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password Baru</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan password baru"
                    className="w-full pl-9 pr-9 py-2 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ulangi Password Baru</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang password baru"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                Password baru akan langsung aktif dan tersimpan ke Sheet <strong>Pengguna</strong>.
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Perbarui Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: KONFIRMASI HAPUS PENGGUNA */}
      {/* ========================================================================= */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-rose-200 animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-rose-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-200" />
                <h3 className="font-bold text-base">Hapus Pengguna?</h3>
              </div>
              <button onClick={() => setDeleteConfirmUser(null)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-700 leading-relaxed">
                Apakah Anda yakin ingin menghapus pengguna{' '}
                <strong>
                  {deleteConfirmUser.nama} ({deleteConfirmUser.username})
                </strong>
                ? Akun ini tidak akan dapat login lagi ke sistem kasir.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmUser(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Ya, Hapus Pengguna
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
