import { Produk, Penjualan, Pembelian, Supplier, Pelanggan, Pengguna, StoreSettings } from '../types';
import {
  initialProduk,
  initialPenjualan,
  initialPembelian,
  initialSuppliers,
  initialPelanggan,
  initialPengguna,
  initialSettings,
} from '../data/initialData';

const STORAGE_KEYS = {
  PRODUK: 'toko_gas_produk_v1',
  PENJUALAN: 'toko_gas_penjualan_v1',
  PEMBELIAN: 'toko_gas_pembelian_v1',
  SUPPLIER: 'toko_gas_supplier_v1',
  PELANGGAN: 'toko_gas_pelanggan_v1',
  PENGGUNA: 'toko_gas_pengguna_v1',
  SETTINGS: 'toko_gas_settings_v1',
  CURRENT_USER: 'toko_gas_current_user_v1',
};

export function loadStoredProducts(): Produk[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUK);
    return data ? JSON.parse(data) : initialProduk;
  } catch {
    return initialProduk;
  }
}

export function saveStoredProducts(products: Produk[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUK, JSON.stringify(products));
  } catch (e) {
    console.error('Failed to save products:', e);
  }
}

export function loadStoredSales(): Penjualan[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PENJUALAN);
    return data ? JSON.parse(data) : initialPenjualan;
  } catch {
    return initialPenjualan;
  }
}

export function saveStoredSales(sales: Penjualan[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.PENJUALAN, JSON.stringify(sales));
  } catch (e) {
    console.error('Failed to save sales:', e);
  }
}

export function loadStoredPurchases(): Pembelian[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PEMBELIAN);
    return data ? JSON.parse(data) : initialPembelian;
  } catch {
    return initialPembelian;
  }
}

export function saveStoredPurchases(purchases: Pembelian[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.PEMBELIAN, JSON.stringify(purchases));
  } catch (e) {
    console.error('Failed to save purchases:', e);
  }
}

export function loadStoredSuppliers(): Supplier[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SUPPLIER);
    return data ? JSON.parse(data) : initialSuppliers;
  } catch {
    return initialSuppliers;
  }
}

export function saveStoredSuppliers(suppliers: Supplier[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.SUPPLIER, JSON.stringify(suppliers));
  } catch (e) {
    console.error('Failed to save suppliers:', e);
  }
}

export function loadStoredCustomers(): Pelanggan[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PELANGGAN);
    return data ? JSON.parse(data) : initialPelanggan;
  } catch {
    return initialPelanggan;
  }
}

export function saveStoredCustomers(customers: Pelanggan[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.PELANGGAN, JSON.stringify(customers));
  } catch (e) {
    console.error('Failed to save customers:', e);
  }
}

export function loadStoredUsers(): Pengguna[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PENGGUNA);
    return data ? JSON.parse(data) : initialPengguna;
  } catch {
    return initialPengguna;
  }
}

export function saveStoredUsers(users: Pengguna[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.PENGGUNA, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users:', e);
  }
}

export function loadStoredSettings(): StoreSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : initialSettings;
  } catch {
    return initialSettings;
  }
}

export function saveStoredSettings(settings: StoreSettings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function loadCurrentUser(): Pengguna | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : initialPengguna[0]; // Default logged in as Admin for instant test
  } catch {
    return initialPengguna[0];
  }
}

export function saveCurrentUser(user: Pengguna | null) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  } catch (e) {
    console.error('Failed to save current user:', e);
  }
}

export function clearStoredSales() {
  try {
    localStorage.setItem(STORAGE_KEYS.PENJUALAN, JSON.stringify([]));
  } catch (e) {
    console.error('Failed to clear sales:', e);
  }
}

export function clearStoredPurchases() {
  try {
    localStorage.setItem(STORAGE_KEYS.PEMBELIAN, JSON.stringify([]));
  } catch (e) {
    console.error('Failed to clear purchases:', e);
  }
}

export function clearStoredAllTransactions() {
  try {
    localStorage.setItem(STORAGE_KEYS.PENJUALAN, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PEMBELIAN, JSON.stringify([]));
  } catch (e) {
    console.error('Failed to clear transactions:', e);
  }
}

export function resetAllDataToDefault() {
  localStorage.removeItem(STORAGE_KEYS.PRODUK);
  localStorage.removeItem(STORAGE_KEYS.PENJUALAN);
  localStorage.removeItem(STORAGE_KEYS.PEMBELIAN);
  localStorage.removeItem(STORAGE_KEYS.SUPPLIER);
  localStorage.removeItem(STORAGE_KEYS.PELANGGAN);
  localStorage.removeItem(STORAGE_KEYS.PENGGUNA);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}
