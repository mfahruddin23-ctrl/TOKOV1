import { Produk, Penjualan, Pembelian, Supplier, Pelanggan, Pengguna, StoreSettings } from '../types';

export interface SyncPayload {
  products: Produk[];
  sales: Penjualan[];
  purchases: Pembelian[];
  suppliers: Supplier[];
  customers: Pelanggan[];
  users: Pengguna[];
  settings?: StoreSettings;
}

/**
 * Extract clean Spreadsheet ID from full Google Spreadsheet link
 */
export function extractSpreadsheetId(urlOrId: string): string {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();
  // Match https://docs.google.com/spreadsheets/d/{ID}/...
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // If it's already an ID
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed;
}

/**
 * Get direct Google Sheets open URL
 */
export function getSpreadsheetOpenUrl(urlOrId: string): string {
  const id = extractSpreadsheetId(urlOrId);
  return id ? `https://docs.google.com/spreadsheets/d/${id}/edit` : urlOrId;
}

/**
 * Lightweight CSV parser for Google Sheets GViz CSV export
 */
export function parseCsvRows(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(current.trim());
      if (row.some((cell) => cell.length > 0)) {
        lines.push(row);
      }
      row = [];
      current = '';
    } else {
      current += char;
    }
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    if (row.some((cell) => cell.length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}

/**
 * Fetch a single sheet tab from Google Sheets via public GViz endpoint
 */
export async function fetchSheetCsv(spreadsheetId: string, sheetName: string): Promise<string[][]> {
  const id = extractSpreadsheetId(spreadsheetId);
  if (!id) throw new Error('ID Spreadsheet tidak valid.');

  const encodedSheet = encodeURIComponent(sheetName);
  const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodedSheet}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'text/csv, text/plain' },
  });

  if (!response.ok) {
    throw new Error(`Gagal mengambil sheet "${sheetName}" (${response.status})`);
  }

  const csvText = await response.text();
  return parseCsvRows(csvText);
}

/**
 * Fetch all sheets directly using Google Sheets GViz CSV
 */
export async function fetchSpreadsheetDirectGviz(spreadsheetId: string): Promise<Partial<SyncPayload>> {
  const id = extractSpreadsheetId(spreadsheetId);
  if (!id) throw new Error('ID Spreadsheet tidak ditemukan.');

  const payload: Partial<SyncPayload> = {};

  // Fetch Produk
  try {
    const rows = await fetchSheetCsv(id, 'Produk');
    if (rows.length > 1) {
      // row 0 is header: ID Produk | Barcode | Nama Produk | Kategori | Satuan | Harga Beli | Harga Jual | Stok | Min Stok | Supplier | Status
      payload.products = rows.slice(1).map((r, idx) => ({
        id: r[0] || `PRD-${String(idx + 1).padStart(3, '0')}`,
        barcode: r[1] || `BC-${idx}`,
        nama: r[2] || 'Produk ' + (idx + 1),
        kategori: r[3] || 'Umum',
        satuan: r[4] || 'Pcs',
        hargaBeli: parseFloat(r[5]?.replace(/[^0-9.-]+/g, '')) || 0,
        hargaJual: parseFloat(r[6]?.replace(/[^0-9.-]+/g, '')) || 0,
        stok: parseInt(r[7]?.replace(/[^0-9.-]+/g, ''), 10) || 0,
        minStok: parseInt(r[8]?.replace(/[^0-9.-]+/g, ''), 10) || 5,
        supplier: r[9] || '',
        status: (r[10] === 'Nonaktif' ? 'Nonaktif' : 'Aktif') as 'Aktif' | 'Nonaktif',
      }));
    }
  } catch (err) {
    console.warn('Gagal membaca sheet Produk via GViz:', err);
  }

  // Fetch Supplier
  try {
    const rows = await fetchSheetCsv(id, 'Supplier');
    if (rows.length > 1) {
      payload.suppliers = rows.slice(1).map((r, idx) => ({
        id: r[0] || `SUP-${String(idx + 1).padStart(3, '0')}`,
        nama: r[1] || 'Supplier ' + (idx + 1),
        alamat: r[2] || '',
        telepon: r[3] || '',
        email: r[4] || '',
      }));
    }
  } catch (err) {
    console.warn('Gagal membaca sheet Supplier via GViz:', err);
  }

  // Fetch Pelanggan
  try {
    const rows = await fetchSheetCsv(id, 'Pelanggan');
    if (rows.length > 1) {
      payload.customers = rows.slice(1).map((r, idx) => ({
        id: r[0] || `CUST-${String(idx + 1).padStart(3, '0')}`,
        nama: r[1] || 'Pelanggan ' + (idx + 1),
        telepon: r[2] || '',
        alamat: r[3] || '',
      }));
    }
  } catch (err) {
    console.warn('Gagal membaca sheet Pelanggan via GViz:', err);
  }

  return payload;
}

