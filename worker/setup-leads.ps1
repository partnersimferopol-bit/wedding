# Leads API setup via wrangler (ASCII only - safe on Russian Windows)
# Run from worker folder: .\setup-leads.ps1

$ErrorActionPreference = 'Stop'
$WorkerDir = $PSScriptRoot
$ProjectRoot = Split-Path $WorkerDir -Parent

Write-Host '=== Gift Future - leads API setup ===' -ForegroundColor Cyan

if (-not (Get-Command wrangler -ErrorAction SilentlyContinue)) {
  Write-Host 'Wrangler not found. Run: npm install -g wrangler' -ForegroundColor Yellow
  exit 1
}

Set-Location $WorkerDir

if ($env:CLOUDFLARE_API_TOKEN) {
  Write-Host ''
  Write-Host '1) API token loaded - skip login' -ForegroundColor Green
} else {
  Write-Host ''
  Write-Host '1) Cloudflare login' -ForegroundColor Green
  wrangler login
}

Write-Host ''
Write-Host '2) KV storage LEADS' -ForegroundColor Green
$toml = Get-Content 'wrangler.toml' -Raw -Encoding UTF8
if ($toml -match 'id = "PASTE_KV') {
  Write-Host 'Creating KV namespace LEADS...'
  $out = wrangler kv namespace create LEADS 2>&1 | Out-String
  Write-Host $out
  if ($out -match 'id = "([a-f0-9]+)"') {
    $kvId = $Matches[1]
    $toml = $toml -replace 'id = "PASTE_KV_NAMESPACE_ID_AFTER_CREATE"', "id = `"$kvId`""
    Set-Content 'wrangler.toml' $toml -NoNewline -Encoding UTF8
    Write-Host 'wrangler.toml updated with KV id.' -ForegroundColor Green
  } else {
    Write-Host 'Copy KV id to wrangler.toml manually and run again.' -ForegroundColor Yellow
    exit 1
  }
}

Write-Host ''
Write-Host '3) Secrets - paste with RIGHT MOUSE in this window' -ForegroundColor Green
Write-Host '   VK_GROUP_TOKEN' -ForegroundColor Yellow
wrangler secret put VK_GROUP_TOKEN
Write-Host '   VK_NOTIFY_PEER_ID - usually 2202321163' -ForegroundColor Yellow
wrangler secret put VK_NOTIFY_PEER_ID
Write-Host '   ADMIN_SECRET - password for admin.html' -ForegroundColor Yellow
wrangler secret put ADMIN_SECRET
Write-Host '   TELEGRAM_BOT_TOKEN - or press Enter to skip' -ForegroundColor Yellow
wrangler secret put TELEGRAM_BOT_TOKEN
Write-Host '   TELEGRAM_CHAT_ID - or press Enter to skip' -ForegroundColor Yellow
wrangler secret put TELEGRAM_CHAT_ID

Write-Host ''
Write-Host '4) Deploy Worker' -ForegroundColor Green
$deployOut = wrangler deploy 2>&1 | Out-String
Write-Host $deployOut
if ($deployOut -match '(https://[a-zA-Z0-9.-]+\.workers\.dev)') {
  $workerUrl = $Matches[1]
} else {
  $workerUrl = Read-Host 'Paste Worker URL from output above'
}

Write-Host ''
Write-Host '5) Health check' -ForegroundColor Green
try {
  if (Get-Command curl.exe -ErrorAction SilentlyContinue) {
    curl.exe -s "$workerUrl/health"
    Write-Host ''
  } else {
    $health = Invoke-RestMethod -Uri "$workerUrl/health" -Method Get -TimeoutSec 30
    $health | ConvertTo-Json
  }
} catch {
  Write-Host "Open in browser: $workerUrl/health" -ForegroundColor Yellow
}

Write-Host ''
Write-Host '6) Writing js/config-leads.js' -ForegroundColor Green
$configPath = Join-Path $ProjectRoot 'js\config-leads.js'
$config = @"
/**
 * Leads API URL (after setup-leads.ps1)
 * VK/Telegram tokens stay in Cloudflare Secrets only.
 */
const LEADS_API = {
  baseUrl: '$workerUrl',
  adminSecret: '',
};
"@
Set-Content $configPath $config -Encoding UTF8
Write-Host "Saved: $configPath" -ForegroundColor Green

Write-Host ''
Write-Host '=== DONE ===' -ForegroundColor Cyan
Write-Host "Worker URL: $workerUrl"
Write-Host 'Next:'
Write-Host '  - git push js/config-leads.js'
Write-Host '  - admin.html -> Leads tab -> URL + ADMIN_SECRET'
Write-Host '  - test order on the game site'
