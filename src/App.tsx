/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { POSView } from './components/POSView';
import { ProdukView } from './components/ProdukView';
import { RiwayatPenjualanView } from './components/RiwayatPenjualanView';
import { PembelianView } from './components/PembelianView';
import { SupplierView } from './components/SupplierView';
import { PelangganView } from './components/PelangganView';
import { LaporanView } from './components/LaporanView';
import { GasCodeStudioView } from './components/GasCodeStudioView';
import { SettingsView } from './components/SettingsView';
import { LoginModal } from './components/LoginModal';

import {
  Produk,
  Penjualan,
  Pembelian,
  Supplier,
  Pelanggan,
  Pengguna,
  StoreSettings,
} from './types';
import {
  loadStoredProducts,
  saveStoredProducts,
  loadStoredSales,
  saveStoredSales,
  loadStoredPurchases,
  saveStoredPurchases,
  loadStoredSuppliers,
  saveStoredSuppliers,
  loadStoredCustomers,
  saveStoredCustomers,
  loadStoredUsers,
  saveStoredUsers,
  loadStoredSettings,
  saveStoredSettings,
  loadCurrentUser,
  saveCurrentUser,
  resetAllDataToDefault,
  clearStoredSales,
  clearStoredPurchases,
  clearStoredAllTransactions,
} from './utils/storage';

