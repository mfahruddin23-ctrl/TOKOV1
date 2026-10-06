/**
 * Template Kode Google Apps Script & Google Spreadsheet
 * Siap ditempel langsung ke editor Google Apps Script (script.google.com)
 */

export interface GasFile {
  name: string;
  type: 'gs' | 'html';
  description: string;
  content: string;
}

export const GAS_FILES: GasFile[] = [
  {
    name: 'Code.gs',
    type: 'gs',
    description: 'Entry point Web App, routing HTML Service, include helper, dan Setup Database Otomatis.',
    content: `/**
 * ====================================================================
 * APLIKASI PENGELOLAAN TOKO & KASIR SPREADSHEET (POS & INVENTORY)
 * File: Code.gs - Entry Point & Router Web App
 * ====================================================================
 */

// Konstanta Nama Sheet
var SHEET_PRODUK = "Produk";
var SHEET_PENJUALAN = "Penjualan";
var SHEET_PEMBELIAN = "Pembelian";
var SHEET_SUPPLIER = "Supplier";
var SHEET_PELANGGAN = "Pelanggan";
var SHEET_PENGGUNA = "Pengguna";
var SHEET_PENGATURAN = "Pengaturan";

/**
 * Endpoint utama Web App (doGet)
 * Menampilkan antarmuka HTML Service dengan Bootstrap 5 ATAU Respon REST API JSON
 */
function doGet(e) {
  // Jika pemanggilan API dari aplikasi multi-device / smartphone
  if (e && e.parameter && e.parameter.action) {
    var action = e.parameter.action;
    if (action === 'getAllData') {
      var allData = getAllDataFromSheets();
      return ContentService.createTextOutput(JSON.stringify(allData))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (action === 'ping') {
      return ContentService.createTextOutput(JSON.stringify({ status: 'ok', success: true, timestamp: new Date() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  var template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('TokoApp - Sistem Kasir & Inventory Spreadsheet')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Endpoint API POST (doPost)
 * Menerima sinkronisasi data dari aplikasi Web / HP multi-device
 */
function doPost(e) {
  try {
    var raw = e.postData ? e.postData.contents : "";
    var body = raw ? JSON.parse(raw) : {};
    var action = body.action || (e.parameter ? e.parameter.action : "");

    if (action === 'syncAllData' && body.data) {
      syncAllDataToSheets(body.data);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Seluruh data berhasil disinkronkan ke Google Spreadsheet!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'addSale' && body.sale) {
      simpanTransaksi(body.sale);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Transaksi berhasil dicatat di Spreadsheet!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Data diterima oleh Google Apps Script"
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Gagal memproses data: " + err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Helper REST API: Ambil semua data dari 6 sheet sekaligus
 */
function getAllDataFromSheets() {
  return {
    success: true,
    products: getProducts(),
    sales: getSalesHistory(),
    purchases: getPurchases(),
    suppliers: getSuppliers(),
    customers: getCustomers(),
    users: getUsers()
  };
}

/**
 * Helper REST API: Sinkronisasi data masuk dari aplikasi
 */
function syncAllDataToSheets(data) {
  var ss = getSpreadsheet();
  
  // Sinkronkan Produk jika ada
  if (data.products && data.products.length > 0) {
    var sheet = getOrCreateSheet(ss, SHEET_PRODUK);
    var headers = ["ID Produk", "Barcode", "Nama Produk", "Kategori", "Satuan", "Harga Beli", "Harga Jual", "Stok", "Minimum Stok", "Supplier", "Status"];
    sheet.clearContents();
    sheet.appendRow(headers);
    var rows = data.products.map(function(p) {
      return [p.id, p.barcode, p.nama, p.kategori, p.satuan, p.hargaBeli, p.hargaJual, p.stok, p.minStok, p.supplier || "", p.status || "Aktif"];
    });
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
  }

  // Sinkronkan Supplier jika ada
  if (data.suppliers && data.suppliers.length > 0) {
    var sheetSup = getOrCreateSheet(ss, SHEET_SUPPLIER);
    var headersSup = ["ID Supplier", "Nama", "Alamat", "Telepon", "Email"];
    sheetSup.clearContents();
    sheetSup.appendRow(headersSup);
    var rowsSup = data.suppliers.map(function(s) {
      return [s.id, s.nama, s.alamat || "", s.telepon || "", s.email || ""];
    });
    if (rowsSup.length > 0) {
      sheetSup.getRange(2, 1, rowsSup.length, headersSup.length).setValues(rowsSup);
    }
  }

  // Sinkronkan Pelanggan jika ada
  if (data.customers && data.customers.length > 0) {
    var sheetPel = getOrCreateSheet(ss, SHEET_PELANGGAN);
    var headersPel = ["ID Pelanggan", "Nama", "Telepon", "Alamat"];
    sheetPel.clearContents();
    sheetPel.appendRow(headersPel);
    var rowsPel = data.customers.map(function(c) {
      return [c.id, c.nama, c.telepon || "", c.alamat || ""];
    });
    if (rowsPel.length > 0) {
      sheetPel.getRange(2, 1, rowsPel.length, headersPel.length).setValues(rowsPel);
    }
  }

  // Sinkronkan Pengguna jika ada
  if (data.users && data.users.length > 0) {
    var sheetUser = getOrCreateSheet(ss, SHEET_PENGGUNA);
    var headersUser = ["Username", "Password", "Nama", "Role (Admin/Kasir)"];
    sheetUser.clearContents();
    sheetUser.appendRow(headersUser);
    var rowsUser = data.users.map(function(u) {
      return [u.username, u.password || "", u.nama, u.role || "Kasir"];
    });
    if (rowsUser.length > 0) {
      sheetUser.getRange(2, 1, rowsUser.length, headersUser.length).setValues(rowsUser);
    }
  }
}

/**
 * Helper untuk menyertakan partial HTML (modular HTML)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Helper untuk mengambil Spreadsheet aktif
 */
function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * FUNGSI SETUP DATABASE OTOMATIS:
 * Jalankan fungsi ini SATU KALI di Google Apps Script editor
 * untuk membuat seluruh 6 Sheet beserta Header Kolom dan Sample Data!
 */
function setupSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Sheet Produk
  var sheetProduk = getOrCreateSheet(ss, SHEET_PRODUK);
  var headerProduk = ["ID Produk", "Barcode", "Nama Produk", "Kategori", "Satuan", "Harga Beli", "Harga Jual", "Stok", "Minimum Stok", "Supplier", "Status"];
  setHeaderStyle(sheetProduk, headerProduk);
  if (sheetProduk.getLastRow() === 1) {
    sheetProduk.appendRow(["PRD-001", "8992753110111", "Beras Pandan Wangi 5 Kg", "Sembako", "Karung", 68000, 78000, 35, 10, "CV Berkah Sumber Rezeki", "Aktif"]);
    sheetProduk.appendRow(["PRD-002", "8999999001234", "Minyak Goreng Sania 2 Liter", "Sembako", "Pouch", 31000, 35500, 4, 10, "PT Indofood Sukses Makmur", "Aktif"]);
    sheetProduk.appendRow(["PRD-003", "8998866102345", "Indomie Goreng Spesial 85g", "Makanan Instan", "Bungkus", 2800, 3500, 120, 30, "PT Indofood Sukses Makmur", "Aktif"]);
    sheetProduk.appendRow(["PRD-004", "8991001100234", "Teh Botol Sosro Kotak 250ml", "Minuman", "Kotak", 3200, 4500, 3, 12, "PT Mayora Indah Tbk", "Aktif"]);
  }

  // 2. Sheet Penjualan
  var sheetPenjualan = getOrCreateSheet(ss, SHEET_PENJUALAN);
  var headerPenjualan = ["No Transaksi", "Tanggal", "Barcode", "Nama Produk", "Qty", "Harga", "Diskon", "Subtotal", "Kasir", "Metode Pembayaran"];
  setHeaderStyle(sheetPenjualan, headerPenjualan);

  // 3. Sheet Pembelian
  var sheetPembelian = getOrCreateSheet(ss, SHEET_PEMBELIAN);
  var headerPembelian = ["No Pembelian", "Tanggal", "Supplier", "Barcode", "Nama Produk", "Qty", "Harga Beli", "Total"];
  setHeaderStyle(sheetPembelian, headerPembelian);

  // 4. Sheet Supplier
  var sheetSupplier = getOrCreateSheet(ss, SHEET_SUPPLIER);
  var headerSupplier = ["ID Supplier", "Nama", "Alamat", "Telepon", "Email"];
  setHeaderStyle(sheetSupplier, headerSupplier);
  if (sheetSupplier.getLastRow() === 1) {
    sheetSupplier.appendRow(["SUP-001", "PT Indofood Sukses Makmur", "Kawasan Industri Pulogadung Kav 12", "021-4601122", "order@indofood.co.id"]);
    sheetSupplier.appendRow(["SUP-002", "CV Berkah Sumber Rezeki", "Pasar Kramat Jati Blok C No 5", "0813-8899-7711", "berkah@gmail.com"]);
  }

  // 5. Sheet Pelanggan
  var sheetPelanggan = getOrCreateSheet(ss, SHEET_PELANGGAN);
  var headerPelanggan = ["ID Pelanggan", "Nama", "Telepon", "Alamat"];
  setHeaderStyle(sheetPelanggan, headerPelanggan);
  if (sheetPelanggan.getLastRow() === 1) {
    sheetPelanggan.appendRow(["CUST-001", "Ibu Siti Aminah", "0812-9988-7766", "Jl. Mawar No. 12"]);
    sheetPelanggan.appendRow(["CUST-002", "Pak Budi Santoso", "0857-1122-3344", "Komplek Permata B-4"]);
  }

  // 6. Sheet Pengguna
  var sheetPengguna = getOrCreateSheet(ss, SHEET_PENGGUNA);
  var headerPengguna = ["Username", "Password", "Nama", "Role (Admin/Kasir)"];
  setHeaderStyle(sheetPengguna, headerPengguna);
  if (sheetPengguna.getLastRow() === 1) {
    sheetPengguna.appendRow(["admin", "admin123", "Administrator Toko", "Admin"]);
    sheetPengguna.appendRow(["kasir", "kasir123", "Dewi Rahayu", "Kasir"]);
  }

  return "Database Toko Berhasil Dibuat dengan 6 Sheet Lengkap!";
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function setHeaderStyle(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#1e293b");
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  sheet.setFrozenRows(1);
}
`,
  },
  {
    name: 'Auth.gs',
    type: 'gs',
    description: 'Modul Autentikasi: Login, Session via UserProperties/ScriptProperties, Validasi Role (Admin & Kasir).',
    content: `/**
 * ====================================================================
 * File: Auth.gs - Autentikasi & Manajemen Pengguna
 * ====================================================================
 */

/**
 * Validasi login user
 * @param {string} username 
 * @param {string} password 
 * @return {object} { success: boolean, user: object, message: string }
 */
function loginUser(username, password) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_PENGGUNA);
    if (!sheet) {
      return { success: false, message: "Sheet Pengguna tidak ditemukan. Jalankan setupSpreadsheet() terlebih dahulu." };
    }

    var data = sheet.getDataRange().getValues();
    // Baris 0 = Header: Username | Password | Nama | Role
    for (var i = 1; i < data.length; i++) {
      var rowUser = String(data[i][0]).trim().toLowerCase();
      var rowPass = String(data[i][1]).trim();
      var rowNama = data[i][2];
      var rowRole = data[i][3];

      if (rowUser === String(username).trim().toLowerCase() && rowPass === String(password).trim()) {
        var userObj = {
          username: rowUser,
          nama: rowNama,
          role: rowRole
        };
        
        // Simpan sesi login ke UserProperties
        var userProps = PropertiesService.getUserProperties();
        userProps.setProperty("CURRENT_USER", JSON.stringify(userObj));
        userProps.setProperty("LOGIN_TIME", new Date().toISOString());

        return {
          success: true,
          user: userObj,
          message: "Login berhasil! Selamat datang, " + rowNama
        };
      }
    }

    return { success: false, message: "Username atau password salah!" };
  } catch (err) {
    return { success: false, message: "Terjadi kesalahan: " + err.message };
  }
}

/**
 * Cek sesi aktif saat aplikasi dimuat
 */
function checkSession() {
  try {
    var userProps = PropertiesService.getUserProperties();
    var userJson = userProps.getProperty("CURRENT_USER");
    if (userJson) {
      return { isLoggedIn: true, user: JSON.parse(userJson) };
    }
    return { isLoggedIn: false };
  } catch (err) {
    return { isLoggedIn: false };
  }
}

/**
 * Logout pengguna
 */
function logoutUser() {
  try {
    var userProps = PropertiesService.getUserProperties();
    userProps.deleteProperty("CURRENT_USER");
    userProps.deleteProperty("LOGIN_TIME");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * ====================================================================
 * MANAJEMEN PENGGUNA (CRUD PENGGUNA & HAK AKSES)
 * ====================================================================
 */

/**
 * Mengambil daftar seluruh pengguna dari Sheet Pengguna
 */
function getUsers() {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_PENGGUNA);
    if (!sheet) return [];
    var data = sheet.getDataRange().getValues();
    var users = [];
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      users.push({
        username: String(data[i][0]),
        nama: String(data[i][2]),
        role: String(data[i][3])
      });
    }
    return users;
  } catch (err) {
    throw new Error("Gagal mengambil data pengguna: " + err.message);
  }
}

/**
 * Tambah Pengguna Baru
 */
function addUser(user) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_PENGGUNA);
    var u = String(user.username).trim().toLowerCase();
    
    // Cek duplikat username
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase() === u) {
        return { success: false, message: "Username sudah digunakan!" };
      }
    }

    sheet.appendRow([u, String(user.password).trim(), user.nama, user.role || 'Kasir']);
    return { success: true, message: "Pengguna berhasil ditambahkan!" };
  } catch (err) {
    return { success: false, message: "Gagal menambah pengguna: " + err.message };
  }
}

/**
 * Edit Nama & Role Hak Akses Pengguna
 */
function updateUser(user) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_PENGGUNA);
    var u = String(user.username).trim().toLowerCase();
    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase() === u) {
        var rowNumber = i + 1;
        sheet.getRange(rowNumber, 3).setValue(user.nama); // Kolom Nama
        sheet.getRange(rowNumber, 4).setValue(user.role); // Kolom Role
        return { success: true, message: "Profil pengguna berhasil diperbarui!" };
      }
    }
    return { success: false, message: "Pengguna tidak ditemukan!" };
  } catch (err) {
    return { success: false, message: "Gagal memperbarui pengguna: " + err.message };
  }
}

/**
 * Ganti Password Pengguna
 */
function changePassword(username, newPassword) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_PENGGUNA);
    var u = String(username).trim().toLowerCase();
    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase() === u) {
        sheet.getRange(i + 1, 2).setValue(String(newPassword).trim()); // Kolom Password
        return { success: true, message: "Password berhasil diperbarui!" };
      }
    }
    return { success: false, message: "Pengguna tidak ditemukan!" };
  } catch (err) {
    return { success: false, message: "Gagal mengubah password: " + err.message };
  }
}

/**
 * Hapus Pengguna
 */
function deleteUser(username) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_PENGGUNA);
    var u = String(username).trim().toLowerCase();
    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase() === u) {
        sheet.deleteRow(i + 1);
        return { success: true, message: "Pengguna berhasil dihapus!" };
      }
    }
    return { success: false, message: "Pengguna tidak ditemukan!" };
  } catch (err) {
    return { success: false, message: "Gagal menghapus pengguna: " + err.message };
  }
}

`,
  },
  {
    name: 'Product.gs',
    type: 'gs',
    description: 'CRUD Produk lengkap, pencarian, filter kategori, auto-generate barcode, upload foto, dan import/export.',
    content: `/**
 * ====================================================================
 * File: Product.gs - Manajemen Data Produk & Stok
 * ====================================================================
 */

/**
 * Mengambil seluruh daftar produk
 */
function getProducts() {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_PRODUK);
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    var products = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0] && !row[1] && !row[2]) continue; // Lewati baris kosong
      products.push({
        id: String(row[0]),
        barcode: String(row[1]),
        nama: String(row[2]),
        kategori: String(row[3]),
        satuan: String(row[4]),
        hargaBeli: Number(row[5]) || 0,
        hargaJual: Number(row[6]) || 0,
        stok: Number(row[7]) || 0,
        minStok: Number(row[8]) || 0,
        supplier: String(row[9] || ''),
        status: String(row[10] || 'Aktif')
      });
    }
    return products;
  } catch (err) {
    throw new Error("Gagal mengambil data produk: " + err.message);
  }
}

/**
 * Menambah produk baru
 */
function addProduct(product) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_PRODUK);
    
    // Auto-generate ID Produk jika kosong (PRD-XXX)
    var newId = product.id;
    if (!newId || newId.trim() === '') {
      var lastRow = sheet.getLastRow();
      newId = "PRD-" + ("000" + lastRow).slice(-3);
    }

    // Auto-generate Barcode jika kosong (899...)
    var barcode = product.barcode;
    if (!barcode || barcode.trim() === '') {
      barcode = "899" + Math.floor(1000000000 + Math.random() * 9000000000);
    }

    sheet.appendRow([
      newId,
      barcode,
      product.nama,
      product.kategori || 'Umum',
      product.satuan || 'Pcs',
      Number(product.hargaBeli) || 0,
      Number(product.hargaJual) || 0,
      Number(product.stok) || 0,
      Number(product.minStok) || 5,
      product.supplier || '',
      product.status || 'Aktif'
    ]);

    return { success: true, message: "Produk berhasil ditambahkan!", id: newId, barcode: barcode };
  } catch (err) {
    return { success: false, message: "Gagal menambah produk: " + err.message };
  }
}

/**
 * Mengubah data produk berdasarkan ID
 */
function updateProduct(product) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_PRODUK);
    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(product.id) || String(data[i][1]) === String(product.barcode)) {
        var rowNumber = i + 1;
        var updatedRow = [
          product.id,
          product.barcode,
          product.nama,
          product.kategori,
          product.satuan,
          Number(product.hargaBeli) || 0,
          Number(product.hargaJual) || 0,
          Number(product.stok) || 0,
          Number(product.minStok) || 5,
          product.supplier || '',
          product.status || 'Aktif'
        ];
        sheet.getRange(rowNumber, 1, 1, updatedRow.length).setValues([updatedRow]);
        return { success: true, message: "Data produk berhasil diperbarui!" };
      }
    }
    return { success: false, message: "Produk tidak ditemukan!" };
  } catch (err) {
    return { success: false, message: "Gagal memperbarui produk: " + err.message };
  }
}

/**
 * Menghapus produk berdasarkan ID
 */
function deleteProduct(productId) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_PRODUK);
    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(productId)) {
        sheet.deleteRow(i + 1);
        return { success: true, message: "Produk berhasil dihapus!" };
      }
    }
    return { success: false, message: "Produk tidak ditemukan!" };
  } catch (err) {
    return { success: false, message: "Gagal menghapus produk: " + err.message };
  }
}
`,
  },
  {
    name: 'Sales.gs',
    type: 'gs',
    description: 'Modul Penjualan (POS): Simpan transaksi multi-item, potong stok otomatis, generate nomor transaksi TRX-YYYYMMDD-XXX, dan riwayat.',
    content: `/**
 * ====================================================================
 * File: Sales.gs - Modul Penjualan (Point of Sale) & Transaksi
 * ====================================================================
 */

/**
 * Simpan transaksi penjualan dari Kasir (POS)
 * Mengurangi stok produk di Sheet Produk secara atomik
 * @param {object} transactionData { items, kasir, metodePembayaran, diskon, pelanggan }
 */
function saveSaleTransaction(transactionData) {
  var lock = LockService.getScriptLock();
  try {
    // Kunci proses selama max 15 detik agar tidak ada konflik pengurangan stok serentak
    lock.waitLock(15000);

    var ss = getSpreadsheet();
    var sheetSales = ss.getSheetByName(SHEET_PENJUALAN);
    var sheetProduk = ss.getSheetByName(SHEET_PRODUK);

    var now = new Date();
    var dateStr = Utilities.formatDate(now, Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd HH:mm:ss");
    var datePrefix = Utilities.formatDate(now, Session.getScriptTimeZone() || "GMT+7", "yyyyMMdd");
    
    // Generate No Transaksi otomatis: TRX-YYYYMMDD-001
    var lastRow = sheetSales.getLastRow();
    var noTransaksi = "TRX-" + datePrefix + "-" + ("000" + lastRow).slice(-3);

    var items = transactionData.items || [];
    if (items.length === 0) {
      return { success: false, message: "Keranjang belanja kosong!" };
    }

    // Ambil data produk untuk update stok
    var productData = sheetProduk.getDataRange().getValues();
    var stockMap = {}; // barcode -> row index
    for (var p = 1; p < productData.length; p++) {
      var barcode = String(productData[p][1]);
      stockMap[barcode] = {
        row: p + 1,
        currentStock: Number(productData[p][7]) || 0
      };
    }

    // Cek ketersediaan stok terlebih dahulu
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var bCode = String(item.barcode);
      if (stockMap[bCode]) {
        var available = stockMap[bCode].currentStock;
        if (available < item.qty) {
          return {
            success: false, 
            message: "Stok tidak mencukupi untuk " + item.nama + "! Stok tersedia: " + available
          };
        }
      }
    }

    // Catat setiap baris produk ke sheet Penjualan & kurangi stok
    var rowsToAppend = [];
    for (var j = 0; j < items.length; j++) {
      var itm = items[j];
      var bCodeJ = String(itm.barcode);
      var subtotal = (itm.qty * itm.harga) - (itm.diskon || 0);

      rowsToAppend.push([
        noTransaksi,
        dateStr,
        bCodeJ,
        itm.nama,
        itm.qty,
        itm.harga,
        itm.diskon || 0,
        subtotal,
        transactionData.kasir || "Kasir",
        transactionData.metodePembayaran || "Tunai"
      ]);

      // Kurangi stok di sheet Produk (Kolom 8 = Stok)
      if (stockMap[bCodeJ]) {
        var targetRow = stockMap[bCodeJ].row;
        var newStock = Math.max(0, stockMap[bCodeJ].currentStock - itm.qty);
        sheetProduk.getRange(targetRow, 8).setValue(newStock);
        stockMap[bCodeJ].currentStock = newStock;
      }
    }

    // Simpan semua baris transaksi sekaligus
    for (var r = 0; r < rowsToAppend.length; r++) {
      sheetSales.appendRow(rowsToAppend[r]);
    }

    return {
      success: true,
      message: "Transaksi berhasil disimpan!",
      noTransaksi: noTransaksi,
      tanggal: dateStr
    };
  } catch (err) {
    return { success: false, message: "Terjadi kesalahan transaksi: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Mengambil riwayat penjualan
 */
function getSalesHistory(limit) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_PENJUALAN);
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    var result = [];
    var maxRows = limit || 200;
    var start = Math.max(1, data.length - maxRows);

    for (var i = data.length - 1; i >= start; i--) {
      var row = data[i];
      if (!row[0]) continue;
      result.push({
        noTransaksi: String(row[0]),
        tanggal: String(row[1]),
        barcode: String(row[2]),
        nama: String(row[3]),
        qty: Number(row[4]) || 0,
        harga: Number(row[5]) || 0,
        diskon: Number(row[6]) || 0,
        subtotal: Number(row[7]) || 0,
        kasir: String(row[8]),
        metode: String(row[9])
      });
    }
    return result;
  } catch (err) {
    throw new Error("Gagal mengambil riwayat penjualan: " + err.message);
  }
}
`,
  },
  {
    name: 'Purchase.gs',
    type: 'gs',
    description: 'Modul Pembelian: Tambah pembelian dari supplier, auto-tambah stok produk di sheet Produk, dan cetak nota.',
    content: `/**
 * ====================================================================
 * File: Purchase.gs - Modul Pembelian & Restock Barang
 * ====================================================================
 */

/**
 * Simpan transaksi pembelian dari Supplier
 * Otomatis MENAMBAH stok produk di Sheet Produk
 */
function savePurchaseTransaction(purchaseData) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    var ss = getSpreadsheet();
    var sheetPurchase = ss.getSheetByName(SHEET_PEMBELIAN);
    var sheetProduk = ss.getSheetByName(SHEET_PRODUK);

    var now = new Date();
    var dateStr = Utilities.formatDate(now, Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd HH:mm:ss");
    var datePrefix = Utilities.formatDate(now, Session.getScriptTimeZone() || "GMT+7", "yyyyMMdd");
    
    // No Pembelian: PB-YYYYMMDD-001
    var lastRow = sheetPurchase.getLastRow();
    var noPembelian = "PB-" + datePrefix + "-" + ("000" + lastRow).slice(-3);

    var barcode = String(purchaseData.barcode);
    var qty = Number(purchaseData.qty) || 0;
    var hargaBeli = Number(purchaseData.hargaBeli) || 0;
    var total = qty * hargaBeli;

    // Catat ke Sheet Pembelian
    // Kolom: No Pembelian | Tanggal | Supplier | Barcode | Nama Produk | Qty | Harga Beli | Total
    sheetPurchase.appendRow([
      noPembelian,
      dateStr,
      purchaseData.supplier,
      barcode,
      purchaseData.namaProduk,
      qty,
      hargaBeli,
      total
    ]);

    // Tambah stok & update harga beli terbaru di Sheet Produk
    var productData = sheetProduk.getDataRange().getValues();
    for (var i = 1; i < productData.length; i++) {
      if (String(productData[i][1]) === barcode || String(productData[i][0]) === String(purchaseData.productId)) {
        var rowNumber = i + 1;
        var currentStock = Number(productData[i][7]) || 0;
        var newStock = currentStock + qty;
        
        // Update Stok (Kolom 8) dan Harga Beli (Kolom 6)
        sheetProduk.getRange(rowNumber, 8).setValue(newStock);
        if (hargaBeli > 0) {
          sheetProduk.getRange(rowNumber, 6).setValue(hargaBeli);
        }
        break;
      }
    }

    return {
      success: true,
      message: "Pembelian berhasil disimpan! Stok bertambah " + qty,
      noPembelian: noPembelian
    };
  } catch (err) {
    return { success: false, message: "Gagal menyimpan pembelian: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Mengambil riwayat pembelian
 */
function getPurchasesHistory() {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_PEMBELIAN);
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    var result = [];
    for (var i = data.length - 1; i >= 1; i--) {
      var row = data[i];
      if (!row[0]) continue;
      result.push({
        noPembelian: String(row[0]),
        tanggal: String(row[1]),
        supplier: String(row[2]),
        barcode: String(row[3]),
        namaProduk: String(row[4]),
        qty: Number(row[5]) || 0,
        hargaBeli: Number(row[6]) || 0,
        total: Number(row[7]) || 0
      });
    }
    return result;
  } catch (err) {
    throw new Error("Gagal mengambil riwayat pembelian: " + err.message);
  }
}
`,
  },
  {
    name: 'Report.gs',
    type: 'gs',
    description: 'Modul Laporan & Dashboard: Statistik KPI, Laporan Penjualan Harian/Bulanan, Pembelian, Stok, Laba Kotor, dan Produk Terlaris.',
    content: `/**
 * ====================================================================
 * File: Report.gs - Analitik Dashboard & Laporan Lengkap
 * ====================================================================
 */

/**
 * Mengambil ringkasan statistik untuk Dashboard KPI
 */
function getDashboardStats() {
  try {
    var ss = getSpreadsheet();
    var sheetProduk = ss.getSheetByName(SHEET_PRODUK);
    var sheetPenjualan = ss.getSheetByName(SHEET_PENJUALAN);
    var sheetPembelian = ss.getSheetByName(SHEET_PEMBELIAN);

    var now = new Date();
    var todayStr = Utilities.formatDate(now, Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd");

    // 1. Analisa Produk & Nilai Persediaan & Produk Menipis
    var pData = sheetProduk ? sheetProduk.getDataRange().getValues() : [];
    var totalProduk = 0;
    var nilaiPersediaan = 0;
    var produkHampirHabis = [];

    for (var i = 1; i < pData.length; i++) {
      if (!pData[i][0] && !pData[i][2]) continue;
      totalProduk++;
      var stok = Number(pData[i][7]) || 0;
      var minStok = Number(pData[i][8]) || 5;
      var hBeli = Number(pData[i][5]) || 0;

      nilaiPersediaan += (stok * hBeli);

      if (stok <= minStok) {
        produkHampirHabis.push({
          id: pData[i][0],
          barcode: pData[i][1],
          nama: pData[i][2],
          stok: stok,
          minStok: minStok
        });
      }
    }

    // 2. Analisa Penjualan Hari Ini & Produk Terlaris
    var sData = sheetPenjualan ? sheetPenjualan.getDataRange().getValues() : [];
    var penjualanHariIni = 0;
    var topSellingMap = {};

    for (var j = 1; j < sData.length; j++) {
      var rowDate = String(sData[j][1]);
      var subtotal = Number(sData[j][7]) || 0;
      var namaItem = String(sData[j][3] || 'Lainnya');
      var qtyItem = Number(sData[j][4]) || 0;

      if (rowDate.indexOf(todayStr) !== -1) {
        penjualanHariIni += subtotal;
      }

      if (!topSellingMap[namaItem]) topSellingMap[namaItem] = 0;
      topSellingMap[namaItem] += qtyItem;
    }

    // Sort Top Selling
    var topSellingList = Object.keys(topSellingMap).map(function(nama) {
      return { nama: nama, qty: topSellingMap[nama] };
    }).sort(function(a, b) { return b.qty - a.qty; }).slice(0, 5);

    // 3. Analisa Total Pembelian
    var bData = sheetPembelian ? sheetPembelian.getDataRange().getValues() : [];
    var totalPembelian = 0;
    for (var k = 1; k < bData.length; k++) {
      totalPembelian += (Number(bData[k][7]) || 0);
    }

    return {
      totalProduk: totalProduk,
      penjualanHariIni: penjualanHariIni,
      totalPembelian: totalPembelian,
      nilaiPersediaan: nilaiPersediaan,
      jumlahHampirHabis: produkHampirHabis.length,
      produkHampirHabis: produkHampirHabis,
      topSelling: topSellingList
    };
  } catch (err) {
    throw new Error("Gagal memuat statistik dashboard: " + err.message);
  }
}

/**
 * Menghitung Laporan Laba Kotor (Revenue - HPP)
 */
function getProfitReport(startDate, endDate) {
  try {
    var ss = getSpreadsheet();
    var sheetSales = ss.getSheetByName(SHEET_PENJUALAN);
    var sheetProduk = ss.getSheetByName(SHEET_PRODUK);

    var pData = sheetProduk.getDataRange().getValues();
    var hppMap = {}; // barcode -> hargaBeli
    for (var i = 1; i < pData.length; i++) {
      hppMap[String(pData[i][1])] = Number(pData[i][5]) || 0;
    }

    var sData = sheetSales.getDataRange().getValues();
    var totalPendapatan = 0;
    var totalHPP = 0;
    var detail = [];

    for (var j = 1; j < sData.length; j++) {
      var dateStr = String(sData[j][1]).substring(0, 10);
      if (startDate && dateStr < startDate) continue;
      if (endDate && dateStr > endDate) continue;

      var barcode = String(sData[j][2]);
      var qty = Number(sData[j][4]) || 0;
      var subtotal = Number(sData[j][7]) || 0;
      var hppPerUnit = hppMap[barcode] || 0;
      var itemHPP = hppPerUnit * qty;
      var labaKotor = subtotal - itemHPP;

      totalPendapatan += subtotal;
      totalHPP += itemHPP;

      detail.push({
        noTransaksi: sData[j][0],
        tanggal: sData[j][1],
        nama: sData[j][3],
        qty: qty,
        penjualan: subtotal,
        hpp: itemHPP,
        laba: labaKotor
      });
    }

    return {
      totalPendapatan: totalPendapatan,
      totalHPP: totalHPP,
      totalLabaKotor: totalPendapatan - totalHPP,
      marginPersen: totalPendapatan > 0 ? ((totalPendapatan - totalHPP) / totalPendapatan * 100).toFixed(1) : 0,
      detail: detail
    };
  } catch (err) {
    throw new Error("Gagal menghitung laporan laba: " + err.message);
  }
}
`,
  },
  {
    name: 'Utils.gs',
    type: 'gs',
    description: 'Utility helper: CRUD Supplier & Pelanggan, Format Rupiah, Backup Spreadsheet ke Google Drive.',
    content: `/**
 * ====================================================================
 * File: Utils.gs - Helper Utilities, Master Data, & Backup Drive
 * ====================================================================
 */

/**
 * Mengambil master data Supplier
 */
function getSuppliers() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_SUPPLIER);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  var list = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i][0] && !data[i][1]) continue;
    list.push({
      id: String(data[i][0]),
      nama: String(data[i][1]),
      alamat: String(data[i][2]),
      telepon: String(data[i][3]),
      email: String(data[i][4])
    });
  }
  return list;
}

/**
 * Tambah Supplier
 */
function addSupplier(supplier) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_SUPPLIER);
  var id = supplier.id || ("SUP-" + ("000" + sheet.getLastRow()).slice(-3));
  sheet.appendRow([id, supplier.nama, supplier.alamat, supplier.telepon, supplier.email]);
  return { success: true, message: "Supplier berhasil disimpan!" };
}

/**
 * Mengambil master data Pelanggan
 */
function getPelanggan() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_PELANGGAN);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  var list = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i][0] && !data[i][1]) continue;
    list.push({
      id: String(data[i][0]),
      nama: String(data[i][1]),
      telepon: String(data[i][2]),
      alamat: String(data[i][3])
    });
  }
  return list;
}

/**
 * Tambah Pelanggan
 */
function addPelanggan(cust) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_PELANGGAN);
  var id = cust.id || ("CUST-" + ("000" + sheet.getLastRow()).slice(-3));
  sheet.appendRow([id, cust.nama, cust.telepon, cust.alamat]);
  return { success: true, message: "Pelanggan berhasil disimpan!" };
}

/**
 * Backup Spreadsheet ke folder Google Drive otomatis
 */
function backupSpreadsheetToDrive() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var fileId = ss.getId();
    var file = DriveApp.getFileById(fileId);
    
    var timeStamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd_HH-mm");
    var backupName = "[BACKUP] " + ss.getName() + " (" + timeStamp + ")";
    
    var backupFile = file.makeCopy(backupName);
    return {
      success: true,
      message: "Backup berhasil dibuat di Google Drive: " + backupName,
      url: backupFile.getUrl()
    };
  } catch (err) {
    return { success: false, message: "Gagal backup data: " + err.message };
  }
}

/**
 * PEMBERSIHAN DATA TRANSAKSI (CLEAR TRANSACTION DATA)
 * Mengosongkan data baris di sheet Penjualan dan/atau Pembelian
 * Menyisakan baris header (Baris 1) tetap utuh
 * @param {string} target 'penjualan' | 'pembelian' | 'semua'
 */
function clearTransactionData(target) {
  try {
    var ss = getSpreadsheet();
    var msg = [];

    if (target === 'penjualan' || target === 'semua') {
      var sheetSales = ss.getSheetByName(SHEET_PENJUALAN);
      if (sheetSales && sheetSales.getLastRow() > 1) {
        var numRows = sheetSales.getLastRow() - 1;
        sheetSales.deleteRows(2, numRows);
        msg.push("Riwayat Penjualan (" + numRows + " baris) berhasil dikosongkan");
      }
    }

    if (target === 'pembelian' || target === 'semua') {
      var sheetPurchases = ss.getSheetByName(SHEET_PEMBELIAN);
      if (sheetPurchases && sheetPurchases.getLastRow() > 1) {
        var pRows = sheetPurchases.getLastRow() - 1;
        sheetPurchases.deleteRows(2, pRows);
        msg.push("Riwayat Pembelian (" + pRows + " baris) berhasil dikosongkan");
      }
    }

    return {
      success: true,
      message: msg.length > 0 ? msg.join(". ") : "Data transaksi sudah kosong."
    };
  } catch (err) {
    return { success: false, message: "Gagal membersihkan data transaksi: " + err.message };
  }
}
`,
  },
  {
    name: 'Index.html',
    type: 'html',
    description: 'HTML Master Template Apps Script dengan Bootstrap 5, FontAwesome/Bootstrap Icons, Sidebar, dan Header Nav.',
    content: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TokoApps - Sistem Kasir & Toko Spreadsheet</title>
  <!-- Bootstrap 5 CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <!-- Bootstrap Icons -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <!-- Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <!-- SweetAlert2 -->
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  <!-- JsBarcode -->
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
  
  <?!= include('Style'); ?>
</head>
<body class="bg-light">

  <!-- Modal Login -->
  <?!= include('Login'); ?>

  <!-- Wrapper Utama Aplikasi -->
  <div id="appContainer" class="d-none">
    <!-- Navbar Header -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-slate sticky-top shadow-sm">
      <div class="container-fluid">
        <button class="btn btn-outline-light me-2 d-lg-none" type="button" id="toggleSidebar">
          <i class="bi bi-list"></i>
        </button>
        <a class="navbar-brand fw-bold d-flex align-items-center gap-2" href="#">
          <i class="bi bi-shop text-warning"></i>
          <span>TOKO BERKAH JAYA</span>
        </a>
        <div class="d-flex align-items-center gap-3 ms-auto">
          <div class="text-white text-end d-none d-sm-block">
            <div id="navUserName" class="fw-semibold small">Kasir Dewi</div>
            <span id="navUserRole" class="badge bg-primary">Kasir</span>
          </div>
          <button class="btn btn-sm btn-outline-danger" onclick="logoutUserUI()">
            <i class="bi bi-box-arrow-right"></i> Keluar
          </button>
        </div>
      </div>
    </nav>

    <!-- Layout: Sidebar + Main Content -->
    <div class="container-fluid">
      <div class="row">
        <!-- Sidebar Navigation -->
        <nav id="sidebarMenu" class="col-md-3 col-lg-2 d-md-block bg-white sidebar shadow-sm p-3">
          <div class="position-sticky">
            <ul class="nav flex-column gap-1" id="navMenuList">
              <li class="nav-item">
                <a class="nav-link active" href="#" onclick="showPage('dashboard')">
                  <i class="bi bi-speedometer2 me-2"></i> Dashboard
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link text-primary fw-semibold" href="#" onclick="showPage('penjualan')">
                  <i class="bi bi-cart4 me-2"></i> Kasir (POS)
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" onclick="showPage('produk')">
                  <i class="bi bi-box-seam me-2"></i> Kelola Produk
                </a>
              </li>
              <li class="nav-item admin-only">
                <a class="nav-link" href="#" onclick="showPage('pembelian')">
                  <i class="bi bi-bag-plus me-2"></i> Pembelian Stok
                </a>
              </li>
              <li class="nav-item admin-only">
                <a class="nav-link" href="#" onclick="showPage('supplier')">
                  <i class="bi bi-truck me-2"></i> Supplier
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" onclick="showPage('pelanggan')">
                  <i class="bi bi-people me-2"></i> Pelanggan
                </a>
              </li>
              <li class="nav-item admin-only">
                <a class="nav-link" href="#" onclick="showPage('laporan')">
                  <i class="bi bi-file-earmark-bar-graph me-2"></i> Laporan
                </a>
              </li>
            </ul>
          </div>
        </nav>

        <!-- Dynamic Main Content Area -->
        <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4" id="mainContent">
          <div id="page-dashboard"><?!= include('Dashboard'); ?></div>
          <div id="page-penjualan" class="d-none"><?!= include('Penjualan'); ?></div>
          <div id="page-produk" class="d-none"><?!= include('Produk'); ?></div>
          <div id="page-pembelian" class="d-none"><?!= include('Pembelian'); ?></div>
          <div id="page-supplier" class="d-none"><?!= include('Supplier'); ?></div>
          <div id="page-pelanggan" class="d-none"><?!= include('Pelanggan'); ?></div>
          <div id="page-laporan" class="d-none"><?!= include('Laporan'); ?></div>
        </main>
      </div>
    </div>
  </div>

  <!-- Bootstrap 5 Bundle JS -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  
  <?!= include('Script'); ?>
</body>
</html>
`,
  },
  {
    name: 'Login.html',
    type: 'html',
    description: 'Modal login HTML yang modern dengan validasi kredensial pengguna.',
    content: `<!-- Login Overlay -->
<div id="loginSection" class="min-vh-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-75 position-fixed top-0 start-0 w-100 z-3">
  <div class="card shadow-lg border-0" style="max-width: 420px; width: 90%;">
    <div class="card-body p-4 text-center">
      <div class="mb-3 text-primary">
        <i class="bi bi-shop-window" style="font-size: 3rem;"></i>
      </div>
      <h4 class="fw-bold text-slate">Masuk ke TokoApp</h4>
      <p class="text-muted small">Sistem POS & Inventori Google Spreadsheet</p>

      <form id="formLogin" onsubmit="handleLoginSubmit(event)" class="text-start mt-3">
        <div class="mb-3">
          <label class="form-label small fw-semibold">Username</label>
          <div class="input-group">
            <span class="input-group-text"><i class="bi bi-person"></i></span>
            <input type="text" id="loginUser" class="form-control" placeholder="admin atau kasir" required>
          </div>
        </div>

        <div class="mb-3">
          <label class="form-label small fw-semibold">Password</label>
          <div class="input-group">
            <span class="input-group-text"><i class="bi bi-key"></i></span>
            <input type="password" id="loginPass" class="form-control" placeholder="Password" required>
          </div>
        </div>

        <div class="alert alert-info py-2 small mb-3">
          <strong>Info Akun Bawaan:</strong><br>
          • <strong>admin</strong> / <code>admin123</code> (Admin)<br>
          • <strong>kasir</strong> / <code>kasir123</code> (Kasir)
        </div>

        <button type="submit" id="btnLoginSubmit" class="btn btn-primary w-100 py-2 fw-semibold">
          <span id="loginSpinner" class="spinner-border spinner-border-sm d-none me-1"></span>
          Masuk ke Sistem
        </button>
      </form>
    </div>
  </div>
</div>
`,
  },
  {
    name: 'Dashboard.html',
    type: 'html',
    description: 'Dashboard KPI cards, produk hampir habis, dan grafik penjualan bulanan.',
    content: `<div class="d-flex justify-content-between align-items-center mb-4">
  <h3 class="fw-bold mb-0">Dashboard Ringkasan</h3>
  <button class="btn btn-outline-primary btn-sm" onclick="loadDashboardData()">
    <i class="bi bi-arrow-clockwise"></i> Segarkan Data
  </button>
</div>

<!-- 4 KPI Cards -->
<div class="row g-3 mb-4">
  <div class="col-sm-6 col-xl-3">
    <div class="card border-0 shadow-sm border-start border-primary border-4">
      <div class="card-body">
        <div class="text-muted small fw-semibold">TOTAL PRODUK</div>
        <div class="fs-4 fw-bold mt-1" id="dashTotalProduk">0</div>
        <div class="small text-muted">Item terdaftar di sheet</div>
      </div>
    </div>
  </div>
  <div class="col-sm-6 col-xl-3">
    <div class="card border-0 shadow-sm border-start border-success border-4">
      <div class="card-body">
        <div class="text-muted small fw-semibold">PENJUALAN HARI INI</div>
        <div class="fs-4 fw-bold mt-1 text-success" id="dashPenjualanHariIni">Rp 0</div>
        <div class="small text-muted">Transaksi kasir hari ini</div>
      </div>
    </div>
  </div>
  <div class="col-sm-6 col-xl-3">
    <div class="card border-0 shadow-sm border-start border-info border-4">
      <div class="card-body">
        <div class="text-muted small fw-semibold">NILAI PERSEDIAAN</div>
        <div class="fs-4 fw-bold mt-1 text-info" id="dashNilaiPersediaan">Rp 0</div>
        <div class="small text-muted">Aset stok berdasarkan HPP</div>
      </div>
    </div>
  </div>
  <div class="col-sm-6 col-xl-3">
    <div class="card border-0 shadow-sm border-start border-danger border-4">
      <div class="card-body">
        <div class="text-muted small fw-semibold">STOK MENIPIS</div>
        <div class="fs-4 fw-bold mt-1 text-danger" id="dashStokMenipis">0 Item</div>
        <div class="small text-danger">Perlu segera di-restock</div>
      </div>
    </div>
  </div>
</div>

<!-- Charts & Tables -->
<div class="row g-3">
  <div class="col-lg-8">
    <div class="card border-0 shadow-sm">
      <div class="card-header bg-white fw-bold py-3">Grafik Penjualan Bulanan</div>
      <div class="card-body">
        <canvas id="chartPenjualan" height="130"></canvas>
      </div>
    </div>
  </div>
  <div class="col-lg-4">
    <div class="card border-0 shadow-sm">
      <div class="card-header bg-white fw-bold py-3 text-danger">
        <i class="bi bi-exclamation-triangle"></i> Produk Hampir Habis
      </div>
      <div class="card-body p-0">
        <div class="list-group list-group-flush" id="listHampirHabis">
          <div class="p-3 text-center text-muted small">Memuat data stok...</div>
        </div>
      </div>
    </div>
  </div>
</div>
`,
  },
  {
    name: 'Penjualan.html',
    type: 'html',
    description: 'Modul Kasir POS: Pencarian cepat, scan barcode, keranjang, multi-pembayaran, dan cetak struk kasir.',
    content: `<div class="row g-3">
  <!-- Kolom Kiri: Katalog & Scan Produk -->
  <div class="col-lg-7">
    <div class="card border-0 shadow-sm mb-3">
      <div class="card-body">
        <div class="input-group mb-3">
          <span class="input-group-text bg-white"><i class="bi bi-upc-scan text-primary"></i></span>
          <input type="text" id="posBarcodeScan" class="form-control" placeholder="Scan Barcode atau ketik nama produk... (Tekan Enter)" autofocus>
          <button class="btn btn-outline-secondary" type="button" onclick="filterPosProducts()">Cari</button>
        </div>
        <div class="d-flex gap-2 overflow-auto pb-2" id="posCategoryChips">
          <button class="btn btn-sm btn-dark" onclick="filterCategory('')">Semua</button>
          <button class="btn btn-sm btn-outline-secondary" onclick="filterCategory('Sembako')">Sembako</button>
          <button class="btn btn-sm btn-outline-secondary" onclick="filterCategory('Minuman')">Minuman</button>
          <button class="btn btn-sm btn-outline-secondary" onclick="filterCategory('Makanan Instan')">Makanan Instan</button>
        </div>
      </div>
    </div>

    <!-- Product Grid for Quick Tap -->
    <div class="row g-2 overflow-auto" style="max-height: 520px;" id="posProductGrid">
      <!-- Diisi otomatis oleh JavaScript -->
    </div>
  </div>

  <!-- Kolom Kanan: Keranjang Belanja & Pembayaran -->
  <div class="col-lg-5">
    <div class="card border-0 shadow-sm sticky-top" style="top: 80px;">
      <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
        <h5 class="fw-bold mb-0"><i class="bi bi-cart3 text-primary"></i> Keranjang Kasir</h5>
        <button class="btn btn-sm btn-outline-danger" onclick="clearCart()">Kosongkan</button>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive" style="max-height: 280px;">
          <table class="table table-sm align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>Produk</th>
                <th class="text-center" width="90">Qty</th>
                <th class="text-end">Subtotal</th>
                <th width="30"></th>
              </tr>
            </thead>
            <tbody id="cartTableBody">
              <tr><td colspan="4" class="text-center py-4 text-muted">Keranjang masih kosong</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Ringkasan Bayar -->
      <div class="card-footer bg-light p-3 border-top">
        <div class="d-flex justify-content-between mb-1">
          <span class="text-muted">Subtotal:</span>
          <span class="fw-semibold" id="cartSubtotalText">Rp 0</span>
        </div>
        <div class="d-flex justify-content-between mb-1">
          <span class="text-muted">Diskon:</span>
          <span class="text-danger fw-semibold" id="cartDiskonText">Rp 0</span>
        </div>
        <hr class="my-2">
        <div class="d-flex justify-content-between fs-4 fw-bold text-primary mb-3">
          <span>TOTAL:</span>
          <span id="cartTotalText">Rp 0</span>
        </div>

        <button class="btn btn-success btn-lg w-100 fw-bold py-2 shadow-sm" onclick="openCheckoutModal()">
          <i class="bi bi-cash-stack me-2"></i> BAYAR SEKARANG
        </button>
      </div>
    </div>
  </div>
</div>
`,
  },
  {
    name: 'Produk.html',
    type: 'html',
    description: 'Modul Manajemen Produk: Tabel interaktif, filter, form tambah/edit produk, barcode generator, cetak katalog.',
    content: `<div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
  <h3 class="fw-bold mb-0">Kelola Data Produk</h3>
  <div class="d-flex gap-2">
    <button class="btn btn-outline-secondary btn-sm" onclick="printProductList()">
      <i class="bi bi-printer"></i> Cetak Daftar
    </button>
    <button class="btn btn-primary btn-sm" onclick="openProductModal()">
      <i class="bi bi-plus-circle"></i> Tambah Produk
    </button>
  </div>
</div>

<!-- Card Filter & Search -->
<div class="card border-0 shadow-sm mb-3">
  <div class="card-body">
    <div class="row g-2">
      <div class="col-md-6">
        <input type="text" id="searchProductInput" class="form-control form-control-sm" placeholder="Cari nama atau barcode..." onkeyup="filterProductTable()">
      </div>
      <div class="col-md-3">
        <select id="filterProductCategory" class="form-select form-select-sm" onchange="filterProductTable()">
          <option value="">Semua Kategori</option>
        </select>
      </div>
      <div class="col-md-3">
        <select id="filterProductStock" class="form-select form-select-sm" onchange="filterProductTable()">
          <option value="">Semua Status Stok</option>
          <option value="low">Stok Menipis (<= Min)</option>
        </select>
      </div>
    </div>
  </div>
</div>

<!-- Tabel Produk -->
<div class="card border-0 shadow-sm">
  <div class="card-body p-0">
    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0" id="tableProdukMaster">
        <thead class="table-light">
          <tr>
            <th>ID / Barcode</th>
            <th>Nama Produk</th>
            <th>Kategori</th>
            <th>Harga Beli</th>
            <th>Harga Jual</th>
            <th class="text-center">Stok</th>
            <th>Supplier</th>
            <th class="text-end">Aksi</th>
          </tr>
        </thead>
        <tbody id="tbodyProduk">
          <tr><td colspan="8" class="text-center py-4 text-muted">Memuat data produk dari spreadsheet...</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
`,
  },
  {
    name: 'Pembelian.html',
    type: 'html',
    description: 'Modul Pembelian Barang dari Supplier dengan penambahan stok otomatis.',
    content: `<div class="d-flex justify-content-between align-items-center mb-3">
  <h3 class="fw-bold mb-0">Pembelian & Restock Barang</h3>
  <button class="btn btn-primary btn-sm" onclick="openPurchaseModal()">
    <i class="bi bi-plus-lg"></i> Buat Nota Pembelian
  </button>
</div>

<div class="card border-0 shadow-sm">
  <div class="card-body p-0">
    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th>No Pembelian</th>
            <th>Tanggal</th>
            <th>Supplier</th>
            <th>Nama Produk</th>
            <th class="text-center">Qty Masuk</th>
            <th>Harga Beli</th>
            <th>Total Pembelian</th>
          </tr>
        </thead>
        <tbody id="tbodyPembelian">
          <tr><td colspan="7" class="text-center py-4 text-muted">Memuat riwayat pembelian...</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
`,
  },
  {
    name: 'Supplier.html',
    type: 'html',
    description: 'Modul Supplier CRUD.',
    content: `<div class="d-flex justify-content-between align-items-center mb-3">
  <h3 class="fw-bold mb-0">Data Supplier</h3>
  <button class="btn btn-primary btn-sm" onclick="openSupplierModal()">
    <i class="bi bi-plus-lg"></i> Tambah Supplier
  </button>
</div>

<div class="card border-0 shadow-sm">
  <div class="card-body p-0">
    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th>ID</th>
            <th>Nama Supplier</th>
            <th>Alamat</th>
            <th>Telepon</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody id="tbodySupplier">
          <tr><td colspan="5" class="text-center py-4 text-muted">Memuat supplier...</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
`,
  },
  {
    name: 'Pelanggan.html',
    type: 'html',
    description: 'Modul Pelanggan CRUD.',
    content: `<div class="d-flex justify-content-between align-items-center mb-3">
  <h3 class="fw-bold mb-0">Data Pelanggan (Member)</h3>
  <button class="btn btn-primary btn-sm" onclick="openPelangganModal()">
    <i class="bi bi-plus-lg"></i> Tambah Pelanggan
  </button>
</div>

<div class="card border-0 shadow-sm">
  <div class="card-body p-0">
    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th>ID</th>
            <th>Nama Pelanggan</th>
            <th>Telepon</th>
            <th>Alamat</th>
          </tr>
        </thead>
        <tbody id="tbodyPelanggan">
          <tr><td colspan="4" class="text-center py-4 text-muted">Memuat data pelanggan...</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
`,
  },
  {
    name: 'Laporan.html',
    type: 'html',
    description: 'Modul Laporan Penjualan, Laba Kotor, Valuasi Stok, dan Export.',
    content: `<div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 no-print">
  <div>
    <h3 class="fw-bold mb-0"><i class="bi bi-file-earmark-bar-graph text-primary"></i> Laporan Keuangan & Analisa Laba Rugi</h3>
    <small class="text-muted">Perhitungan resmi laba kotor, HPP, omset, dan valuasi aset persediaan.</small>
  </div>
  <div class="d-flex gap-2">
    <button class="btn btn-outline-success btn-sm" onclick="exportReportToExcel()">
      <i class="bi bi-file-earmark-spreadsheet"></i> Ekspor CSV/Excel
    </button>
    <button class="btn btn-primary btn-sm shadow-sm" onclick="printFormalFinancialReport()">
      <i class="bi bi-printer-fill"></i> Cetak Laporan Resmi
    </button>
  </div>
</div>

<!-- Filter Tanggal (Excluded from print) -->
<div class="card border-0 shadow-sm mb-4 no-print">
  <div class="card-body">
    <div class="row g-2 align-items-end">
      <div class="col-md-4">
        <label class="form-label small fw-semibold">Tanggal Mulai</label>
        <input type="date" id="reportStartDate" class="form-control form-control-sm">
      </div>
      <div class="col-md-4">
        <label class="form-label small fw-semibold">Tanggal Selesai</label>
        <input type="date" id="reportEndDate" class="form-control form-control-sm">
      </div>
      <div class="col-md-4">
        <button class="btn btn-primary btn-sm w-100" onclick="loadFinancialReport()">
          <i class="bi bi-filter"></i> Terapkan Filter
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Highlight Keuangan di Layar -->
<div class="row g-3 mb-4 no-print">
  <div class="col-md-4">
    <div class="card border-0 shadow-sm bg-primary text-white">
      <div class="card-body">
        <div class="small opacity-75">TOTAL PENDAPATAN (OMSET)</div>
        <div class="fs-4 fw-bold mt-1" id="reportOmset">Rp 0</div>
      </div>
    </div>
  </div>
  <div class="col-md-4">
    <div class="card border-0 shadow-sm bg-secondary text-white">
      <div class="card-body">
        <div class="small opacity-75">HARGA POKOK PENJUALAN (HPP)</div>
        <div class="fs-4 fw-bold mt-1" id="reportHPP">Rp 0</div>
      </div>
    </div>
  </div>
  <div class="col-md-4">
    <div class="card border-0 shadow-sm bg-success text-white">
      <div class="card-body">
        <div class="small opacity-75">ESTIMASI LABA KOTOR</div>
        <div class="fs-4 fw-bold mt-1" id="reportLabaKotor">Rp 0</div>
      </div>
    </div>
  </div>
</div>

<!-- AREA DOKUMEN CETAK RESMI (FORMAL PRINTABLE FINANCIAL REPORT) -->
<div id="printableFinancialDoc" class="card border-0 shadow-sm p-4 p-md-5 bg-white">
  <!-- KOP SURAT RESMI -->
  <div class="d-flex justify-content-between align-items-center pb-3 border-bottom border-dark border-3">
    <div>
      <h2 class="fw-bolder mb-0 text-uppercase" style="letter-spacing: -0.5px;">TOKO BERKAH JAYA</h2>
      <p class="text-muted small mb-0 fw-semibold">SISTEM KASIR & PENGELOLAAN INVENTORI TOKO TERPADU</p>
      <small class="text-secondary">Jl. Pemuda No. 45, Kebayoran Baru, Jakarta Selatan • Telp: 0812-3456-7890</small>
    </div>
    <div class="text-end d-none d-sm-block">
      <span class="badge bg-dark px-3 py-2 text-uppercase">DOKUMEN RESMI TOKO</span>
    </div>
  </div>
  <div style="border-bottom: 1px solid #000; margin-top: 2px; margin-bottom: 20px;"></div>

  <!-- JUDUL DOKUMEN & METADATA -->
  <div class="text-center my-3">
    <h4 class="fw-bold text-uppercase text-decoration-underline mb-1">LAPORAN KEUANGAN & REKAPITULASI LABA RUGI</h4>
    <div class="small text-muted" id="printReportPeriode">Periode: Semua Data Transaksi Tercatat</div>
  </div>

  <div class="bg-light p-2 rounded mb-3 small">
    <div class="row g-2">
      <div class="col-6 col-sm-3"><strong>No. Dokumen:</strong> <span id="printDocNumber">RPT-FIN-001</span></div>
      <div class="col-6 col-sm-3"><strong>Tanggal Cetak:</strong> <span id="printDocDate">-</span></div>
      <div class="col-6 col-sm-3"><strong>Petugas:</strong> <span id="printDocUser">Administrator</span></div>
      <div class="col-6 col-sm-3"><strong>Status:</strong> Terverifikasi Spreadsheet</div>
    </div>
  </div>

  <!-- TABEL RINCIAN -->
  <div class="table-responsive my-3">
    <table class="table table-bordered table-sm align-middle text-nowrap" id="tablePrintReportDetail" style="font-size: 11px;">
      <thead class="table-dark text-center">
        <tr>
          <th>No</th>
          <th>No Transaksi</th>
          <th>Tanggal</th>
          <th>Item Produk</th>
          <th>Qty</th>
          <th>Harga Jual</th>
          <th>HPP (Modal)</th>
          <th>Subtotal Omset</th>
          <th>Laba Kotor</th>
        </tr>
      </thead>
      <tbody id="tbodyReportDetail">
        <tr><td colspan="9" class="text-center py-3 text-muted">Memuat data transaksi keuangan...</td></tr>
      </tbody>
      <tfoot class="table-light fw-bold">
        <tr>
          <td colspan="4" class="text-end">TOTAL KESELURUHAN:</td>
          <td class="text-center" id="printTotalQty">0</td>
          <td colspan="2" class="text-end" id="printTotalHPP">HPP: Rp 0</td>
          <td class="text-end text-primary" id="printGrandOmset">Rp 0</td>
          <td class="text-end text-success" id="printGrandLaba">Rp 0</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <!-- LEMBAR TANDA TANGAN / PENGESAHAN -->
  <div class="mt-4 pt-3 border-top">
    <div class="d-flex justify-content-between text-center small">
      <div style="width: 200px;">
        <div class="text-muted">Dibuat Oleh,</div>
        <div class="fw-bold mt-1">Bagian Keuangan / Kasir</div>
        <div style="height: 55px;" class="d-flex align-items-end justify-content-center text-muted fst-italic">[Tanda Tangan]</div>
        <hr class="my-1">
        <div class="fw-bold" id="signKasirName">Dewi Rahayu</div>
      </div>
      <div style="width: 200px;">
        <div class="text-muted">Jakarta, <span id="signDate"></span></div>
        <div class="fw-bold mt-1">Mengetahui, Pemilik Toko</div>
        <div style="height: 55px;" class="d-flex align-items-end justify-content-center text-muted fst-italic">[Tanda Tangan]</div>
        <hr class="my-1">
        <div class="fw-bold">Pimpinan / Manajemen</div>
      </div>
    </div>
  </div>
</div>
`,
  },
  {
    name: 'Style.html',
    type: 'html',
    description: 'Stylesheet khusus untuk UI modern, tampilan struk cetak kasir, dan dark mode.',
    content: `<style>
  :root {
    --bs-font-sans-serif: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }
  body {
    font-family: var(--bs-font-sans-serif);
    background-color: #f8fafc;
    color: #1e293b;
  }
  .bg-slate {
    background-color: #0f172a !important;
  }
  .sidebar {
    min-height: calc(100vh - 56px);
  }
  .sidebar .nav-link {
    color: #475569;
    border-radius: 6px;
    padding: 0.6rem 0.8rem;
    font-weight: 500;
  }
  .sidebar .nav-link:hover {
    background-color: #f1f5f9;
    color: #0f172a;
  }
  .sidebar .nav-link.active {
    background-color: #e2e8f0;
    color: #0f172a;
    font-weight: 600;
  }
  .card {
    border-radius: 10px;
  }

  /* Thermal Receipt Printing & Official Financial Report Print Styling */
  @media print {
    /* Sembunyikan elemen navigasi dan tombol saat print */
    .no-print,
    header,
    nav,
    aside,
    #sidebarMenu,
    .navbar,
    .btn {
      display: none !important;
    }

    body {
      background-color: #ffffff !important;
      color: #000000 !important;
      font-size: 10pt;
    }

    #appContainer,
    #mainContent {
      padding: 0 !important;
      margin: 0 !important;
      width: 100% !important;
    }

    #printableFinancialDoc {
      display: block !important;
      box-shadow: none !important;
      border: none !important;
      padding: 0 !important;
      width: 100% !important;
    }

    #printableFinancialDoc table th,
    #printableFinancialDoc table td {
      border: 1px solid #94a3b8 !important;
      padding: 4px 6px !important;
    }

    #printReceiptArea {
      position: absolute;
      left: 0;
      top: 0;
      width: 78mm;
      padding: 5mm;
      font-size: 11px;
      font-family: 'Courier New', Courier, monospace;
      color: #000;
    }

    @page {
      size: A4 portrait;
      margin: 15mm 10mm 15mm 10mm;
    }
  }
