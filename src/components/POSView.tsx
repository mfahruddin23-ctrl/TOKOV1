import React, { useState, useRef, useEffect } from 'react';
import {
  Scan,
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  QrCode,
  Banknote,
  Printer,
  CheckCircle,
  X,
  User,
  Sparkles,
  Percent,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Produk, Penjualan, PenjualanItem, Pelanggan, StoreSettings, Pengguna } from '../types';
import { formatRupiah, playBeepSound } from '../utils/helpers';

interface POSViewProps {
  products: Produk[];
  customers: Pelanggan[];
  settings: StoreSettings;
  currentUser: Pengguna | null;
  onSaveTransaction: (sale: Penjualan) => void;
  onStockReduced: (reducedItems: { barcode: string; qty: number }[]) => void;
}

export const POSView: React.FC<POSViewProps> = ({
  products,
  customers,
  settings,
  currentUser,
  onSaveTransaction,
  onStockReduced,
}) => {
  // State
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('Pelanggan Umum (Walk-in)');
  const [cart, setCart] = useState<PenjualanItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [taxEnabled, setTaxEnabled] = useState<boolean>(settings.pajakAktif);
  const [mobilePosTab, setMobilePosTab] = useState<'katalog' | 'keranjang'>('katalog');

  // Modal Checkout state
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS' | 'Transfer'>('Tunai');
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [completedSale, setCompletedSale] = useState<Penjualan | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Extract unique categories
  const categories = ['Semua', ...Array.from(new Set(products.map((p) => p.kategori).filter(Boolean)))];

  // Filtered products for shelf
  const filteredProducts = products.filter((p) => {
    if (p.status === 'Nonaktif') return false;
    const matchCat = selectedCategory === 'Semua' || p.kategori === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q || p.nama.toLowerCase().includes(q) || p.barcode.includes(q);
    return matchCat && matchQuery;
  });

  // Calculate totals
  const totalQty = cart.reduce((acc, itm) => acc + itm.qty, 0);
  const subtotal = cart.reduce((acc, itm) => acc + itm.subtotal, 0);
  const afterDiscount = Math.max(0, subtotal - globalDiscount);
  const taxAmount = taxEnabled ? Math.round((afterDiscount * settings.pajakPersen) / 100) : 0;
  const grandTotal = afterDiscount + taxAmount;
  const kembalian = Math.max(0, cashAmount - grandTotal);

  // Add product to cart
  const addToCart = (product: Produk) => {
    if (product.stok <= 0) {
      alert(`Stok produk "${product.nama}" sudah habis!`);
      return;
    }

    playBeepSound('beep');

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.barcode === product.barcode);
      if (existingIndex > -1) {
        const item = prevCart[existingIndex];
        if (item.qty >= product.stok) {
          alert(`Jumlah melebihi stok yang tersedia (${product.stok} ${product.satuan})!`);
          return prevCart;
        }
        const updated = [...prevCart];
        const newQty = item.qty + 1;
        updated[existingIndex] = {
          ...item,
          qty: newQty,
          subtotal: newQty * item.harga - item.diskon,
        };
        return updated;
      } else {
        return [
          ...prevCart,
          {
            barcode: product.barcode,
            nama: product.nama,
            qty: 1,
            harga: product.hargaJual,
            diskon: 0,
            subtotal: product.hargaJual,
            hargaBeli: product.hargaBeli,
          },
        ];
      }
    });
  };

  // Barcode input handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    const matched = products.find((p) => p.barcode === code || p.id.toLowerCase() === code.toLowerCase());
    if (matched) {
      addToCart(matched);
      setBarcodeInput('');
    } else {
      alert(`Produk dengan Barcode/ID "${code}" tidak ditemukan!`);
    }
  };

  // Modify item quantity
  const updateQty = (barcode: string, delta: number) => {
    const product = products.find((p) => p.barcode === barcode);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.barcode === barcode) {
            const nextQty = item.qty + delta;
            if (nextQty <= 0) return null;
            if (product && nextQty > product.stok) {
              alert(`Jumlah melebihi stok tersedia (${product.stok})!`);
              return item;
            }
            return {
              ...item,
              qty: nextQty,
              subtotal: nextQty * item.harga - item.diskon,
            };
          }
          return item;
        })
        .filter(Boolean) as PenjualanItem[]
    );
  };

  const removeItem = (barcode: string) => {
    setCart((prev) => prev.filter((item) => item.barcode !== barcode));
  };

  // Open checkout
  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      alert('Keranjang belanja masih kosong!');
      return;
    }
    setCashAmount(grandTotal);
    setIsCheckoutModalOpen(true);
  };

  // Process and finalize payment
  const handleFinalizeTransaction = () => {
    if (paymentMethod === 'Tunai' && cashAmount < grandTotal) {
      alert(`Uang pembayaran kurang! Dibutuhkan minimal ${formatRupiah(grandTotal)}`);
      return;
    }

    const now = new Date();
    const dateFormatted = now.toISOString().replace('T', ' ').slice(0, 19);
    const datePrefix = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const trxId = `TRX-${datePrefix}-${randomSuffix}`;

    const newSale: Penjualan = {
      id: trxId,
      tanggal: dateFormatted,
      items: cart,
      totalQty,
      subtotal,
      diskonTotal: globalDiscount,
      pajak: taxAmount,
      totalBayar: grandTotal,
      jumlahUang: paymentMethod === 'Tunai' ? cashAmount : grandTotal,
      kembalian: paymentMethod === 'Tunai' ? kembalian : 0,
      kasir: currentUser?.nama || 'Kasir',
      pelanggan: selectedCustomer,
      metodePembayaran: paymentMethod,
    };

    // Save and reduce stocks
    onSaveTransaction(newSale);
    onStockReduced(cart.map((item) => ({ barcode: item.barcode, qty: item.qty })));

    // Audio & Confetti
    playBeepSound('cash');
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    setCompletedSale(newSale);
    setCart([]);
    setGlobalDiscount(0);
    setIsCheckoutModalOpen(false);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Bar: Barcode Scanning & Quick Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleBarcodeSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Scan className="w-5 h-5 text-blue-600 absolute left-3.5 top-3" />
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan Barcode (Tekan Enter)... atau ketik kode 899..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0"
          >
            <span>Scan Masuk</span>
          </button>
        </form>

        {/* Customer Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <User className="w-4 h-4 text-slate-400" />
            <span>Pelanggan:</span>
          </div>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="py-2 px-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.nama}>
                {c.nama}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile Segmented Switcher (< lg) */}
      <div className="lg:hidden flex bg-slate-200/90 p-1 rounded-2xl gap-1">
        <button
          type="button"
          onClick={() => setMobilePosTab('katalog')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            mobilePosTab === 'katalog' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          <span>Katalog Produk ({filteredProducts.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobilePosTab('keranjang')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 relative ${
            mobilePosTab === 'keranjang' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Keranjang ({totalQty})</span>
          {totalQty > 0 && (
            <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5">
              {formatRupiah(grandTotal)}
            </span>
          )}
        </button>
      </div>

      {/* Main Split: Catalog Products (Left) & Cart Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Grid */}
        <div
          className={`lg:col-span-7 xl:col-span-8 space-y-3 ${
            mobilePosTab === 'katalog' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Category Chips and Live Search */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama produk..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[620px] overflow-y-auto p-1">
            {filteredProducts.map((p) => {
              const isLow = p.stok <= p.minStok;
              const isOut = p.stok <= 0;

              return (
                <button
                  key={p.id}
                  disabled={isOut}
                  onClick={() => addToCart(p)}
                  className={`flex flex-col text-left p-3 rounded-2xl border transition relative group ${
                    isOut
                      ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                      : 'bg-white border-slate-200/90 hover:border-blue-500 hover:shadow-md cursor-pointer'
                  }`}
                >
                  {/* Photo or Placeholder */}
                  <div className="w-full h-24 rounded-xl bg-slate-100 overflow-hidden mb-2.5 relative">
                    {p.foto ? (
                      <img src={p.foto} alt={p.nama} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-xs uppercase">
                        {p.kategori}
                      </div>
                    )}
                    <span
                      className={`absolute top-1.5 right-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isOut
                          ? 'bg-red-600 text-white'
                          : isLow
                          ? 'bg-amber-500 text-slate-950 font-extrabold'
                          : 'bg-slate-900/70 text-white'
                      }`}
                    >
                      {p.stok} {p.satuan}
                    </span>
                  </div>

                  <div className="font-semibold text-xs text-slate-800 line-clamp-2 leading-snug flex-1">
                    {p.nama}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">{p.barcode}</div>

                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100">
                    <span className="font-extrabold text-sm text-blue-600">{formatRupiah(p.hargaJual)}</span>
                    <span className="w-6 h-6 rounded-lg bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center transition">
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Checkout Cart Summary */}
        <div
          className={`lg:col-span-5 xl:col-span-4 sticky top-20 ${
            mobilePosTab === 'keranjang' ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {/* Cart Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Keranjang Kasir</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                  {totalQty} item
                </span>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-xs text-red-400 hover:text-red-300 underline"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Cart Item List */}
            <div className="p-3 max-h-[340px] overflow-y-auto space-y-2.5 divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <ShoppingCart className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                  <p className="text-xs">Keranjang kosong. Scan barcode atau klik produk di katalog.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.barcode} className="pt-2.5 first:pt-0 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-slate-800 truncate">{item.nama}</h4>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {formatRupiah(item.harga)}
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                      <button
                        onClick={() => updateQty(item.barcode, -1)}
                        className="w-5 h-5 rounded flex items-center justify-center bg-white text-slate-700 hover:bg-slate-200 shadow-xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center font-bold text-xs font-mono">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.barcode, 1)}
                        className="w-5 h-5 rounded flex items-center justify-center bg-white text-slate-700 hover:bg-slate-200 shadow-xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right shrink-0 w-20">
                      <div className="text-xs font-bold text-slate-900">{formatRupiah(item.subtotal)}</div>
                      <button
                        onClick={() => removeItem(item.barcode)}
                        className="text-[10px] text-red-500 hover:text-red-700"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculation Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({totalQty} item):</span>
                <span className="font-semibold text-slate-900">{formatRupiah(subtotal)}</span>
              </div>

              {/* Discount Input */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-slate-600">
                  <Percent className="w-3.5 h-3.5 text-slate-400" />
                  <span>Potongan Diskon:</span>
                </div>
                <div className="flex items-center gap-1 w-28">
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={globalDiscount || ''}
                    placeholder="0"
                    onChange={(e) => setGlobalDiscount(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-2 py-1 text-right border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Tax Toggle */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
                  <input
                    type="checkbox"
                    checked={taxEnabled}
                    onChange={(e) => setTaxEnabled(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>PPN ({settings.pajakPersen}%):</span>
                </label>
                <span className="font-semibold text-slate-900">{formatRupiah(taxAmount)}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <span className="font-bold text-slate-800 text-sm">TOTAL BAYAR:</span>
                <span className="font-extrabold text-xl text-blue-600">{formatRupiah(grandTotal)}</span>
              </div>

              {/* Checkout Button */}
              <button
                disabled={cart.length === 0}
                onClick={handleOpenCheckout}
                className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-md ${
                  cart.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span>BAYAR SEKARANG ({formatRupiah(grandTotal)})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Mobile Cart Summary Bar (When in Katalog mode and cart has items) */}
      {totalQty > 0 && mobilePosTab === 'katalog' && (
        <div className="lg:hidden fixed bottom-16 left-3 right-3 z-30 animate-in slide-in-from-bottom-2 duration-150">
          <button
            type="button"
            onClick={() => setMobilePosTab('keranjang')}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">
                {totalQty}
              </div>
              <div className="text-left">
                <span className="text-[10px] text-slate-400 block uppercase font-bold leading-none">
                  Keranjang Kasir
                </span>
                <span className="text-sm font-extrabold text-emerald-400">
                  {formatRupiah(grandTotal)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl transition">
              <span>Buka & Bayar</span>
              <span>&rarr;</span>
            </div>
          </button>
        </div>
      )}

      {/* Checkout Payment Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Pilih Metode Pembayaran</h3>
                <p className="text-xs text-slate-400">Kasir: {currentUser?.nama}</p>
              </div>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Grand Total Highlight */}
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center">
                <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider">
                  Total Tagihan Belanja
                </span>
                <div className="text-3xl font-extrabold text-blue-900 mt-0.5">
                  {formatRupiah(grandTotal)}
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Tunai')}
                    className={`p-3 rounded-xl border text-center font-bold text-xs flex flex-col items-center gap-1.5 transition ${
                      paymentMethod === 'Tunai'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                    <span>TUNAI (CASH)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('QRIS')}
                    className={`p-3 rounded-xl border text-center font-bold text-xs flex flex-col items-center gap-1.5 transition ${
                      paymentMethod === 'QRIS'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <QrCode className="w-5 h-5" />
                    <span>QRIS DINAMIS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Transfer')}
                    className={`p-3 rounded-xl border text-center font-bold text-xs flex flex-col items-center gap-1.5 transition ${
                      paymentMethod === 'Transfer'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>TRANSFER BANK</span>
                  </button>
                </div>
              </div>

              {/* Conditional Payment UI */}
              {paymentMethod === 'Tunai' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Jumlah Uang Diterima
                    </label>
                    <input
                      type="number"
                      value={cashAmount || ''}
                      onChange={(e) => setCashAmount(Number(e.target.value) || 0)}
                      className="w-full p-2.5 text-base font-bold text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Quick Cash Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCashAmount(grandTotal)}
                      className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold text-slate-700"
                    >
                      Uang Pas
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashAmount(50000)}
                      className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold text-slate-700"
                    >
                      50.000
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashAmount(100000)}
                      className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold text-slate-700"
                    >
                      100.000
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashAmount(200000)}
                      className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold text-slate-700"
                    >
                      200.000
                    </button>
                  </div>

                  {/* Kembalian */}
                  <div className="p-3 bg-slate-100 rounded-xl flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-600">Uang Kembalian:</span>
                    <span
                      className={`text-base font-extrabold ${
                        kembalian >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {formatRupiah(kembalian)}
                    </span>
                  </div>
                </div>
              )}

              {paymentMethod === 'QRIS' && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
                  <div className="w-40 h-40 mx-auto bg-white p-2 border border-slate-200 rounded-xl flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=QRIS_NMID_TOKO_${grandTotal}`}
                      alt="QRIS Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-xs text-slate-500">
                    Scan QRIS dengan aplikasi Gopay, OVO, Dana, BCA Mobile, atau ShopeePay.
                  </div>
                </div>
              )}

              {paymentMethod === 'Transfer' && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="font-semibold text-slate-800">Rekening Tujuan Pembayaran:</div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bank:</span>
                      <span className="font-bold">BCA (Bank Central Asia)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">No. Rekening:</span>
                      <span className="font-mono font-bold text-blue-600">880-123-4567</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Atas Nama:</span>
                      <span className="font-semibold">Toko Berkah Mandiri</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm Pay Button */}
              <button
                type="button"
                onClick={handleFinalizeTransaction}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-600/20"
              >
                PROSES SELESAIKAN TRANSAKSI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal (Struk Kasir Thermal) */}
      {completedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <span className="font-bold text-sm flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Transaksi Berhasil!
              </span>
              <button
                onClick={() => setCompletedSale(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal Receipt Paper Layout */}
            <div className="p-5 font-mono text-xs bg-amber-50/40 text-slate-800 space-y-3" id="printReceiptArea">
              {/* Header */}
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                <h2 className="font-extrabold text-sm tracking-tight text-slate-900">{settings.namaToko}</h2>
                <p className="text-[10px] text-slate-600">{settings.alamat}</p>
                <p className="text-[10px] text-slate-600">Telp: {settings.telepon}</p>
              </div>

              {/* Meta info */}
              <div className="text-[11px] space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                <div className="flex justify-between">
                  <span>No: {completedSale.id}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tgl: {completedSale.tanggal}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Kasir: {completedSale.kasir}</span>
                  <span>Cust: {completedSale.pelanggan}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-2">
                {completedSale.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="font-semibold text-slate-900 truncate">{item.nama}</div>
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>
                        {item.qty} x {formatRupiah(item.harga)}
                      </span>
                      <span className="font-bold text-slate-900">{formatRupiah(item.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Calculation */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatRupiah(completedSale.subtotal)}</span>
                </div>
                {completedSale.diskonTotal > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Diskon:</span>
                    <span>-{formatRupiah(completedSale.diskonTotal)}</span>
                  </div>
                )}
                {completedSale.pajak > 0 && (
                  <div className="flex justify-between">
                    <span>PPN:</span>
                    <span>{formatRupiah(completedSale.pajak)}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-1 border-t border-slate-300">
                  <span>TOTAL:</span>
                  <span>{formatRupiah(completedSale.totalBayar)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bayar ({completedSale.metodePembayaran}):</span>
                  <span>{formatRupiah(completedSale.jumlahUang)}</span>
                </div>
                {completedSale.kembalian > 0 && (
                  <div className="flex justify-between font-bold text-emerald-700">
                    <span>Kembali:</span>
                    <span>{formatRupiah(completedSale.kembalian)}</span>
                  </div>
                )}
              </div>

              {/* Receipt Footer Message */}
              <div className="text-center text-[10px] text-slate-500 pt-1 whitespace-pre-line leading-tight">
                {settings.pesanStruk}
              </div>
            </div>

            {/* Print & Close Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
              <button
                onClick={handlePrintReceipt}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Struk Kasir</span>
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition"
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
