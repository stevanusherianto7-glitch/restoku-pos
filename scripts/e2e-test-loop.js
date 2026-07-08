#!/usr/bin/env node
/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║              RESTOKU — E2E Test Loop Script                            ║
 * ║                                                                        ║
 * ║  Tujuan: Verifikasi semua route HTTP merespons dengan benar            ║
 * ║  setelah setiap refactor, tanpa memerlukan browser automation.         ║
 * ║                                                                        ║
 * ║  Cara Pakai:                                                           ║
 * ║    node scripts/e2e-test-loop.js                                       ║
 * ║    node scripts/e2e-test-loop.js --base-url http://localhost:8000      ║
 * ║    node scripts/e2e-test-loop.js --max-retries 5                       ║
 * ║    node scripts/e2e-test-loop.js --verbose                             ║
 * ║    node scripts/e2e-test-loop.js --watch                               ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

// ─── Config ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag, defaultVal) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : defaultVal;
};

const CONFIG = {
  baseUrl:       getArg("--base-url", "http://localhost:8000"),
  maxRetries:    parseInt(getArg("--max-retries", "3"), 10),
  retryDelay:    parseInt(getArg("--retry-delay", "2000"), 10),  // ms
  timeout:       parseInt(getArg("--timeout", "8000"), 10),       // ms
  verbose:       args.includes("--verbose"),
  watch:         args.includes("--watch"),
  watchInterval: parseInt(getArg("--watch-interval", "10000"), 10), // ms
};

// ─── ANSI Colors ──────────────────────────────────────────────────────────────
const c = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  dim:    "\x1b[2m",
  red:    "\x1b[31m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  blue:   "\x1b[34m",
  cyan:   "\x1b[36m",
  white:  "\x1b[37m",
  bgRed:  "\x1b[41m",
  bgGreen:"\x1b[42m",
};
const pass = `${c.green}✓${c.reset}`;
const fail = `${c.red}✗${c.reset}`;
const warn = `${c.yellow}⚠${c.reset}`;
const info = `${c.blue}ℹ${c.reset}`;

// ─── Route Test Definitions ───────────────────────────────────────────────────
/**
 * Daftar semua route yang akan ditest.
 * Format: { url, expectedStatus, description, critical }
 *   critical: true = jika gagal, stop semua test
 */
