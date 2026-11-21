# One-line bootstrap for the Obsidian + Claude setup kit.
#   irm https://raw.githubusercontent.com/puruni22-star/Exposition---Topic/claude/elegant-cerf-fs8ajm/obsidian-claude-setup/start.ps1|iex
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$ref = 'claude/elegant-cerf-fs8ajm'
try {
  $sha = Invoke-RestMethod -UseBasicParsing -Headers @{ Accept = 'application/vnd.github.sha' } -Uri 'https://api.github.com/repos/puruni22-star/Exposition---Topic/commits/claude/elegant-cerf-fs8ajm'
  if ($sha -match '^[0-9a-f]{40}$') { $ref = $sha }
} catch {}
$base = 'https://raw.githubusercontent.com/puruni22-star/Exposition---Topic/' + $ref + '/obsidian-claude-setup'
$env:SETUP_REF = $ref.Substring(0, [Math]::Min(7, $ref.Length))
$dir = Join-Path $env:TEMP ('obsidian-claude-setup-' + (Get-Date -Format 'yyyyMMddHHmmss'))
$nocache = '?nocache=' + [Guid]::NewGuid().ToString('N')
$utf8Bom = New-Object System.Text.UTF8Encoding($true)
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
  $wc = New-Object System.Net.WebClient
  $bytes = $wc.DownloadData("$base/$f$nocache")
  if ($f -eq 'install.ps1') {
    # Decode as UTF-8 (drops any BOM) and write back with exactly one BOM for PowerShell 5.1.
    $text = (New-Object System.Text.UTF8Encoding($false)).GetString($bytes).TrimStart([char]0xFEFF)
    [IO.File]::WriteAllText($out, $text, $utf8Bom)
  } else {
    [IO.File]::WriteAllBytes($out, $bytes)
  }
}
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $dir 'install.ps1')
Write-Host ''
Read-Host 'Press Enter to close'
