param()

$pages = @(
  # funcName | roles(comma-sep) | pageName | roleLabel | relFilePath
  # Group A - Manager + Owner
  "RefundVoidManagerPage|manager,owner|Refund & Void|Manager, Owner|RefundVoidManager\Index.tsx",
  "ProdukMenu|manager,owner|Produk & Menu|Manager, Owner|ProdukMenu\Index.tsx",
  "BukuMenuDigital|manager,owner|Buku Menu Digital|Manager, Owner|BukuMenuDigital\Index.tsx",
  "Inventory|manager,owner|Stok & Inventaris|Manager, Owner|Inventory\Index.tsx",
  "PembelianVendorPage|manager,owner|Supplier & Pembelian|Manager, Owner|PembelianVendor\Index.tsx",
  "StokOpnamePage|manager,owner|Stock Opname|Manager, Owner|StokOpname\Index.tsx",
  "DashboardInventoryPage|manager,owner|Dasbor Inventaris|Manager, Owner|DashboardInventory\Index.tsx",
  "StafShiftPage|manager,owner|Shift Kerja|Manager, Owner|StafShift\Index.tsx",
  "LaporanPenjualan|manager,owner|Laporan Penjualan|Manager, Owner|LaporanPenjualan\Index.tsx",
  "PengaturanOutlet|manager,owner|Pengaturan Outlet|Manager, Owner|PengaturanOutlet\Index.tsx",
  "DiskonPajakPage|manager,owner|Diskon & Pajak|Manager, Owner|DiskonPajak\Index.tsx",
  "QRCodeMeja|manager,owner|QR Code Meja|Manager, Owner|QRCodeMeja\Index.tsx",
  "PrinterConfigPage|manager,owner|Printer Config|Manager, Owner|PrinterConfig\Index.tsx",
  "PrintJobMonitorPage|manager,owner|Antrean Cetak|Manager, Owner|PrintJobMonitor\Index.tsx",
  "TTSSettingsPage|manager,owner|Pengaturan TTS|Manager, Owner|TTSSettings\Index.tsx",
  "WhatsAppIntegrationPage|manager,owner|WhatsApp Integration|Manager, Owner|WhatsAppIntegration\Index.tsx",
  # Group B - Owner only
  "PerbandinganOutlet|owner|Perbandingan Outlet|Owner|PerbandinganOutlet\Index.tsx",
  "ArusKas|owner|Arus Kas|Owner|ArusKas\Index.tsx",
  # Group C - Kasir + Manager + Owner
  "POS|kasir,manager,owner|POS Kasir|Kasir, Manager, Owner|POS\Index.tsx",
  "CashierSessionPage|kasir,manager,owner|Sesi Kasir|Kasir, Manager, Owner|CashierSession\Index.tsx"
)

$basePath = "resources\js\Pages"
$ok = 0; $skip = 0; $already = 0

foreach ($entry in $pages) {
  $parts = $entry -split '\|'
  $funcName  = $parts[0]
  $roles     = $parts[1]
  $pageName  = $parts[2]
  $roleLabel = $parts[3]
  $filePath  = Join-Path $basePath $parts[4]

  if (-not (Test-Path $filePath)) {
    Write-Host "SKIP (not found): $filePath" -ForegroundColor Yellow
    $skip++
    continue
  }

  $content = Get-Content $filePath -Raw -Encoding UTF8

  if ($content -match 'RoleGuard') {
    Write-Host "ALREADY: $filePath" -ForegroundColor Cyan
    $already++
    continue
  }

  # Build the roles array literal e.g. ["manager","owner"]
  $rolesArr = ($roles -split ',') | ForEach-Object { '"' + $_.Trim() + '"' }
  $rolesStr = $rolesArr -join ','

  # Rename export default function FuncName( -> function FuncNameInner(
  $newContent = $content -replace ('export default function ' + [Regex]::Escape($funcName) + '\('), "function ${funcName}Inner("

  # Append wrapper at end of file
  $wrapper = @"


// --- Role Guard Wrapper -------------------------------------------------------
import { RoleGuard } from "../../Components/RoleGuard";
export default function ${funcName}() {
  return (
    <RoleGuard allowedRoles={[$rolesStr]} pageName="$pageName" allowedRoleLabel="$roleLabel">
      <${funcName}Inner />
    </RoleGuard>
  );
}
"@

  $newContent = $newContent.TrimEnd() + $wrapper

  [System.IO.File]::WriteAllText((Resolve-Path $filePath), $newContent, [System.Text.Encoding]::UTF8)
  Write-Host "OK: $filePath" -ForegroundColor Green
  $ok++
}

Write-Host ""
Write-Host "Done: $ok updated | $already already done | $skip skipped" -ForegroundColor White