const ROUTES = [
  // Public routes (must work)
  { url: "/",                     expectedStatus: 200, description: "Landing Page",           critical: true  },
  { url: "/login",                expectedStatus: 200, description: "Staff Login (PIN)",       critical: true  },
  { url: "/owner/login",          expectedStatus: 200, description: "Owner Login",             critical: true  },

  // Admin/Staff routes
  { url: "/dashboard",            expectedStatus: 200, description: "Dashboard Analytics",     critical: true  },
  { url: "/pos",                  expectedStatus: 200, description: "POS Kasir",                 critical: true },
  { url: "/monitor-pesanan",      expectedStatus: 200, description: "Monitor Pesanan",          critical: true },
  { url: "/monitor-reservasi",    expectedStatus: 200, description: "Monitor Reservasi",        critical: true },
  { url: "/kds",                  expectedStatus: 200, description: "Kitchen Display (KDS)",     critical: true },
  { url: "/refund-void",          expectedStatus: 200, description: "Refund & Void Manager",   critical: false },
  { url: "/cashier-session",      expectedStatus: 200, description: "Sesi Kasir",              critical: false },

  // Menu management
  { url: "/produk",               expectedStatus: 200, description: "Produk & Menu",           critical: false },
  { url: "/katalog-menu",         expectedStatus: 200, description: "Katalog Menu",            critical: false },
  { url: "/buku-menu-digital",    expectedStatus: 200, description: "Buku Menu Digital",       critical: false },
  { url: "/order?table=5",        expectedStatus: 200, description: "Scan QR Menu (Tamu)",     critical: true  },
  { url: "/m/senopati",           expectedStatus: 200, description: "Tautan Menu (Tamu)",      critical: true  },
  { url: "/manajemen-meja",       expectedStatus: 200, description: "Manajemen Meja",          critical: true  },

  // Inventory
  { url: "/inventory",            expectedStatus: 200, description: "Stok (Bahan Baku)",       critical: false },
  { url: "/pembelian-vendor",     expectedStatus: 200, description: "Pembelian Vendor",        critical: false },
  { url: "/stok-opname",          expectedStatus: 200, description: "Stock Opname",            critical: false },
  { url: "/dashboard-inventory",  expectedStatus: 200, description: "Dashboard Inventory",     critical: false },

  // HR / Shift
  { url: "/staf-shift",           expectedStatus: 200, description: "Jadwal Shift",            critical: false },

  // Reports
  { url: "/laporan-penjualan",    expectedStatus: 200, description: "Laporan Penjualan",       critical: false },
  { url: "/perbandingan-outlet",  expectedStatus: 200, description: "Perbandingan Outlet",     critical: false },
  { url: "/arus-kas",             expectedStatus: 200, description: "Arus Kas",                critical: false },
  { url: "/laporan-keuangan",     expectedStatus: 200, description: "Laporan Keuangan (Owner)",critical: false },

  // Settings
  { url: "/pengaturan-outlet",    expectedStatus: 200, description: "Pengaturan Outlet",       critical: false },
  { url: "/diskon-pajak",         expectedStatus: 200, description: "Diskon & Pajak",          critical: false },
  { url: "/qrcode-meja",          expectedStatus: 200, description: "QR Code Meja",            critical: false },
  { url: "/printer-config",       expectedStatus: 200, description: "Printer Config",          critical: false },
  { url: "/print-job-monitor",    expectedStatus: 200, description: "Antrian Cetak",           critical: false },
  { url: "/tts-settings",         expectedStatus: 200, description: "Pengaturan TTS",          critical: false },
  { url: "/whatsapp-integration", expectedStatus: 200, description: "WhatsApp Integration",    critical: false },
  { url: "/waiter-bar",           expectedStatus: 200, description: "Monitor Bar & Waiter",   critical: false },

  // Owner routes
  { url: "/owner/employees",       expectedStatus: 200, description: "Data Karyawan (Owner)",        critical: false },
  { url: "/owner/inventory/alerts",expectedStatus: 200, description: "Peringatan Stok (Owner)",      critical: false },
  { url: "/owner/google-reviews",  expectedStatus: 200, description: "Google Review & Complaint Hub", critical: false },
  { url: "/owner/settings",        expectedStatus: 200, description: "Pengaturan Owner",              critical: false },
  { url: "/owner/dashboard",       expectedStatus: 200, description: "Analitik Owner (Dashboard)",    critical: false },
  { url: "/admin/employees",       expectedStatus: 200, description: "Data Karyawan (Admin)",         critical: false },


  // API receipt configuration & printing triggers
  // Note: expectedStatus disesuaikan dengan HTTP standard behavior:
  //   GET /api/receipt-config → 401 (protected, butuh auth session)
  //   POST /api/receipt-config → 401 (protected, butuh auth session)
  //   POST /api/print-receipt → 401 (protected, butuh auth session)
  { url: "/api/receipt-config",   expectedStatus: 401, description: "Get Receipt Config API",  critical: false },
  { 
    url: "/api/receipt-config",   
    expectedStatus: 401, 
    description: "Update Config (Audit Full)", 
    method: "POST", 
    headers: { "Content-Type": "application/json" },
    body: { header: "WARUNG MANG UDIN", paperWidth: "80mm", voidPolicy: "audit_full" },
    critical: false 
  },
  { 
    url: "/api/receipt-config",   
    expectedStatus: 401, 
    description: "Update Config (Zero-Out)", 
    method: "POST", 
    headers: { "Content-Type": "application/json" },
    body: { header: "WARUNG MANG UDIN", paperWidth: "80mm", voidPolicy: "zero_out" },
    critical: false 
  },
  { 
    url: "/api/receipt-config",   
    expectedStatus: 401, 
    description: "Update Config (Manager Only)", 
    method: "POST", 
    headers: { "Content-Type": "application/json" },
    body: { header: "WARUNG MANG UDIN", paperWidth: "80mm", voidPolicy: "manager_only" },
    critical: false 
  },
  { 
    url: "/api/print-receipt",    
    expectedStatus: 401, 
    description: "Auto Print Receipt API", 
    method: "POST", 
    headers: { "Content-Type": "application/json" },
    body: { table: "Meja 12", total: 125000 },
    critical: false 
  },

  // Orders, KDS & Queue API
  // Note: GET /api/orders → 401 (protected inside auth middleware)
  //       POST /api/orders → 422 (public guest route, butuh validasi body)
  //       GET /api/print-jobs → 401 (protected)
  //       GET /api/cashier-queue → 401 (protected)
  { url: "/api/orders",           expectedStatus: 401, description: "Get KDS Orders API",      critical: false },
  { 
    url: "/api/orders",           
    expectedStatus: 422, 
    description: "Submit New Order API", 
    method: "POST", 
    headers: { "Content-Type": "application/json" },
    body: { table: "Meja 5", customerName: "Budi Tamu", items: [{ id: 1, name: "Bakmi Goreng", price: 24000, qty: 2 }] },
    critical: false 
  },
  { url: "/api/print-jobs",       expectedStatus: 401, description: "Get Print Jobs API",      critical: false },
  { url: "/api/cashier-queue",    expectedStatus: 401, description: "Get Cashier Queue API",   critical: false },

  // Reservations API
  // Note: GET /api/reservations → 422 (public route, butuh outlet_id param)
  //       POST /api/reservations → 422 (public route, butuh valid body)
  { url: "/api/reservations",     expectedStatus: 422, description: "Get Reservations API",    critical: false },
  { 
    url: "/api/reservations",     
    expectedStatus: 422, 
    description: "Submit Reservation API", 
    method: "POST", 
    headers: { "Content-Type": "application/json" },
    body: { name: "Anto Wijaya", phone: "0812344556", date: "2026-07-11", time: "19:00", guests: 4, type: "meja" },
    critical: false 
  },

  // Public guest API — outlet operating hours (tidak butuh auth, return 200)
  { url: "/api/outlet-operating-hours", expectedStatus: 200, description: "Jam Operasional Outlet (publik)", critical: false },

  // Google Reviews API (protected)
  { url: "/api/google-reviews",   expectedStatus: 401, description: "Get Google Reviews API",         critical: false },
  {
    url: "/api/google-reviews/sync",
    expectedStatus: 401,
    description: "Sync Google Reviews API",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {},
    critical: false
  },
  {
    url: "/api/google-reviews/settings",
    expectedStatus: 401,
    description: "Save Google Review Settings API",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { google_place_id: "ChIJ_test", api_key: "test_key" },
    critical: false
  },

  // Outlet Settings API (protected)
  { url: "/api/outlet-settings",  expectedStatus: 401, description: "List Karyawan API",             critical: false },

  // Orders detail & status update (protected)
  { url: "/api/orders/999",       expectedStatus: 422, description: "Get Order Status by ID (publik)", critical: false },
  {
    url: "/api/orders/999/status",
    expectedStatus: 401,
    description: "Update Order Status API",
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: { status: "selesai" },
    critical: false
  },

  // Cashier queue delete (protected)
  {
    url: "/api/cashier-queue/999",
    expectedStatus: 401,
    description: "Clear Cashier Queue Item API",
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: {},
    critical: false
  },

  // Reservation status update (protected)
  {
    url: "/api/reservations/999/status",
    expectedStatus: 401,
    description: "Update Reservation Status API",
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: { status: "confirmed" },
    critical: false
  },

  // Gemini AI Chat (protected)
  {
    url: "/api/ai/chat",
    expectedStatus: 401,
    description: "Gemini AI Chat API",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { message: "Berikan rekomendasi menu hari ini" },
    critical: false
  },

  // 404 check
  { url: "/route-yang-tidak-ada-xyz-404", expectedStatus: 404, description: "404 Not Found (expected)", critical: false },
];