export default function App() {
  // Global Data State
  const [products, setProducts] = useState<Produk[]>(() => loadStoredProducts());
  const [sales, setSales] = useState<Penjualan[]>(() => loadStoredSales());
  const [purchases, setPurchases] = useState<Pembelian[]>(() => loadStoredPurchases());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadStoredSuppliers());
  const [customers, setCustomers] = useState<Pelanggan[]>(() => loadStoredCustomers());
  const [users, setUsers] = useState<Pengguna[]>(() => loadStoredUsers());
  const [settings, setSettings] = useState<StoreSettings>(() => loadStoredSettings());
  const [currentUser, setCurrentUser] = useState<Pengguna | null>(() => loadCurrentUser());

  // UI Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    saveStoredProducts(products);
  }, [products]);

  useEffect(() => {
    saveStoredSales(sales);
  }, [sales]);

  useEffect(() => {
    saveStoredPurchases(purchases);
  }, [purchases]);

  useEffect(() => {
    saveStoredSuppliers(suppliers);
  }, [suppliers]);

  useEffect(() => {
    saveStoredCustomers(customers);
  }, [customers]);

  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveCurrentUser(currentUser);
  }, [currentUser]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Stock operations
  const handleStockReduced = (reducedItems: { barcode: string; qty: number }[]) => {
    setProducts((prev) =>
      prev.map((p) => {
        const found = reducedItems.find((itm) => itm.barcode === p.barcode);
        if (found) {
          return {
            ...p,
            stok: Math.max(0, p.stok - found.qty),
          };
        }
        return p;
      })
    );
  };

  const handleStockIncreased = (productId: string, qty: number, newBuyPrice: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId || p.barcode === productId) {
          return {
            ...p,
            stok: p.stok + qty,
            hargaBeli: newBuyPrice > 0 ? newBuyPrice : p.hargaBeli,
          };
        }
        return p;
      })
    );
    showToast(`Stok produk berhasil ditambah sejumlah ${qty}!`);
  };

  // Sales
  const handleSaveTransaction = (sale: Penjualan) => {
    setSales((prev) => [sale, ...prev]);
    showToast(`Transaksi ${sale.id} berhasil disimpan ke Spreadsheet!`);
  };

  // Purchases
  const handleAddPurchase = (purchase: Pembelian) => {
    setPurchases((prev) => [purchase, ...prev]);
  };

  // Product CRUD
  const handleAddProduct = (prod: Produk) => {
    setProducts((prev) => [prod, ...prev]);
    showToast(`Produk "${prod.nama}" berhasil ditambahkan!`);
  };

  const handleUpdateProduct = (prod: Produk) => {
    setProducts((prev) => prev.map((p) => (p.id === prod.id ? prod : p)));
    showToast(`Produk "${prod.nama}" berhasil diperbarui!`);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('Produk berhasil dihapus!');
  };

  const handleImportProducts = (prods: Produk[]) => {
    setProducts(prods);
    showToast(`Berhasil mengimpor ${prods.length} produk!`);
  };

  // Supplier CRUD
  const handleAddSupplier = (s: Supplier) => {
    setSuppliers((prev) => [...prev, s]);
    showToast(`Supplier "${s.nama}" berhasil ditambahkan!`);
  };

  const handleUpdateSupplier = (s: Supplier) => {
    setSuppliers((prev) => prev.map((item) => (item.id === s.id ? s : item)));
    showToast(`Supplier "${s.nama}" diperbarui!`);
  };

  const handleDeleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((item) => item.id !== id));
    showToast('Supplier berhasil dihapus!');
  };

  // Customer CRUD
  const handleAddCustomer = (c: Pelanggan) => {
    setCustomers((prev) => [...prev, c]);
    showToast(`Pelanggan "${c.nama}" berhasil ditambahkan!`);
  };

  const handleUpdateCustomer = (c: Pelanggan) => {
    setCustomers((prev) => prev.map((item) => (item.id === c.id ? c : item)));
    showToast(`Pelanggan "${c.nama}" diperbarui!`);
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((item) => item.id !== id));
    showToast('Pelanggan berhasil dihapus!');
  };

  // Settings & Backups
  const handleSaveSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    showToast('Pengaturan toko berhasil disimpan!');
  };

  const handleResetData = () => {
    resetAllDataToDefault();
    setProducts(loadStoredProducts());
    setSales(loadStoredSales());
    setPurchases(loadStoredPurchases());
    setSuppliers(loadStoredSuppliers());
    setCustomers(loadStoredCustomers());
    setSettings(loadStoredSettings());
    setCurrentUser(loadCurrentUser());
    showToast('Data toko telah direset ke data contoh bawaan.');
  };

  const handleExportAllData = () => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      products,
      sales,
      purchases,
      suppliers,
      customers,
      settings,
    };
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', jsonStr);
    dl.setAttribute('download', `Backup_TokoApp_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(dl);
    dl.click();
    document.body.removeChild(dl);
    showToast('Cadangan data JSON berhasil diunduh!');
  };

  const handleImportAllData = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.products) setProducts(data.products);
      if (data.sales) setSales(data.sales);
      if (data.purchases) setPurchases(data.purchases);
      if (data.suppliers) setSuppliers(data.suppliers);
      if (data.customers) setCustomers(data.customers);
      if (data.settings) setSettings(data.settings);
      showToast('Cadangan data berhasil dipulihkan!');
    } catch {
      alert('File JSON tidak valid atau rusak!');
    }
  };

  // Clear transaction data handlers
  const handleClearSales = () => {
    setSales([]);
    clearStoredSales();
    showToast('Data riwayat transaksi penjualan berhasil dikosongkan!');
  };

  const handleClearPurchases = () => {
    setPurchases([]);
    clearStoredPurchases();
    showToast('Data riwayat pembelian supplier berhasil dikosongkan!');
  };

  const handleClearAllTransactions = () => {
    setSales([]);
    setPurchases([]);
    clearStoredAllTransactions();
    showToast('Seluruh data transaksi (Penjualan & Pembelian) berhasil dikosongkan!');
  };

  // Low stock counter
  const lowStockCount = products.filter((p) => p.stok <= p.minStok).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        settings={settings}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={() => setIsLoginModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
      />

      {/* Main Body */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          lowStockCount={lowStockCount}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              products={products}
              sales={sales}
              purchases={purchases}
              setActiveTab={setActiveTab}
              onOpenAddProduct={() => setActiveTab('produk')}
            />
          )}

          {activeTab === 'pos' && (
            <POSView
              products={products}
              customers={customers}
              settings={settings}
              currentUser={currentUser}
              onSaveTransaction={handleSaveTransaction}
              onStockReduced={handleStockReduced}
            />
          )}

          {activeTab === 'produk' && (
            <ProdukView
              products={products}
              suppliers={suppliers}
              currentUser={currentUser}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onImportProducts={handleImportProducts}
            />
          )}

          {activeTab === 'riwayat' && (
            <RiwayatPenjualanView
              sales={sales}
              settings={settings}
              currentUser={currentUser}
              onClearSales={handleClearSales}
            />
          )}

          {activeTab === 'pembelian' && (
            <PembelianView
              purchases={purchases}
              suppliers={suppliers}
              products={products}
              onAddPurchase={handleAddPurchase}
              onStockIncreased={handleStockIncreased}
            />
          )}

          {activeTab === 'supplier' && (
            <SupplierView
              suppliers={suppliers}
              onAddSupplier={handleAddSupplier}
              onUpdateSupplier={handleUpdateSupplier}
              onDeleteSupplier={handleDeleteSupplier}
            />
          )}

          {activeTab === 'pelanggan' && (
            <PelangganView
              customers={customers}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
            />
          )}

          {activeTab === 'laporan' && (
            <LaporanView
              products={products}
              sales={sales}
              purchases={purchases}
              settings={settings}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'gas' && <GasCodeStudioView />}

          {activeTab === 'pengaturan' && (
            <SettingsView
              settings={settings}
              salesCount={sales.length}
              purchasesCount={purchases.length}
              onSaveSettings={handleSaveSettings}
              onResetData={handleResetData}
              onExportAllData={handleExportAllData}
              onImportAllData={handleImportAllData}
              onClearSales={handleClearSales}
              onClearPurchases={handleClearPurchases}
              onClearAllTransactions={handleClearAllTransactions}
            />
          )}
        </main>
      </div>

      {/* Login / Switch Account Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={(user) => {
          setCurrentUser(user);
          showToast(`Berhasil masuk sebagai ${user.nama} (${user.role})`);
        }}
        users={users}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
