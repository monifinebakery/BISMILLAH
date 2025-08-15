#!/usr/bin/env bash
set -euo pipefail

# Base URL to test. Priority: CLI arg > env BASE_URL > GitHub Actions vars.NETLIFY_DEV_URL > default
BASE_URL="${1:-${BASE_URL:-${NETLIFY_DEV_URL:-}}}"
if [[ -z "${BASE_URL}" ]]; then
  echo "ERROR: BASE_URL not provided. Pass as argument or set BASE_URL/NETLIFY_DEV_URL env var."
  exit 1
fi

MARKER="Kalkulator HPP - Hitung Harga Pokok Penjualan"

# List of app routes to verify (can be extended)
PATHS=(
  "/" "/auth" "/resep" "/gudang" "/supplier" "/pembelian" "/pesanan" 
  "/biaya-operasional" "/invoice" "/laporan" "/analisis-profit" "/aset" 
  "/updates" "/admin/updates" "/pengaturan" "/menu" "/payment-success" 
  "/promo" "/promo/list" "/promo/create" "/promo/edit/123" "/not-found-test"
)

failures=0

echo "Checking deep links against: ${BASE_URL}"
for p in "${PATHS[@]}"; do
  url="${BASE_URL}${p}"
  code=$(curl -s -o /tmp/deeplink.html -w "%{http_code}" "$url" || true)
  if [[ "$code" != "200" ]]; then
    echo "[FAIL] $p -> HTTP $code"
    failures=$((failures+1))
    continue
  fi
  if grep -q "$MARKER" /tmp/deeplink.html; then
    echo "[OK]   $p -> 200 + marker found"
  else
    echo "[WARN] $p -> 200 but marker missing (check index title/content)"
  fi
  # Basic sanity: ensure script root/entry exists in HTML
  if ! grep -q "/src/main.tsx" /tmp/deeplink.html && ! grep -q "id=\"root\"" /tmp/deeplink.html; then
    echo "[WARN] $p -> could not find expected root/script references"
  fi
 done

if [[ $failures -gt 0 ]]; then
  echo "Deep link check failed for ${failures} path(s)."
  exit 1
fi

echo "All deep link checks passed (HTTP 200)."