// ─── HTTP Fetch Utility ───────────────────────────────────────────────────────
async function fetchRoute(url, timeoutMs, method = "GET", headers = null, body = null) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const reqHeaders = headers || { "Accept": "text/html,application/xhtml+xml" };
  const fetchOpts = {
    method: method,
    redirect: "follow",
    headers: reqHeaders,
    signal: controller.signal,
  };
  if (body) {
    fetchOpts.body = typeof body === "object" ? JSON.stringify(body) : body;
  }
  try {
    const res = await fetch(url, fetchOpts);
    clearTimeout(timer);
    return { status: res.status, ok: res.ok, error: null };
  } catch (err) {
    clearTimeout(timer);
    const msg = err.name === "AbortError" ? `Timeout (>${timeoutMs}ms)` : err.message;
    return { status: null, ok: false, error: msg };
  }
}

// ─── Test a Single Route (with retries) ───────────────────────────────────────
async function testRoute(route, retryCount = 0) {
  const fullUrl = CONFIG.baseUrl + route.url;
  const { status, ok, error } = await fetchRoute(
    fullUrl, 
    CONFIG.timeout, 
    route.method || "GET", 
    route.headers, 
    route.body
  );

  if (error) {
    if (retryCount < CONFIG.maxRetries) {
      if (CONFIG.verbose) {
        process.stdout.write(`  ${warn} Retry ${retryCount + 1}/${CONFIG.maxRetries}: ${error}\n`);
      }
      await new Promise(r => setTimeout(r, CONFIG.retryDelay));
      return testRoute(route, retryCount + 1);
    }
    return { ...route, passed: false, actual: null, reason: error, retries: retryCount };
  }

  const passed = status === route.expectedStatus;
  if (!passed && retryCount < CONFIG.maxRetries) {
    if (CONFIG.verbose) {
      process.stdout.write(`  ${warn} Got ${status}, expected ${route.expectedStatus}. Retry ${retryCount + 1}/${CONFIG.maxRetries}\n`);
    }
    await new Promise(r => setTimeout(r, CONFIG.retryDelay));
    return testRoute(route, retryCount + 1);
  }

  return { ...route, passed, actual: status, reason: error, retries: retryCount };
}