/**
 * Test connectivity with Google Apps Script Web App
 */
export async function testGasConnection(gasUrl: string): Promise<{ success: boolean; message: string }> {
  if (!gasUrl || !gasUrl.trim()) {
    return { success: false, message: 'URL Web App Apps Script belum diisi.' };
  }

  try {
    const cleanUrl = gasUrl.trim();
    const endpoint = cleanUrl.includes('?') ? `${cleanUrl}&action=ping` : `${cleanUrl}?action=ping`;
    const res = await fetch(endpoint, { method: 'GET' });

    if (!res.ok) {
      return { success: false, message: `Server mengembalikan status ${res.status}: ${res.statusText}` };
    }

    // Try parsing json or checking content
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      if (json.status === 'ok' || json.success !== false) {
        return { success: true, message: 'Koneksi ke Google Apps Script Web App Berhasil!' };
      }
    } catch {
      // In case HTML service was returned
      if (text.includes('TokoApp') || text.includes('Google') || text.includes('Apps Script')) {
        return { success: true, message: 'Web App terdeteksi aktif dan dapat diakses!' };
      }
    }

    return { success: true, message: 'Web App Google Apps Script berhasil dihubungi!' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Gagal menghubungi URL Apps Script: ${msg}` };
  }
}

/**
 * Fetch all data from Google Apps Script Web App Deployment URL
 */
export async function fetchFromGasWebApp(gasUrl: string): Promise<SyncPayload> {
  const cleanUrl = gasUrl.trim();
  const endpoint = cleanUrl.includes('?')
    ? `${cleanUrl}&action=getAllData`
    : `${cleanUrl}?action=getAllData`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Gagal menghubungi Web App Google Apps Script (${response.status}: ${response.statusText})`);
  }

  const json = await response.json();
  if (json.status === 'error' || json.success === false) {
    throw new Error(json.message || 'Terjadi kesalahan pada respon Google Apps Script');
  }

  return {
    products: Array.isArray(json.products) ? json.products : [],
    sales: Array.isArray(json.sales) ? json.sales : [],
    purchases: Array.isArray(json.purchases) ? json.purchases : [],
    suppliers: Array.isArray(json.suppliers) ? json.suppliers : [],
    customers: Array.isArray(json.customers) ? json.customers : [],
    users: Array.isArray(json.users) ? json.users : [],
  };
}

/**
 * Push full data to Google Apps Script Web App Deployment URL
 */
export async function pushToGasWebApp(gasUrl: string, data: SyncPayload): Promise<{ success: boolean; message: string }> {
  const cleanUrl = gasUrl.trim();

  // Use POST with JSON body or form payload
  const response = await fetch(cleanUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8', // Google Apps Script handles text/plain without CORS preflight block
    },
    body: JSON.stringify({
      action: 'syncAllData',
      data: data,
      timestamp: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Gagal mengirim data ke Google Apps Script (${response.status})`);
  }

  try {
    const json = await response.json();
    return {
      success: json.success !== false,
      message: json.message || 'Data berhasil disinkronkan ke Google Spreadsheet!',
    };
  } catch {
    return {
      success: true,
      message: 'Data berhasil dikirim ke Google Spreadsheet.',
    };
  }
}

/**
 * Test Google Spreadsheet GViz endpoint connection (read public/shared sheet)
 */
export async function testSpreadsheetGvizConnection(spreadsheetId: string): Promise<{ success: boolean; message: string }> {
  const id = extractSpreadsheetId(spreadsheetId);
  if (!id) {
    return { success: false, message: 'Link atau ID Spreadsheet tidak valid.' };
  }

  try {
    const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=Produk`;
    const res = await fetch(url, { method: 'GET' });
    if (res.ok) {
      const text = await res.text();
      if (text.includes('html') && text.includes('Sign in')) {
        return {
          success: false,
          message: 'Spreadsheet dikunci. Harap set izin berbagi menjadi "Siapa saja yang memiliki link dapat melihat" (Anyone with the link).',
        };
      }
      return {
        success: true,
        message: 'Koneksi ke Google Spreadsheet Berhasil! Sheet dapat dibaca secara langsung.',
      };
    }
    return {
      success: false,
      message: `Google Spreadsheet mengembalikan respon status: ${res.status}. Pastikan link telah dibagikan publik.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Gagal mengakses link spreadsheet: ${msg}. Pastikan URL benar.`,
    };
  }
}
