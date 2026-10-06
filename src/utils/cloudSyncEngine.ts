import { DatabaseConfig, Produk, Penjualan, Pembelian, Supplier, Pelanggan, Pengguna, StoreSettings } from '../types';
import { SyncPayload, fetchFromGasWebApp, pushToGasWebApp, fetchSpreadsheetDirectGviz } from './spreadsheetSync';
import { pullFromSupabase, pushToSupabase } from './supabaseSync';

export interface CloudSyncResult {
  success: boolean;
  message: string;
  pulledData?: Partial<SyncPayload>;
  timestamp: string;
}

/**
 * Generate shareable link for other devices (phones, tablets, PCs)
 */
export function generateMultiDeviceShareUrl(config: DatabaseConfig): string {
  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : 'https://tokoapp.web.app';
  
  const payloadToEncode = {
    p: config.activeProvider,
    su: config.spreadsheetUrl || '',
    gu: config.gasWebAppUrl || '',
    sbUrl: config.supabaseUrl || '',
    sbKey: config.supabaseAnonKey || '',
    as: config.autoSync ? 1 : 0,
  };

  try {
    const encoded = btoa(JSON.stringify(payloadToEncode));
    return `${baseUrl}?connect=${encodeURIComponent(encoded)}`;
  } catch {
    const params = new URLSearchParams();
    params.set('p', config.activeProvider);
    if (config.spreadsheetUrl) params.set('su', config.spreadsheetUrl);
    if (config.gasWebAppUrl) params.set('gu', config.gasWebAppUrl);
    if (config.supabaseUrl) params.set('sbUrl', config.supabaseUrl);
    if (config.supabaseAnonKey) params.set('sbKey', config.supabaseAnonKey);
    return `${baseUrl}?${params.toString()}`;
  }
}

/**
 * Parse configuration from URL query params (when opened from QR code or shared link)
 */
export function parseMultiDeviceUrlParams(): Partial<DatabaseConfig> | null {
  if (typeof window === 'undefined') return null;

  const urlParams = new URLSearchParams(window.location.search);
  const connectToken = urlParams.get('connect');

  if (connectToken) {
    try {
      const decoded = atob(decodeURIComponent(connectToken));
      const json = JSON.parse(decoded);
      return {
        activeProvider: json.p || 'spreadsheet',
        spreadsheetUrl: json.su || '',
        gasWebAppUrl: json.gu || '',
        supabaseUrl: json.sbUrl || '',
        supabaseAnonKey: json.sbKey || '',
        autoSync: json.as === 1,
      };
    } catch (e) {
      console.warn('Failed to parse connection token:', e);
    }
  }

  // Fallback to explicit params
  if (urlParams.has('su') || urlParams.has('gu') || urlParams.has('sbUrl') || urlParams.has('p')) {
    return {
      activeProvider: (urlParams.get('p') as any) || 'spreadsheet',
      spreadsheetUrl: urlParams.get('su') || '',
      gasWebAppUrl: urlParams.get('gu') || '',
      supabaseUrl: urlParams.get('sbUrl') || '',
      supabaseAnonKey: urlParams.get('sbKey') || '',
    };
  }

  return null;
}

/**
 * Perform Cloud Pull: fetch all latest data from active cloud backend
 */
export async function pullCloudData(config: DatabaseConfig): Promise<CloudSyncResult> {
  const timestamp = new Date().toLocaleTimeString('id-ID');

  if (config.activeProvider === 'local') {
    return {
      success: true,
      message: 'Mode database lokal aktif. Tidak ada pengambilan cloud.',
      timestamp,
    };
  }

  try {
    let pulled: Partial<SyncPayload> = {};
    const messages: string[] = [];

    // Pull from Google Spreadsheet / GAS
    if (config.activeProvider === 'spreadsheet' || config.activeProvider === 'dual') {
      if (config.gasWebAppUrl && config.gasWebAppUrl.trim()) {
        const gasData = await fetchFromGasWebApp(config.gasWebAppUrl);
        pulled = { ...pulled, ...gasData };
        messages.push('Google Spreadsheet (via Web App)');
      } else if (config.spreadsheetUrl && config.spreadsheetUrl.trim()) {
        const gvizData = await fetchSpreadsheetDirectGviz(config.spreadsheetUrl);
        pulled = { ...pulled, ...gvizData };
        messages.push('Google Spreadsheet (via Link GViz)');
      }
    }

    // Pull from Supabase
    if (config.activeProvider === 'supabase' || config.activeProvider === 'dual') {
      if (config.supabaseUrl && config.supabaseAnonKey) {
        const sbData = await pullFromSupabase(config.supabaseUrl, config.supabaseAnonKey);
        // Supabase takes precedence if dual, or merges
        pulled = {
          products: sbData.products?.length ? sbData.products : pulled.products,
          sales: sbData.sales?.length ? sbData.sales : pulled.sales,
          purchases: sbData.purchases?.length ? sbData.purchases : pulled.purchases,
          suppliers: sbData.suppliers?.length ? sbData.suppliers : pulled.suppliers,
          customers: sbData.customers?.length ? sbData.customers : pulled.customers,
          users: sbData.users?.length ? sbData.users : pulled.users,
        };
        messages.push('Database Supabase');
      }
    }

    if (messages.length === 0) {
      return {
        success: false,
        message: 'Belum ada URL Spreadsheet atau Supabase yang dikonfigurasi.',
        timestamp,
      };
    }

    return {
      success: true,
      message: `Berhasil menarik data terbaru dari ${messages.join(' & ')}!`,
      pulledData: pulled,
      timestamp,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Gagal menarik data cloud: ${msg}`,
      timestamp,
    };
  }
}

/**
 * Perform Cloud Push: send local data to active cloud backend
 */
export async function pushCloudData(
  config: DatabaseConfig,
  payload: SyncPayload
): Promise<CloudSyncResult> {
  const timestamp = new Date().toLocaleTimeString('id-ID');

  if (config.activeProvider === 'local') {
    return {
      success: true,
      message: 'Mode lokal aktif. Data disimpan di penyimpanan perangkat.',
      timestamp,
    };
  }

  const successServices: string[] = [];
  const errors: string[] = [];

  // Push to Google Spreadsheet (GAS Web App)
  if (config.activeProvider === 'spreadsheet' || config.activeProvider === 'dual') {
    if (config.gasWebAppUrl && config.gasWebAppUrl.trim()) {
      try {
        await pushToGasWebApp(config.gasWebAppUrl, payload);
        successServices.push('Google Spreadsheet');
      } catch (err: unknown) {
        errors.push(`Google Spreadsheet: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  // Push to Supabase
  if (config.activeProvider === 'supabase' || config.activeProvider === 'dual') {
    if (config.supabaseUrl && config.supabaseAnonKey) {
      try {
        await pushToSupabase(config.supabaseUrl, config.supabaseAnonKey, payload);
        successServices.push('Supabase');
      } catch (err: unknown) {
        errors.push(`Supabase: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  if (errors.length > 0 && successServices.length === 0) {
    return {
      success: false,
      message: `Gagal menyimpan ke cloud: ${errors.join('; ')}`,
      timestamp,
    };
  }

  return {
    success: true,
    message: `Data berhasil disinkronkan ke ${successServices.join(' & ')}!${
      errors.length > 0 ? ` (Catatan: ${errors.join(', ')})` : ''
    }`,
    timestamp,
  };
}
