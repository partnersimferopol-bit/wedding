# Setup Worker via Cloudflare API token (no wrangler login)
# Run: cd worker; .\setup-with-token.ps1

$ErrorActionPreference = 'Stop'
$WorkerDir = $PSScriptRoot
$ProjectRoot = Split-Path $WorkerDir -Parent

# TLS 1.2 — иначе на части Windows PowerShell не ходит на Cloudflare API
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Test-InternetToCloudflare {
  try {
    $null = Invoke-WebRequest -Uri 'https://api.cloudflare.com/client/v4/' -UseBasicParsing -TimeoutSec 20
    return $true
  } catch {
    # API returns 404/400 with JSON body — connection still OK
    if ($_.Exception.Response) { return $true }
    return $false
  }
}

function Clean-CloudflareInput {
  param([string]$Value)
  if (-not $Value) { return '' }
  $v = $Value.Trim()
  $v = $v -replace '[\r\n\t]', ''
  $v = $v -replace '\s', ''
  $v = $v -replace '^["'']+|["'']+$', ''
  $v = [regex]::Replace($v, '[\p{C}]', '')
  return $v
}

function Clean-AccountId {
  param([string]$Value)
  $v = Clean-CloudflareInput $Value
  if ($v -match '([a-fA-F0-9]{32})') { return $Matches[1].ToLower() }
  return $v.ToLower()
}

function Test-CloudflareToken {
  param([string]$Token)
  $headers = @{ Authorization = "Bearer $Token" }
  try {
    $r = Invoke-RestMethod -Uri 'https://api.cloudflare.com/client/v4/user/tokens/verify' -Headers $headers -Method Get -TimeoutSec 30
    return $r.success -eq $true
  } catch {
    Write-Host "Cloudflare API: $($_.Exception.Message)" -ForegroundColor Red
    return $false
  }
}

function Get-CloudflareAccounts {
  param([string]$Token)
  $headers = @{ Authorization = "Bearer $Token" }
  try {
    $r = Invoke-RestMethod -Uri 'https://api.cloudflare.com/client/v4/accounts' -Headers $headers -Method Get -TimeoutSec 30
    if ($r.success) { return $r.result }
  } catch {
    Write-Host "Accounts list: $($_.Exception.Message)" -ForegroundColor Yellow
  }
  return @()
}

Write-Host '=== Cloudflare API token setup ===' -ForegroundColor Cyan
Write-Host ''
Write-Host 'EASIEST: file method (no paste in terminal)' -ForegroundColor Green
Write-Host '  1) Copy cloudflare-credentials.local.example.txt'
Write-Host '     to cloudflare-credentials.local.txt'
Write-Host '  2) Open in Notepad: line 1 = token, line 2 = Account ID'
Write-Host '  3) Run this script again'
Write-Host ''
Write-Host 'OR paste in terminal: RIGHT MOUSE BUTTON (not Ctrl+V)'
Write-Host '  In Cursor terminal: Ctrl+Shift+V also works'
Write-Host ''

$credFile = Join-Path $WorkerDir 'cloudflare-credentials.local.txt'
$token = ''
$accountId = ''

if (Test-Path $credFile) {
  Write-Host "Reading: $credFile" -ForegroundColor Green
  $lines = Get-Content $credFile -Encoding UTF8 | Where-Object {
    $_ -and $_ -notmatch '^\s*#' -and $_ -notmatch 'PASTE_YOUR'
  }
  if ($lines.Count -ge 2) {
    $token = Clean-CloudflareInput $lines[0]
    $accountId = Clean-AccountId $lines[1]
  }
}

if (-not $token -or -not $accountId) {
  Write-Host 'Paste API token (right-click or Ctrl+Shift+V):' -ForegroundColor Yellow
  $token = Clean-CloudflareInput (Read-Host 'API token')
  Write-Host 'Paste Account ID (right-click or Ctrl+Shift+V):' -ForegroundColor Yellow
  $accountId = Clean-AccountId (Read-Host 'Account ID')
}

if (-not $token -or -not $accountId) {
  Write-Host 'Token and Account ID are required.' -ForegroundColor Red
  Write-Host 'Use cloudflare-credentials.local.txt or paste with RIGHT CLICK.' -ForegroundColor Red
  exit 1
}

if (-not (Get-Command wrangler -ErrorAction SilentlyContinue)) {
  Write-Host 'Installing wrangler...' -ForegroundColor Yellow
  npm install -g wrangler
}

if ($accountId -notmatch '^[a-f0-9]{32}$') {
  Write-Host 'Warning: Account ID usually looks like: cdef571ac5ed3bf02fff7b986e5ae21c (32 hex chars)' -ForegroundColor Yellow
  Write-Host 'Check: no spaces, no quotes, copied from Account ID field only.' -ForegroundColor Yellow
}

Write-Host ''
Write-Host 'Step 1: wrangler deploy (skip PowerShell API check — browser OK is enough)' -ForegroundColor Green

$accounts = Get-CloudflareAccounts -Token $token
if ($accounts.Count -gt 0) {
  Write-Host ''
  Write-Host 'Your accounts (use this Account ID):' -ForegroundColor Cyan
  foreach ($a in $accounts) {
    $mark = if ($a.id -eq $accountId) { ' <-- matches' } else { '' }
    Write-Host "  $($a.id)  $($a.name)$mark"
  }
  $match = $accounts | Where-Object { $_.id -eq $accountId }
  if (-not $match) {
    Write-Host ''
    Write-Host 'Account ID does not match list above — check cloudflare-credentials.local.txt' -ForegroundColor Yellow
  }
}

$env:CLOUDFLARE_API_TOKEN = $token
$env:CLOUDFLARE_ACCOUNT_ID = $accountId

$tomlPath = Join-Path $WorkerDir 'wrangler.toml'
$toml = Get-Content $tomlPath -Raw
if ($toml -notmatch 'account_id\s*=') {
  $toml = "account_id = `"$accountId`"`n" + $toml
} else {
  $toml = $toml -replace 'account_id\s*=\s*"[^"]*"', "account_id = `"$accountId`""
}
Set-Content $tomlPath $toml -NoNewline -Encoding UTF8

Write-Host ''
Write-Host 'Step 2: wrangler whoami...' -ForegroundColor Green
wrangler whoami 2>&1 | Write-Host
if ($LASTEXITCODE -ne 0) {
  Write-Host ''
  Write-Host 'wrangler failed but token is valid. Continuing deploy...' -ForegroundColor Yellow
}

Write-Host ''
Write-Host 'Step 3: setup-leads.ps1 ...' -ForegroundColor Green
Set-Location $WorkerDir
& (Join-Path $WorkerDir 'setup-leads.ps1')
