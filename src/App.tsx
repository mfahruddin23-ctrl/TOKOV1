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
import { UserManagementView } from './components/UserManagementView';
import { ApkBuilderView } from './components/ApkBuilderView';
import { DatabaseSyncModal } from './components/DatabaseSyncModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileDrawer } from './components/MobileDrawer';

import {
  Produk,
  Penjualan,
  Pembelian,
  Supplier,
  Pelanggan,
  Pengguna,
  StoreSettings,
  DatabaseConfig,
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
  loadStoredDatabaseConfig,
  saveStoredDatabaseConfig,
} from './utils/storage';
import {
  parseMultiDeviceUrlParams,
  pullCloudData,
  pushCloudData,
  syncDirectlyToSupabaseRealtime,
} from './utils/cloudSyncEngine';
import { SyncPayload } from './utils/spreadsheetSync';
import { subscribeToSupabaseRealtime } from './utils/supabaseSync';

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

  // Database Cloud & Multi-Device Config
  const [dbConfig, setDbConfig] = useState<DatabaseConfig>(() => loadStoredDatabaseConfig());
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  // UI Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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
    saveStoredUsers(users);
  }, [users]);

  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveCurrentUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    saveStoredDatabaseConfig(dbConfig);
  }, [dbConfig]);

  // Apply Pulled Cloud Data Helper
  const handleApplyPulledData = (data: Partial<SyncPayload>, silent = false) => {
    if (data.products && Array.isArray(data.products) && data.products.length > 0) {
      setProducts(data.products);
    }
    if (data.sales && Array.isArray(data.sales)) {
      setSales(data.sales);
    }
    if (data.purchases && Array.isArray(data.purchases)) {
      setPurchases(data.purchases);
    }
    if (data.suppliers && Array.isArray(data.suppliers) && data.suppliers.length > 0) {
      setSuppliers(data.suppliers);
    }
    if (data.customers && Array.isArray(data.customers) && data.customers.length > 0) {
      setCustomers(data.customers);
    }
    if (data.users && Array.isArray(data.users) && data.users.length > 0) {
      setUsers(data.users);
    }
    if (!silent) {
      showToast('Data toko berhasil disinkronkan dengan database cloud!');
    }
  };

  // Detect Multi-Device Connection URL on initial mount
  useEffect(() => {
    const urlConfig = parseMultiDeviceUrlParams();
    if (urlConfig) {
      setDbConfig((prev) => {
        const merged: DatabaseConfig = { ...prev, ...urlConfig };
        saveStoredDatabaseConfig(merged);

        // Pull latest cloud database immediately
        pullCloudData(merged)
          .then((res) => {
            if (res.success && res.pulledData) {
              handleApplyPulledData(res.pulledData);
              showToast('📱 Terhubung ke database multi-device! Data berhasil dimuat.');
            } else if (!res.success) {
              showToast(`Koneksi multi-device aktif: ${res.message}`);
            }
          })
          .catch((err) => {
            console.warn('Initial cloud pull failed:', err);
          });

        return merged;
      });

      // Clean browser address bar
      if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
        const cleanUrl = `${window.location.origin}${window.location.pathname}`;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, []);

  // Periodic Auto-Sync (every 30 seconds if tab visible and provider is not local)
  useEffect(() => {
    if (!dbConfig.autoSync || dbConfig.activeProvider === 'local') return;

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        pullCloudData(dbConfig)
          .then((res) => {
            if (res.success && res.pulledData) {
              handleApplyPulledData(res.pulledData, true); // silent background update
              setDbConfig((prev) => ({
                ...prev,
                lastSyncTime: res.timestamp,
                lastSyncStatus: 'success',
              }));
            }
          })
          .catch(() => {});
      }
    }, Math.max(15, dbConfig.syncIntervalSec || 30) * 1000);

    return () => clearInterval(interval);
  }, [dbConfig]);

  // Continuous Supabase Realtime WebSocket Listener (Multi-Device Live Sync)
  useEffect(() => {
    if (
      !dbConfig.supabaseUrl ||
      !dbConfig.supabaseAnonKey ||
      dbConfig.activeProvider === 'local' ||
      dbConfig.supabaseRealtimeEnabled === false
    ) {
      return;
    }

    const unsubscribe = subscribeToSupabaseRealtime(
      dbConfig.supabaseUrl,
      dbConfig.supabaseAnonKey,
      {
        onStatusChange: (status) => {
          setDbConfig((prev) => ({ ...prev, realtimeStatus: status }));
        },
        onProductChange: (eventType, product) => {
          if (eventType === 'INSERT') {
            setProducts((prev) => {
              if (prev.some((p) => p.id === product.id)) return prev;
              return [product, ...prev];
            });
            showToast(`⚡ Realtime: Produk "${product.nama}" baru ditambahkan!`);
          } else if (eventType === 'UPDATE') {
            setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
            showToast(`⚡ Realtime: Stok/harga "${product.nama}" diperbarui!`);
          } else if (eventType === 'DELETE') {
            setProducts((prev) => prev.filter((p) => p.id !== product.id));
            showToast(`⚡ Realtime: Produk "${product.nama}" dihapus!`);
          }
        },
        onSaleChange: (eventType, sale) => {
          if (eventType === 'INSERT') {
            setSales((prev) => {
              if (prev.some((s) => s.id === sale.id)) return prev;
              return [sale, ...prev];
            });
            showToast(`⚡ Realtime: Transaksi baru ${sale.id} masuk dari kasir lain!`);
          }
        },
        onPurchaseChange: (eventType, purchase) => {
          if (eventType === 'INSERT') {
            setPurchases((prev) => {
              if (prev.some((pb) => pb.id === purchase.id)) return prev;
              return [purchase, ...prev];
            });
          }
        },
        onSupplierChange: (eventType, supplier) => {
          if (eventType === 'INSERT' || eventType === 'UPDATE') {
            setSuppliers((prev) => [...prev.filter((s) => s.id !== supplier.id), supplier]);
          } else if (eventType === 'DELETE') {
            setSuppliers((prev) => prev.filter((s) => s.id !== supplier.id));
          }
        },
        onCustomerChange: (eventType, customer) => {
          if (eventType === 'INSERT' || eventType === 'UPDATE') {
            setCustomers((prev) => [...prev.filter((c) => c.id !== customer.id), customer]);
          } else if (eventType === 'DELETE') {
            setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
          }
        },
        onUserChange: (eventType, user) => {
          if (eventType === 'INSERT' || eventType === 'UPDATE') {
            setUsers((prev) => [...prev.filter((u) => u.username !== user.username), user]);
          } else if (eventType === 'DELETE') {
            setUsers((prev) => prev.filter((u) => u.username !== user.username));
          }
        },
      }
    );

    return () => {
      unsubscribe();
    };
  }, [
    dbConfig.supabaseUrl,
    dbConfig.supabaseAnonKey,
    dbConfig.activeProvider,
    dbConfig.supabaseRealtimeEnabled,
  ]);

  // Quick Sync all application data to Supabase Realtime
  const handleSyncAllToSupabaseRealtime = async () => {
    if (!dbConfig.supabaseUrl || !dbConfig.supabaseAnonKey) {
      setIsSyncModalOpen(true);
      showToast('Masukkan URL & Anon Key Supabase terlebih dahulu.');
      return;
    }

    showToast('⚡ Menyinkronkan seluruh data aplikasi ke Supabase Realtime...');
    const res = await syncDirectlyToSupabaseRealtime(
      dbConfig.supabaseUrl,
      dbConfig.supabaseAnonKey,
      {
        products,
        sales,
        purchases,
        suppliers,
        customers,
        users,
        settings,
      }
    );

    if (res.success) {
      const updatedConfig: DatabaseConfig = {
        ...dbConfig,
        activeProvider: dbConfig.activeProvider === 'local' ? 'supabase' : dbConfig.activeProvider,
        supabaseRealtimeEnabled: true,
        realtimeStatus: 'connected',
        lastSyncTime: res.timestamp,
        lastSyncStatus: 'success',
      };
      setDbConfig(updatedConfig);
      saveStoredDatabaseConfig(updatedConfig);
      showToast(res.message);
    } else {
      if (
        res.message &&
        (res.message.toLowerCase().includes('row-level security') ||
          res.message.toLowerCase().includes('rls'))
      ) {
        setIsSyncModalOpen(true);
        showToast('⚠️ Error RLS Supabase: Menu sinkronisasi dibuka untuk menyalin skrip perbaikan.');
      } else {
        showToast(`Gagal: ${res.message}`);
      }
    }
  };

  // Push helper on mutations
  const triggerAutoPush = (overridePayload?: Partial<SyncPayload>) => {
    if (!dbConfig.autoSync || dbConfig.activeProvider === 'local') return;

    const payload: SyncPayload = {
      products: overridePayload?.products ?? products,
      sales: overridePayload?.sales ?? sales,
      purchases: overridePayload?.purchases ?? purchases,
      suppliers: overridePayload?.suppliers ?? suppliers,
      customers: overridePayload?.customers ?? customers,
      users: overridePayload?.users ?? users,
      settings: overridePayload?.settings ?? settings,
    };

    pushCloudData(dbConfig, payload)
      .then((res) => {
        if (res.success) {
          setDbConfig((prev) => ({
            ...prev,
            lastSyncTime: res.timestamp,
            lastSyncStatus: 'success',
          }));
        }
      })
      .catch((err) => {
        console.warn('Auto push failed:', err);
      });
  };

  // Stock operations
  const handleStockReduced = (reducedItems: { barcode: string; qty: number }[]) => {
    const updated = products.map((p) => {
      const found = reducedItems.find((itm) => itm.barcode === p.barcode);
      if (found) {
        return {
          ...p,
          stok: Math.max(0, p.stok - found.qty),
        };
      }
      return p;
    });
    setProducts(updated);
    triggerAutoPush({ products: updated });
  };

  const handleStockIncreased = (productId: string, qty: number, newBuyPrice: number) => {
    const updated = products.map((p) => {
      if (p.id === productId || p.barcode === productId) {
        return {
          ...p,
          stok: p.stok + qty,
          hargaBeli: newBuyPrice > 0 ? newBuyPrice : p.hargaBeli,
        };
      }
      return p;
    });
    setProducts(updated);
    showToast(`Stok produk berhasil ditambah sejumlah ${qty}!`);
    triggerAutoPush({ products: updated });
  };

  // Sales
  const handleSaveTransaction = (sale: Penjualan) => {
    const updatedSales = [sale, ...sales];
    setSales(updatedSales);
    showToast(`Transaksi ${sale.id} berhasil dicatat!`);
    triggerAutoPush({ sales: updatedSales });
  };

  // Purchases
  const handleAddPurchase = (purchase: Pembelian) => {
    const updatedPurchases = [purchase, ...purchases];
    setPurchases(updatedPurchases);
    triggerAutoPush({ purchases: updatedPurchases });
  };

  // Product CRUD
  const handleAddProduct = (prod: Produk) => {
    const updated = [prod, ...products];
    setProducts(updated);
    showToast(`Produk "${prod.nama}" berhasil ditambahkan!`);
    triggerAutoPush({ products: updated });
  };

  const handleUpdateProduct = (prod: Produk) => {
    const updated = products.map((p) => (p.id === prod.id ? prod : p));
    setProducts(updated);
    showToast(`Produk "${prod.nama}" berhasil diperbarui!`);
    triggerAutoPush({ products: updated });
  };

  const handleDeleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    showToast('Produk berhasil dihapus!');
    triggerAutoPush({ products: updated });
  };

  const handleImportProducts = (prods: Produk[]) => {
    setProducts(prods);
    showToast(`Berhasil mengimpor ${prods.length} produk!`);
    triggerAutoPush({ products: prods });
  };

  // Supplier CRUD
  const handleAddSupplier = (s: Supplier) => {
    const updated = [...suppliers, s];
    setSuppliers(updated);
    showToast(`Supplier "${s.nama}" berhasil ditambahkan!`);
    triggerAutoPush({ suppliers: updated });
  };

  const handleUpdateSupplier = (s: Supplier) => {
    const updated = suppliers.map((item) => (item.id === s.id ? s : item));
    setSuppliers(updated);
    showToast(`Supplier "${s.nama}" diperbarui!`);
    triggerAutoPush({ suppliers: updated });
  };

  const handleDeleteSupplier = (id: string) => {
    const updated = suppliers.filter((item) => item.id !== id);
    setSuppliers(updated);
    showToast('Supplier berhasil dihapus!');
    triggerAutoPush({ suppliers: updated });
  };

  // Customer CRUD
  const handleAddCustomer = (c: Pelanggan) => {
    const updated = [...customers, c];
    setCustomers(updated);
    showToast(`Pelanggan "${c.nama}" berhasil ditambahkan!`);
    triggerAutoPush({ customers: updated });
  };

  const handleUpdateCustomer = (c: Pelanggan) => {
    const updated = customers.map((item) => (item.id === c.id ? c : item));
    setCustomers(updated);
    showToast(`Pelanggan "${c.nama}" diperbarui!`);
    triggerAutoPush({ customers: updated });
  };

  const handleDeleteCustomer = (id: string) => {
    const updated = customers.filter((item) => item.id !== id);
    setCustomers(updated);
    showToast('Pelanggan berhasil dihapus!');
    triggerAutoPush({ customers: updated });
  };

  // User Management CRUD handlers
  const handleAddUser = (newUser: Pengguna) => {
    const updated = [...users, newUser];
    setUsers(updated);
    showToast(`Pengguna "${newUser.nama}" (${newUser.role}) berhasil ditambahkan!`);
    triggerAutoPush({ users: updated });
  };

  const handleUpdateUser = (updatedUser: Pengguna) => {
    const updated = users.map((u) => (u.username === updatedUser.username ? updatedUser : u));
    setUsers(updated);
    if (currentUser?.username === updatedUser.username) {
      setCurrentUser((prev) => (prev ? { ...prev, nama: updatedUser.nama, role: updatedUser.role } : null));
    }
    showToast(`Profil pengguna "${updatedUser.nama}" berhasil diperbarui!`);
    triggerAutoPush({ users: updated });
  };

  const handleChangePassword = (username: string, newPass: string) => {
    const updated = users.map((u) => (u.username === username ? { ...u, password: newPass } : u));
    setUsers(updated);
    if (currentUser?.username === username) {
      setCurrentUser((prev) => (prev ? { ...prev, password: newPass } : null));
    }
    showToast(`Password untuk "${username}" berhasil diperbarui!`);
    triggerAutoPush({ users: updated });
  };

  const handleDeleteUser = (username: string) => {
    const updated = users.filter((u) => u.username !== username);
    setUsers(updated);
    showToast(`Pengguna "${username}" telah dihapus.`);
    triggerAutoPush({ users: updated });
  };

  // Settings & Backups
  const handleSaveSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);

    // Keep dbConfig in sync if URLs were provided in Settings
    setDbConfig((prev) => {
      const merged: DatabaseConfig = {
        ...prev,
        spreadsheetUrl: newSettings.spreadsheetUrl ?? prev.spreadsheetUrl,
        gasWebAppUrl: newSettings.gasWebAppUrl ?? prev.gasWebAppUrl,
        supabaseUrl: newSettings.supabaseUrl ?? prev.supabaseUrl,
        supabaseAnonKey: newSettings.supabaseAnonKey ?? prev.supabaseAnonKey,
      };
      saveStoredDatabaseConfig(merged);
      return merged;
    });

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
    setDbConfig(loadStoredDatabaseConfig());
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
      users,
      settings,
      dbConfig,
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
      if (data.users) setUsers(data.users);
      if (data.settings) setSettings(data.settings);
      if (data.dbConfig) setDbConfig(data.dbConfig);
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
    triggerAutoPush({ sales: [] });
  };

  const handleClearPurchases = () => {
    setPurchases([]);
    clearStoredPurchases();
    showToast('Data riwayat pembelian supplier berhasil dikosongkan!');
    triggerAutoPush({ purchases: [] });
  };

  const handleClearAllTransactions = () => {
    setSales([]);
    setPurchases([]);
    clearStoredAllTransactions();
    showToast('Seluruh data transaksi (Penjualan & Pembelian) berhasil dikosongkan!');
    triggerAutoPush({ sales: [], purchases: [] });
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
        dbConfig={dbConfig}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
        onSyncSupabaseRealtime={handleSyncAllToSupabaseRealtime}
      />

      {/* Main Body */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          lowStockCount={lowStockCount}
          dbConfig={dbConfig}
          onOpenSyncModal={() => setIsSyncModalOpen(true)}
        />

        <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto pb-24 lg:pb-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              products={products}
              sales={sales}
              purchases={purchases}
              setActiveTab={setActiveTab}
              onOpenAddProduct={() => setActiveTab('produk')}
              dbConfig={dbConfig}
              onOpenSyncModal={() => setIsSyncModalOpen(true)}
              onSyncSupabaseRealtime={handleSyncAllToSupabaseRealtime}
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

          {activeTab === 'users' && (
            <UserManagementView
              users={users}
              currentUser={currentUser}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onChangePassword={handleChangePassword}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {activeTab === 'apk' && <ApkBuilderView settings={settings} />}

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
              dbConfig={dbConfig}
              onOpenSyncModal={() => setIsSyncModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Visible on mobile/tablet < lg) */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
        dbConfig={dbConfig}
      />

      {/* Mobile Offcanvas Drawer (Visible on < lg) */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        settings={settings}
        dbConfig={dbConfig}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={() => setIsLoginModalOpen(true)}
        lowStockCount={lowStockCount}
      />

      {/* Database Cloud & Multi-Device Synchronization Modal */}
      <DatabaseSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        config={dbConfig}
        onSaveConfig={(newCfg) => {
          setDbConfig(newCfg);
          saveStoredDatabaseConfig(newCfg);
          setSettings((prev) => ({
            ...prev,
            spreadsheetUrl: newCfg.spreadsheetUrl,
            gasWebAppUrl: newCfg.gasWebAppUrl,
            supabaseUrl: newCfg.supabaseUrl,
            supabaseAnonKey: newCfg.supabaseAnonKey,
          }));
        }}
        localData={{
          products,
          sales,
          purchases,
          suppliers,
          customers,
          users,
          settings,
        }}
        onApplyPulledData={handleApplyPulledData}
        onNotify={showToast}
      />

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
        <div className="fixed bottom-16 lg:bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
