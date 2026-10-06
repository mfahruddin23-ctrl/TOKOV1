import React, { useState } from 'react';
import { Boxes, Plus, Printer, X, CheckCircle, Truck, Package } from 'lucide-react';
import { Pembelian, Supplier, Produk } from '../types';
import { formatRupiah, formatTanggal } from '../utils/helpers';

interface PembelianViewProps {
  purchases: Pembelian[];
  suppliers: Supplier[];
  products: Produk[];
  onAddPurchase: (purchase: Pembelian) => void;
  onStockIncreased: (productId: string, qty: number, newBuyPrice: number) => void;
}

export const PembelianView: React.FC<PembelianViewProps> = ({
  purchases,
  suppliers,
  products,
  onAddPurchase,
  onStockIncreased,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Produk | null>(products[0] || null);
  const [selectedSupplier, setSelectedSupplier] = useState<string>(suppliers[0]?.nama || '');
  const [qty, setQty] = useState<number>(10);
  const [hargaBeli, setHargaBeli] = useState<number>(selectedProduct?.hargaBeli || 0);
  const [catatan, setCatatan] = useState<string>('');
  const [printedPurchase, setPrintedPurchase] = useState<Pembelian | null>(null);

  const total = qty * hargaBeli;

  const handleProductChange = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      setSelectedProduct(prod);
      setHargaBeli(prod.hargaBeli);
      if (prod.supplier) {
        setSelectedSupplier(prod.supplier);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      alert('Pilih produk terlebih dahulu!');
      return;
    }
    if (qty <= 0) {
      alert('Jumlah barang masuk harus lebih dari 0!');
      return;
    }

    const now = new Date();
    const dateFormatted = now.toISOString().replace('T', ' ').slice(0, 19);
    const datePrefix = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const purchaseId = `PB-${datePrefix}-${randomSuffix}`;

    const newPurchase: Pembelian = {
      id: purchaseId,
      tanggal: dateFormatted,
      supplier: selectedSupplier || 'Supplier Umum',
      barcode: selectedProduct.barcode,
      namaProduk: selectedProduct.nama,
      qty,
      hargaBeli,
      total,
      catatan,
    };

    onAddPurchase(newPurchase);
    onStockIncreased(selectedProduct.id, qty, hargaBeli);

    setIsModalOpen(false);
    setPrintedPurchase(newPurchase);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-indigo-600" />
            <span>Pembelian & Restock Barang</span>
          </h2>
          <p className="text-xs text-slate-500">
            Catat nota pembelian barang masuk dari supplier, stok produk di sheet otomatis bertambah.
          </p>
        </div>

        <button
          onClick={() => {
            if (products[0]) {
              setSelectedProduct(products[0]);
              setHargaBeli(products[0].hargaBeli);
            }
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Pembelian Baru</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="px-4 py-3.5">No Pembelian</th>
                <th className="px-4 py-3.5">Tanggal</th>
                <th className="px-4 py-3.5">Supplier</th>
                <th className="px-4 py-3.5">Produk</th>
                <th className="px-4 py-3.5 text-center">Qty Masuk</th>
                <th className="px-4 py-3.5 text-right">Harga Beli</th>
                <th className="px-4 py-3.5 text-right">Total Tagihan</th>
                <th className="px-4 py-3.5 text-center">Nota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Belum ada riwayat pembelian barang dari supplier.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-600">{p.id}</td>
                    <td className="px-4 py-3 text-slate-500">{formatTanggal(p.tanggal)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{p.supplier}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <div>{p.namaProduk}</div>
                      <span className="font-mono text-[10px] text-slate-400">{p.barcode}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        +{p.qty}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      {formatRupiah(p.hargaBeli)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(p.total)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setPrintedPurchase(p)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition"
                        title="Lihat Nota"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Purchase */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Input Pembelian Barang Masuk</h3>
                <p className="text-xs text-slate-400">Stok produk otomatis bertambah di spreadsheet</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Produk</label>
                <select
                  value={selectedProduct?.id || ''}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {products.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.nama} (Stok saat ini: {prod.stok} {prod.satuan})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier</label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white"
                  required
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.nama}>
                      {s.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Qty Masuk ({selectedProduct?.satuan || 'Unit'})
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga Beli Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={hargaBeli}
                    onChange={(e) => setHargaBeli(Number(e.target.value) || 0)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg font-mono"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex justify-between items-center">
                <span className="text-xs font-semibold text-indigo-700">Total Pembelian:</span>
                <span className="text-base font-extrabold text-indigo-900">{formatRupiah(total)}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Nomor Faktur Supplier (Opsional)
                </label>
                <input
                  type="text"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Contoh: Faktur No. INV-88912"
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Simpan & Tambah Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Purchase Order Modal */}
      {printedPurchase && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Nota Pembelian Masuk</h3>
                <span className="font-mono text-xs text-indigo-600">{printedPurchase.id}</span>
              </div>
              <button onClick={() => setPrintedPurchase(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal:</span>
                <span className="font-medium">{printedPurchase.tanggal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Supplier:</span>
                <span className="font-bold text-slate-800">{printedPurchase.supplier}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="font-semibold text-slate-900">{printedPurchase.namaProduk}</div>
                <div className="flex justify-between text-slate-600">
                  <span>{printedPurchase.qty} unit x {formatRupiah(printedPurchase.hargaBeli)}</span>
                  <span className="font-bold">{formatRupiah(printedPurchase.total)}</span>
                </div>
              </div>
              {printedPurchase.catatan && (
                <div className="text-slate-500 italic text-[11px]">
                  Catatan: {printedPurchase.catatan}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Nota</span>
              </button>
              <button
                onClick={() => setPrintedPurchase(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
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