</style>
`,
  },
  {
    name: 'Script.html',
    type: 'html',
    description: 'Frontend JavaScript murni (Vanilla JS) dengan pemanggilan google.script.run dan penanganan UI reaktif.',
    content: `<script>
  // State Global Frontend
  var currentUser = null;
  var cart = [];
  var productsList = [];

  // Inisialisasi saat halaman dimuat
  window.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
  });

  function checkUserSession() {
    google.script.run
      .withSuccessHandler(function(res) {
        if (res && res.isLoggedIn && res.user) {
          onLoginSuccess(res.user);
        } else {
          document.getElementById('loginSection').classList.remove('d-none');
        }
      })
      .withFailureHandler(function() {
        document.getElementById('loginSection').classList.remove('d-none');
      })
      .checkSession();
  }

  function handleLoginSubmit(e) {
    e.preventDefault();
    var u = document.getElementById('loginUser').value.trim();
    var p = document.getElementById('loginPass').value.trim();
    var spin = document.getElementById('loginSpinner');
    var btn = document.getElementById('btnLoginSubmit');

    spin.classList.remove('d-none');
    btn.disabled = true;

    google.script.run
      .withSuccessHandler(function(res) {
        spin.classList.add('d-none');
        btn.disabled = false;
        if (res.success) {
          Swal.fire('Berhasil!', res.message, 'success');
          onLoginSuccess(res.user);
        } else {
          Swal.fire('Gagal Masuk', res.message, 'error');
        }
      })
      .withFailureHandler(function(err) {
        spin.classList.add('d-none');
        btn.disabled = false;
        Swal.fire('Error', err.message, 'error');
      })
      .loginUser(u, p);
  }

  function onLoginSuccess(user) {
    currentUser = user;
    document.getElementById('loginSection').classList.add('d-none');
    document.getElementById('appContainer').classList.remove('d-none');
    document.getElementById('navUserName').innerText = user.nama;
    document.getElementById('navUserRole').innerText = user.role;

    // Filter menu berdasarkan Role (Kasir vs Admin)
    var adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(function(el) {
      if (user.role === 'Kasir') {
        el.style.display = 'none';
      } else {
        el.style.display = 'block';
      }
    });

    loadDashboardData();
    loadProducts();
  }

  function logoutUserUI() {
    Swal.fire({
      title: 'Keluar dari aplikasi?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Keluar'
    }).then(function(result) {
      if (result.isConfirmed) {
        google.script.run
          .withSuccessHandler(function() {
            location.reload();
          })
          .logoutUser();
      }
    });
  }

  function showPage(pageId) {
    var pages = ['dashboard', 'penjualan', 'produk', 'pembelian', 'supplier', 'pelanggan', 'laporan'];
    pages.forEach(function(p) {
      var el = document.getElementById('page-' + p);
      if (el) el.classList.add('d-none');
    });

    var target = document.getElementById('page-' + pageId);
    if (target) target.classList.remove('d-none');
  }

  function formatRupiah(num) {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  }

  // Load Produk dari Spreadsheet
  function loadProducts() {
    google.script.run
      .withSuccessHandler(function(data) {
        productsList = data || [];
        renderPosProducts(productsList);
      })
      .getProducts();
  }

  function loadDashboardData() {
    google.script.run
      .withSuccessHandler(function(stats) {
        if (!stats) return;
        document.getElementById('dashTotalProduk').innerText = stats.totalProduk;
        document.getElementById('dashPenjualanHariIni').innerText = formatRupiah(stats.penjualanHariIni);
        document.getElementById('dashNilaiPersediaan').innerText = formatRupiah(stats.nilaiPersediaan);
        document.getElementById('dashStokMenipis').innerText = stats.jumlahHampirHabis + ' Item';
      })
      .getDashboardStats();
  }

  // Keranjang Kasir POS
  function addToCart(product) {
    var existing = cart.find(function(item) { return item.barcode === product.barcode; });
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        barcode: product.barcode,
        nama: product.nama,
        harga: product.hargaJual,
        qty: 1,
        diskon: 0
      });
    }
    renderCart();
  }

  function renderCart() {
    var tbody = document.getElementById('cartTableBody');
    if (!tbody) return;
    if (cart.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted">Keranjang masih kosong</td></tr>';
      document.getElementById('cartSubtotalText').innerText = 'Rp 0';
      document.getElementById('cartTotalText').innerText = 'Rp 0';
      return;
    }

    var total = 0;
    var html = '';
    cart.forEach(function(item, idx) {
      var sub = (item.qty * item.harga) - item.diskon;
      total += sub;
      html += '<tr>' +
        '<td><strong>' + item.nama + '</strong><br><small class="text-muted">' + formatRupiah(item.harga) + '</small></td>' +
        '<td class="text-center"><span class="badge bg-secondary">' + item.qty + '</span></td>' +
        '<td class="text-end fw-semibold">' + formatRupiah(sub) + '</td>' +
        '<td><button class="btn btn-sm btn-link text-danger p-0" onclick="removeFromCart(' + idx + ')"><i class="bi bi-trash"></i></button></td>' +
        '</tr>';
    });
    tbody.innerHTML = html;
    document.getElementById('cartSubtotalText').innerText = formatRupiah(total);
    document.getElementById('cartTotalText').innerText = formatRupiah(total);
  }

  function removeFromCart(idx) {
    cart.splice(idx, 1);
    renderCart();
  }

  function clearCart() {
    cart = [];
    renderCart();
  }
</script>
`,
  },
];
