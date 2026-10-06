import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Barcode,
  Printer,
  Download,
  Upload,
  X,
  AlertCircle,
  Eye,
  Filter,
} from 'lucide-react';
import { Produk, Supplier, Pengguna } from '../types';
import { formatRupiah, generateBarcodeSvg } from '../utils/helpers';

interface ProdukViewProps {
  products: Produk[];
  suppliers: Supplier[];
  currentUser: Pengguna | null;
  onAddProduct: (prod: Produk) => void;
  onUpdateProduct: (prod: Produk) => void;
  onDeleteProduct: (id: string) => void;
  onImportProducts: (prods: Produk[]) => void;
}

export const ProdukView: React.FC<ProdukViewProps> = ({
  products,
  suppliers,
  currentUser,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onImportProducts,
}) => {
  const isAdmin = currentUser?.role === 'Admin';

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState<'all' | 'low' | 'out'>('all');

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produk | null>(null);
  const [barcodeModalProduct, setBarcodeModalProduct] = useState<Produk | null>(null);

  // Form State
  const [formId, setFormId] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formKategori, setFormKategori] = useState('Sembako');
  const [formSatuan, setFormSatuan] = useState('Pcs');
  const [formHargaBeli, setFormHargaBeli] = useState<number>(0);
  const [formHargaJual, setFormHargaJual] = useState<number>(0);
  const [formStok, setFormStok] = useState<number>(10);
  const [formMinStok, setFormMinStok] = useState<number>(5);
  const [formSupplier, setFormSupplier] = useState('');
  const [formFoto, setFormFoto] = useState('');

  const categories = Array.from(new Set(products.map((p) => p.kategori).filter(Boolean)));

  // Filter products
  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = p.nama.toLowerCase().includes(q) || p.barcode.includes(q) || p.id.toLowerCase().includes(q);
    const matchCat = !filterCategory || p.kategori === filterCategory;
    const matchStock =
      filterStockStatus === 'all'
        ? true
        : filterStockStatus === 'low'
        ? p.stok <= p.minStok && p.stok > 0
        : p.stok <= 0;
    return matchSearch && matchCat && matchStock;
  });

  const openAddModal = () => {
    setEditingProduct(null);
    const nextNum = products.length + 1;
    const autoId = `PRD-${String(nextNum).padStart(3, '0')}`;
    const autoBarcode = `899${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    setFormId(autoId);
    setFormBarcode(autoBarcode);
    setFormNama('');
    setFormKategori(categories[0] || 'Sembako');
    setFormSatuan('Pcs');
    setFormHargaBeli(0);
    setFormHargaJual(0);
    setFormStok(10);
    setFormMinStok(5);
    setFormSupplier(suppliers[0]?.nama || '');
    setFormFoto('');
    setIsFormOpen(true);
  };

  const openEditModal = (p: Produk) => {
    setEditingProduct(p);
    setFormId(p.id);
    setFormBarcode(p.barcode);
    setFormNama(p.nama);
    setFormKategori(p.kategori);
    setFormSatuan(p.satuan);
    setFormHargaBeli(p.hargaBeli);
    setFormHargaJual(p.hargaJual);
    setFormStok(p.stok);
    setFormMinStok(p.minStok);
    setFormSupplier(p.supplier);
    setFormFoto(p.foto || '');
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim()) {
      alert('Nama produk tidak boleh kosong!');
      return;
    }

    const payload: Produk = {
      id: formId,
      barcode: formBarcode,
      nama: formNama.trim(),
      kategori: formKategori,
      satuan: formSatuan,
      hargaBeli: Number(formHargaBeli) || 0,
      hargaJual: Number(formHargaJual) || 0,
      stok: Number(formStok) || 0,
      minStok: Number(formMinStok) || 0,
      supplier: formSupplier,
      status: 'Aktif',
      foto: formFoto.trim() || undefined,
    };

    if (editingProduct) {
      onUpdateProduct(payload);
    } else {
      onAddProduct(payload);
    }
    setIsFormOpen(false);
  };

  const handleDelete = (p: Produk) => {
    if (confirm(`Apakah Anda yakin ingin menghapus produk "${p.nama}"?`)) {
      onDeleteProduct(p.id);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID Produk', 'Barcode', 'Nama Produk', 'Kategori', 'Satuan', 'Harga Beli', 'Harga Jual', 'Stok', 'Minimum Stok', 'Supplier', 'Status'];
    const rows = products.map((p) => [
      p.id,
      p.barcode,
      `"${p.nama.replace(/"/g, '""')}"`,
      p.kategori,
      p.satuan,
      p.hargaBeli,
      p.hargaJual,
      p.stok,
      p.minStok,
      `"${(p.supplier || '').replace(/"/g, '""')}"`,
      p.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daftar_Produk_Toko_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            <span>Katalog & Inventori Produk</span>
          </h2>
          <p className="text-xs text-slate-500">Kelola master data produk, harga jual, barcode, dan stok minimum.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Daftar</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          {isAdmin && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Produk Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Box */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search text */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama barang, barcode (899...), atau ID produk..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Kategori ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={filterStockStatus}
              onChange={(e) => setFilterStockStatus(e.target.value as 'all' | 'low' | 'out')}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Status Stok</option>
              <option value="low">Stok Menipis (Kritis)</option>
              <option value="out">Stok Habis (0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="px-4 py-3.5">ID / Barcode</th>
                <th className="px-4 py-3.5">Nama Produk</th>
                <th className="px-4 py-3.5">Kategori</th>
                <th className="px-4 py-3.5 text-right">Harga Beli</th>
                <th className="px-4 py-3.5 text-right">Harga Jual</th>
                <th className="px-4 py-3.5 text-center">Stok</th>
                <th className="px-4 py-3.5">Supplier</th>
                <th className="px-4 py-3.5 text-center">Barcode</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Tidak ada produk yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isLow = p.stok <= p.minStok && p.stok > 0;
                  const isOut = p.stok <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-slate-800">{p.id}</span>
                        <div className="font-mono text-[10px] text-slate-400">{p.barcode}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {p.foto && (
                            <img
                              src={p.foto}
                              alt={p.nama}
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                          )}
                          <div>
                            <div className="font-semibold text-slate-900">{p.nama}</div>
                            <span className="text-[10px] text-slate-400">Satuan: {p.satuan}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium">
                          {p.kategori}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        {formatRupiah(p.hargaBeli)}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-blue-600">
                        {formatRupiah(p.hargaJual)}
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            isOut
                              ? 'bg-rose-100 text-rose-700'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.stok} {p.satuan}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-500 max-w-[150px] truncate">
                        {p.supplier || '-'}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setBarcodeModalProduct(p)}
                          title="Generate & Lihat Barcode"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition inline-flex"
                        >
                          <Barcode className="w-4 h-4" />
                        </button>
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {isAdmin ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit Produk"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(p)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Hapus Produk"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">View Only</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">
                  {editingProduct ? 'Edit Data Produk' : 'Tambah Produk Baru'}
                </h3>
                <p className="text-xs text-slate-400">Tersinkron ke Sheet Produk</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ID Produk</label>
                  <input
                    type="text"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Barcode (EAN-13 / Code128)
                  </label>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Produk</label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Beras Pandan Wangi 5 Kg"
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
                  <input
                    type="text"
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value)}
                    placeholder="Sembako, Minuman, Snack, dll"
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    value={formSatuan}
                    onChange={(e) => setFormSatuan(e.target.value)}
                    placeholder="Pcs, Bungkus, Karung, Botol"
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga Beli (HPP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formHargaBeli}
                    onChange={(e) => setFormHargaBeli(Number(e.target.value) || 0)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Jual</label>
                  <input
                    type="number"
                    min="0"
                    value={formHargaJual}
                    onChange={(e) => setFormHargaJual(Number(e.target.value) || 0)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg font-mono font-bold text-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah Stok</label>
                  <input
                    type="number"
                    min="0"
                    value={formStok}
                    onChange={(e) => setFormStok(Number(e.target.value) || 0)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Minimum Stok</label>
                  <input
                    type="number"
                    min="0"
                    value={formMinStok}
                    onChange={(e) => setFormMinStok(Number(e.target.value) || 0)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier</label>
                <select
                  value={formSupplier}
                  onChange={(e) => setFormSupplier(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">Pilih Supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.nama}>
                      {s.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL Foto Produk (Google Drive / Web)
                </label>
                <input
                  type="text"
                  value={formFoto}
                  onChange={(e) => setFormFoto(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  {editingProduct ? 'Simpan Perubahan' : 'Tambahkan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Viewer & Label Printing Modal */}
      {barcodeModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 p-6 text-center space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Label Barcode Produk
              </span>
              <button
                onClick={() => setBarcodeModalProduct(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
              <div className="text-xs font-bold text-slate-900 line-clamp-1">
                {barcodeModalProduct.nama}
              </div>
              <div className="text-sm font-extrabold text-blue-600">
                {formatRupiah(barcodeModalProduct.hargaJual)}
              </div>
              <div
                className="flex justify-center py-2"
                dangerouslySetInnerHTML={{
                  __html: generateBarcodeSvg(barcodeModalProduct.barcode, 45),
                }}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Label Stiker</span>
              </button>
              <button
                onClick={() => setBarcodeModalProduct(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