// ─── Print Helpers ────────────────────────────────────────────────────────────
function padEnd(str, len) {
  return String(str).padEnd(len, " ");
}

function printHeader() {
  const now = new Date().toLocaleString("id-ID", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  console.log(`\n${c.bold}${c.cyan}╔════════════════════════════════════════════════════════════╗`);
  console.log(`║         RESTOKU E2E Route Test Loop                        ║`);
  console.log(`║  Base URL : ${padEnd(CONFIG.baseUrl, 47)}║`);
  console.log(`║  Waktu    : ${padEnd(now, 47)}║`);
  console.log(`║  Routes   : ${padEnd(ROUTES.length + " endpoint", 47)}║`);
  console.log(`╚════════════════════════════════════════════════════════════╝${c.reset}\n`);
}

function printResult(result, index) {
  const icon   = result.passed ? pass : fail;
  const num    = padEnd(`[${index + 1}/${ROUTES.length}]`, 8);
  const desc   = padEnd(result.description, 30);
  const url    = padEnd(result.url, 30);
  const status = result.actual ? `HTTP ${result.actual}` : `ERR`;
  const retryStr = result.retries > 0 ? `${c.dim} (retry: ${result.retries})${c.reset}` : "";
  const criticalStr = result.critical && !result.passed ? ` ${c.bgRed}${c.white} CRITICAL ${c.reset}` : "";

  if (result.passed) {
    console.log(`  ${icon} ${c.dim}${num}${c.reset} ${c.bold}${desc}${c.reset}  ${c.dim}${url}${c.reset}  ${c.green}${status}${c.reset}${retryStr}`);
  } else {
    const reason = result.reason ? `${c.dim}(${result.reason})${c.reset}` : "";
    const expected = `expected ${result.expectedStatus}, got ${result.actual ?? "N/A"}`;
    console.log(`  ${icon} ${c.dim}${num}${c.reset} ${c.bold}${desc}${c.reset}  ${c.dim}${url}${c.reset}  ${c.red}${status}${c.reset} ${expected} ${reason}${retryStr}${criticalStr}`);
  }
}

function printSummary(results, durationMs) {
  const passed  = results.filter(r => r.passed).length;
  const failed  = results.filter(r => !r.passed).length;
  const total   = results.length;
  const pct     = Math.round((passed / total) * 100);
  const critical = results.filter(r => !r.passed && r.critical);
  const duration = (durationMs / 1000).toFixed(2);

  console.log(`\n${c.bold}─────────────────────────────────────────────────────────────`);
  console.log(`  HASIL : ${passed}/${total} berhasil (${pct}%) — ${duration}s`);

  if (failed === 0) {
    console.log(`  STATUS: ${c.bgGreen}${c.white}  SEMUA TEST LULUS  ${c.reset} 🎉`);
  } else if (critical.length > 0) {
    console.log(`  STATUS: ${c.bgRed}${c.white}  ${critical.length} ROUTE KRITIS GAGAL  ${c.reset}`);
    critical.forEach(r => console.log(`         ${c.red}→ ${r.description} (${r.url})${c.reset}`));
  } else {
    console.log(`  STATUS: ${c.yellow}  ${failed} route non-kritis gagal  ${c.reset}`);
  }
  console.log(`─────────────────────────────────────────────────────────────${c.reset}\n`);

  return failed === 0 || critical.length === 0;
}

// ─── Main Test Runner ─────────────────────────────────────────────────────────
async function runTests() {
  printHeader();

  // Check server is reachable first
  process.stdout.write(`${info} Memeriksa koneksi ke server...`);
  const ping = await fetchRoute(CONFIG.baseUrl + "/", 5000);
  if (ping.error && ping.error !== "Timeout") {
    console.log(` ${c.red}GAGAL${c.reset}`);
    console.error(`\n${c.red}  ERROR: Server tidak dapat dijangkau di ${CONFIG.baseUrl}`);
    console.error(`  Pastikan Laravel sudah berjalan dengan: php artisan serve${c.reset}\n`);
    process.exit(1);
  }
  console.log(` ${c.green}OK${c.reset} (${CONFIG.baseUrl})\n`);

  const startTime = Date.now();
  const results = [];
  let criticalFailed = false;

  for (let i = 0; i < ROUTES.length; i++) {
    const route = ROUTES[i];

    if (criticalFailed) {
      console.log(`  ${c.dim}[${i + 1}/${ROUTES.length}] SKIP — critical route failed${c.reset}`);
      results.push({ ...route, passed: false, actual: null, reason: "Skipped (critical failure)", retries: 0 });
      continue;
    }

    const result = await testRoute(route);
    results.push(result);
    printResult(result, i);

    if (!result.passed && result.critical) {
      criticalFailed = true;
      console.log(`\n  ${c.red}${c.bold}STOP: Route kritis gagal — menghentikan test.${c.reset}`);
    }

    // Small delay between requests to not overwhelm the server
    if (i < ROUTES.length - 1) {
      await new Promise(r => setTimeout(r, 150));
    }
  }

  const duration = Date.now() - startTime;
  const allPassed = printSummary(results, duration);

  return { results, allPassed, criticalFailed };
}

// ─── Watch Mode ───────────────────────────────────────────────────────────────
async function watchMode() {
  console.log(`${c.cyan}${c.bold}WATCH MODE aktif — menjalankan ulang setiap ${CONFIG.watchInterval / 1000}s${c.reset}`);
  console.log(`${c.dim}Tekan Ctrl+C untuk berhenti.${c.reset}\n`);

  let iteration = 0;
  while (true) {
    iteration++;
    console.log(`${c.dim}══════════════ Iterasi #${iteration} ══════════════${c.reset}`);
    const { allPassed } = await runTests();

    if (allPassed) {
      console.log(`${c.dim}Menunggu ${CONFIG.watchInterval / 1000}s sebelum iterasi berikutnya...${c.reset}\n`);
    } else {
      console.log(`${c.yellow}Ada test gagal. Perbaiki kode lalu script akan otomatis retry.${c.reset}`);
    }
    await new Promise(r => setTimeout(r, CONFIG.watchInterval));
  }
}

// ─── Loop Mode (retry sampai semua pass) ──────────────────────────────────────
async function loopUntilPass() {
  let attempt = 0;
  while (true) {
    attempt++;
    if (attempt > 1) {
      console.log(`${c.yellow}${c.bold}══════════════ Loop #${attempt} (retry setelah ${CONFIG.retryDelay}ms) ══════════════${c.reset}`);
    }

    const { allPassed, criticalFailed } = await runTests();

    if (allPassed) {
      console.log(`${c.green}${c.bold}✓ Semua test berhasil pada loop #${attempt}. Script selesai.${c.reset}\n`);
      process.exit(0);
    }

    if (criticalFailed) {
      console.log(`${c.red}Route kritis gagal. Loop dihentikan. Perbaiki kode lalu jalankan ulang.${c.reset}\n`);
      process.exit(1);
    }

    console.log(`${c.yellow}Menunggu ${CONFIG.retryDelay}ms lalu mencoba lagi...${c.reset}`);
    await new Promise(r => setTimeout(r, CONFIG.retryDelay));
  }
}

// ─── Entry Point ──────────────────────────────────────────────────────────────
if (CONFIG.watch) {
  watchMode().catch(err => { console.error(err); process.exit(1); });
} else {
  // Default: loop until all pass (loop berhenti saat semua berhasil)
  loopUntilPass().catch(err => { console.error(err); process.exit(1); });
}
