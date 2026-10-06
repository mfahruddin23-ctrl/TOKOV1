import React, { useState } from 'react';
import { Users, Plus, Edit2, Trash2, X, Phone, MapPin, Award } from 'lucide-react';
import { Pelanggan } from '../types';

interface PelangganViewProps {
  customers: Pelanggan[];
  onAddCustomer: (c: Pelanggan) => void;
  onUpdateCustomer: (c: Pelanggan) => void;
  onDeleteCustomer: (id: string) => void;
}

export const PelangganView: React.FC<PelangganViewProps> = ({
  customers,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Pelanggan | null>(null);

  const [formNama, setFormNama] = useState('');
  const [formTelepon, setFormTelepon] = useState('');
  const [formAlamat, setFormAlamat] = useState('');

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormNama('');
    setFormTelepon('');
    setFormAlamat('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Pelanggan) => {
    setEditingCustomer(c);
    setFormNama(c.nama);
    setFormTelepon(c.telepon);
    setFormAlamat(c.alamat);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim()) return;

    if (editingCustomer) {
      onUpdateCustomer({
        ...editingCustomer,
        nama: formNama.trim(),
        telepon: formTelepon.trim(),
        alamat: formAlamat.trim(),
      });
    } else {
      const nextId = `CUST-${String(customers.length + 1).padStart(3, '0')}`;
      onAddCustomer({
        id: nextId,
        nama: formNama.trim(),
        telepon: formTelepon.trim(),
        alamat: formAlamat.trim(),
        poin: 0,
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (c: Pelanggan) => {
    if (confirm(`Hapus pelanggan "${c.nama}"?`)) {
      onDeleteCustomer(c.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>Data Pelanggan (Member)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Daftar pelanggan toko dan sistem keanggotaan (Sheet Pelanggan).
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pelanggan Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((c) => (
          <div
            key={c.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex justify-between items-start gap-2">
                <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {c.id}
                </span>
                {c.id !== 'CUST-004' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="font-bold text-slate-900 text-sm mt-2">{c.nama}</h3>
              {c.poin !== undefined && c.poin > 0 && (
                <div className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold mt-1">
                  <Award className="w-3.5 h-3.5" />
                  <span>{c.poin} Poin Loyalitas</span>
                </div>
              )}
            </div>

            <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono">{c.telepon || '-'}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{c.alamat || '-'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">
                  {editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
                </h3>
                <p className="text-xs text-slate-400">Sheet: Pelanggan</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Nama Pembeli / Member"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
                <input
                  type="text"
                  value={formTelepon}
                  onChange={(e) => setFormTelepon(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alamat</label>
                <textarea
                  value={formAlamat}
                  onChange={(e) => setFormAlamat(e.target.value)}
                  rows={2}
                  placeholder="Alamat tempat tinggal / warung..."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
