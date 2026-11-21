# One-line bootstrap: downloads the Obsidian + Claude setup kit and runs install.ps1.
# Usage (Win+R or PowerShell):
#   powershell -ep Bypass -c "irm https://raw.githubusercontent.com/puruni22-star/Exposition---Topic/claude/elegant-cerf-fs8ajm/obsidian-claude-setup/setup.ps1|iex"
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$base = 'https://raw.githubusercontent.com/puruni22-star/Exposition---Topic/claude/elegant-cerf-fs8ajm/obsidian-claude-setup'
$dir = Join-Path $env:TEMP 'obsidian-claude-setup'
$files = @(
  'install.ps1',
  'plugin/jiseok-claude-layout/main.js',
  'plugin/jiseok-claude-layout/manifest.json',
  'vault-template/CLAUDE.md',
  'vault-template/settings.json'
)
foreach ($f in $files) {
  $out = Join-Path $dir ($f -replace '/', '\')
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $out) | Out-Null
  Invoke-WebRequest -Uri "$base/$f" -OutFile $out -UseBasicParsing
}
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $dir 'install.ps1')
Write-Host ''
Read-Host 'Press Enter to close'
