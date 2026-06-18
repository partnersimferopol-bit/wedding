# Load token from file, deploy only (no API checks, no whoami)
$ErrorActionPreference = 'Stop'
$WorkerDir = $PSScriptRoot
$ProjectRoot = Split-Path $WorkerDir -Parent

function Clean-Input([string]$v) {
  if (-not $v) { return '' }
  $v = $v.Trim() -replace '[\r\n\t\s]', ''
  $v = [regex]::Replace($v, '[\p{C}]', '')
  return $v
}

$credFile = Join-Path $WorkerDir 'cloudflare-credentials.local.txt'
if (-not (Test-Path $credFile)) {
  Write-Host 'Missing cloudflare-credentials.local.txt' -ForegroundColor Red
  exit 1
}

$lines = Get-Content $credFile -Encoding UTF8 | Where-Object { $_ -and $_ -notmatch '^\s*#' -and $_ -notmatch 'PASTE_YOUR' }
$env:CLOUDFLARE_API_TOKEN = Clean-Input $lines[0]
$env:CLOUDFLARE_ACCOUNT_ID = Clean-Input $lines[1]
if ($env:CLOUDFLARE_ACCOUNT_ID -match '([a-fA-F0-9]{32})') {
  $env:CLOUDFLARE_ACCOUNT_ID = $Matches[1].ToLower()
}

Write-Host 'Token and Account ID loaded.' -ForegroundColor Green
Write-Host 'Account ID:' $env:CLOUDFLARE_ACCOUNT_ID

$tomlPath = Join-Path $WorkerDir 'wrangler.toml'
$toml = Get-Content $tomlPath -Raw -Encoding UTF8
if ($toml -notmatch 'account_id') {
  $toml = "account_id = `"$($env:CLOUDFLARE_ACCOUNT_ID)`"`n" + $toml
} else {
  $toml = $toml -replace 'account_id\s*=\s*"[^"]*"', "account_id = `"$($env:CLOUDFLARE_ACCOUNT_ID)`""
}
Set-Content $tomlPath $toml -NoNewline -Encoding UTF8

Set-Location $WorkerDir
& (Join-Path $WorkerDir 'setup-leads.ps1')
