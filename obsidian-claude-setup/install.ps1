# Obsidian + Claude setup (Windows PowerShell 5.1+). Runs to the end without questions.
# Steps: find vault, close Obsidian, backup, core plugins, community plugins,
#        CLAUDE.md, Claude Code + uv, open Obsidian, register Claude Desktop MCP.
param(
  [string]$VaultPath = "",
  [switch]$SkipDesktop,
  [switch]$SkipClaudeCode
)

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path

function Say($msg, $color = "Gray") { Write-Host $msg -ForegroundColor $color }
function ReadJson($path) {
  if (Test-Path -LiteralPath $path) {
    $text = [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8)
    if ($text.Trim()) { return $text | ConvertFrom-Json }
  }
  return $null
}
function WriteJson($path, $obj) {
  $json = ConvertTo-Json -InputObject $obj -Depth 20
  [IO.File]::WriteAllText($path, $json, $Utf8NoBom)
}
function SetProp($obj, $name, $value) {
  if ($obj.PSObject.Properties[$name]) { $obj.$name = $value }
  else { $obj | Add-Member -NotePropertyName $name -NotePropertyValue $value }
}
function RefreshPath {
  $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
              [Environment]::GetEnvironmentVariable("Path", "User") + ";" +
              (Join-Path $env:USERPROFILE ".local\bin")
}

Say "`n=== 옵시디언 + Claude 연결 자동 설치 ===`n" Cyan

# ---------------------------------------------------------------- 1. 볼트 찾기
$candidates = @()
if ($VaultPath) { $candidates += $VaultPath }
# 바탕화면(OneDrive 바탕화면 포함)에서 이름이 "My Note"인 볼트를 직접 찾는다.
$roots = @([Environment]::GetFolderPath("Desktop"), (Join-Path $env:USERPROFILE "Desktop"), (Join-Path $env:USERPROFILE "OneDrive")) | Select-Object -Unique
foreach ($r in $roots) {
  if (-not ($r -and (Test-Path -LiteralPath $r))) { continue }
  Get-ChildItem -LiteralPath $r -Directory -Recurse -Depth 3 -Force -Filter ".obsidian" -ErrorAction SilentlyContinue |
    ForEach-Object { $_.Parent.FullName } |
    Where-Object { (Split-Path -Leaf $_) -eq "My Note" } |
    ForEach-Object { $candidates += $_ }
}
$candidates += (Join-Path $env:USERPROFILE "Desktop\옵시디언\My Note")
$candidates += (Join-Path $env:USERPROFILE "OneDrive\Desktop\옵시디언\My Note")
$candidates += (Join-Path $env:USERPROFILE "OneDrive\바탕 화면\옵시디언\My Note")
$obsJson = ReadJson (Join-Path $env:APPDATA "obsidian\obsidian.json")
if ($obsJson -and $obsJson.vaults) {
  $registered = $obsJson.vaults.PSObject.Properties | ForEach-Object { $_.Value } | Sort-Object -Property ts -Descending
  foreach ($v in $registered) { if ($v.path -like "*My Note*") { $candidates += $v.path } }
  foreach ($v in $registered) { $candidates += $v.path }
}
$VaultPath = $null
foreach ($c in $candidates) {
  if ($c -and (Test-Path -LiteralPath (Join-Path $c ".obsidian"))) { $VaultPath = $c; break }
}
if (-not $VaultPath) {
  Say "옵시디언 볼트를 찾지 못했습니다. 옵시디언에서 볼트를 한 번 연 뒤 다시 실행해 주세요." Red
  exit 1
}
$ObsDir = Join-Path $VaultPath ".obsidian"
Say "[1/7] 볼트 찾음: $VaultPath" Green

# ---------------------------------------------------------------- 2. 옵시디언 닫기 + 백업
$running = Get-Process -Name "Obsidian" -ErrorAction SilentlyContinue
if ($running) {
  Say "      옵시디언을 잠시 닫습니다..."
  $running | ForEach-Object { [void]$_.CloseMainWindow() }
  Start-Sleep -Seconds 4
  Get-Process -Name "Obsidian" -ErrorAction SilentlyContinue | Stop-Process -Force
  Start-Sleep -Seconds 1
}
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Backup = Join-Path $VaultPath ".obsidian-backup-$stamp"
New-Item -ItemType Directory -Path $Backup | Out-Null
Get-ChildItem -LiteralPath $ObsDir -Filter *.json | Copy-Item -Destination $Backup
Say "[2/7] 설정 백업: $Backup" Green

# ---------------------------------------------------------------- 3. 코어 플러그인
$corePath = Join-Path $ObsDir "core-plugins.json"
$coreWanted = @("file-explorer", "global-search", "bookmarks", "backlink", "outgoing-link", "tag-pane", "outline", "command-palette", "workspaces")
$core = ReadJson $corePath
if ($core -is [System.Array]) {
  $list = [System.Collections.ArrayList]@($core)
  foreach ($id in $coreWanted) { if (-not $list.Contains($id)) { [void]$list.Add($id) } }
  WriteJson $corePath $list.ToArray()
} else {
  if ($null -eq $core) { $core = New-Object PSObject }
  foreach ($id in $coreWanted) { SetProp $core $id $true }
  WriteJson $corePath $core
}
Say "[3/7] 코어 플러그인 켬 (파일 탐색기 / 백링크 등)" Green

# ---------------------------------------------------------------- 4. 커뮤니티 플러그인
$PluginsDir = Join-Path $ObsDir "plugins"
New-Item -ItemType Directory -Force -Path $PluginsDir | Out-Null

$remote = @(
  @{ id = "terminal"; repo = "polyipseity/obsidian-terminal"; name = "Terminal" },
  @{ id = "obsidian-local-rest-api"; repo = "coddingtonbear/obsidian-local-rest-api"; name = "Local REST API" }
)
foreach ($p in $remote) {
  $dest = Join-Path $PluginsDir $p.id
  if (Test-Path -LiteralPath (Join-Path $dest "main.js")) { Say "      $($p.name): 이미 설치됨"; continue }
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  foreach ($f in @("main.js", "manifest.json", "styles.css")) {
    $url = "https://github.com/$($p.repo)/releases/latest/download/$f"
    try { Invoke-WebRequest -Uri $url -OutFile (Join-Path $dest $f) -UseBasicParsing }
    catch { if ($f -ne "styles.css") { throw "다운로드 실패: $url" } }
  }
  Say "      $($p.name): 설치함"
}

# 터미널이 노트 아래(수평 분할)에 열리도록
$termDataPath = Join-Path $PluginsDir "terminal\data.json"
$termData = ReadJson $termDataPath
if ($null -eq $termData) { $termData = New-Object PSObject }
SetProp $termData "newInstanceBehavior" "newHorizontalSplit"
WriteJson $termDataPath $termData

$ourSrc = Join-Path $Here "plugin\jiseok-claude-layout"
$ourDest = Join-Path $PluginsDir "jiseok-claude-layout"
New-Item -ItemType Directory -Force -Path $ourDest | Out-Null
Copy-Item -Path (Join-Path $ourSrc "main.js"), (Join-Path $ourSrc "manifest.json") -Destination $ourDest -Force
Say "      Claude 작업 레이아웃: 설치함"

$cpPath = Join-Path $ObsDir "community-plugins.json"
$cp = ReadJson $cpPath
$cpList = [System.Collections.ArrayList]@()
if ($cp) { foreach ($x in $cp) { [void]$cpList.Add([string]$x) } }
foreach ($id in @("terminal", "obsidian-local-rest-api", "jiseok-claude-layout")) {
  if (-not $cpList.Contains($id)) { [void]$cpList.Add($id) }
}
WriteJson $cpPath $cpList.ToArray()
Say "[4/7] 커뮤니티 플러그인 켬 (Terminal / Local REST API / Claude 작업 레이아웃)" Green

# ---------------------------------------------------------------- 5. CLAUDE.md
$tpl = Join-Path $Here "vault-template"
$claudeMd = Join-Path $VaultPath "CLAUDE.md"
if (-not (Test-Path -LiteralPath $claudeMd)) { Copy-Item (Join-Path $tpl "CLAUDE.md") $claudeMd }
$dotClaude = Join-Path $VaultPath ".claude"
New-Item -ItemType Directory -Force -Path $dotClaude | Out-Null
$settingsDest = Join-Path $dotClaude "settings.json"
if (-not (Test-Path -LiteralPath $settingsDest)) { Copy-Item (Join-Path $tpl "settings.json") $settingsDest }
Say "[5/7] CLAUDE.md 준비 (Claude가 볼트 구조와 규칙을 읽는 파일)" Green

# ---------------------------------------------------------------- 6. Claude Code, uv
RefreshPath
if ($SkipClaudeCode) {
  Say "[6/7] Claude Code 설치 건너뜀" Yellow
} else {
  if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
    Say "      Claude Code 설치 중..."
    try { Invoke-RestMethod https://claude.ai/install.ps1 | Invoke-Expression } catch { Say "      Claude Code 설치 실패: $($_.Exception.Message)" Yellow }
    RefreshPath
  }
  if (-not $SkipDesktop -and -not (Get-Command uvx -ErrorAction SilentlyContinue)) {
    Say "      uv 설치 중 (Claude 앱 연결용)..."
    try { Invoke-RestMethod https://astral.sh/uv/install.ps1 | Invoke-Expression } catch { Say "      uv 설치 실패: $($_.Exception.Message)" Yellow }
    RefreshPath
  }
  $c = Get-Command claude -ErrorAction SilentlyContinue
  if ($c) { Say "[6/7] Claude Code 준비됨" Green } else { Say "[6/7] Claude Code를 찾지 못했습니다 (PC를 다시 켠 뒤 확인)" Yellow }
}

# ---------------------------------------------------------------- 7. 옵시디언 실행 + Claude 앱 연결
$enc = [Uri]::EscapeDataString($VaultPath)
Start-Process "obsidian://open?path=$enc"
Say "      옵시디언을 엽니다..."

if (-not $SkipDesktop) {
  $restDataPath = Join-Path $PluginsDir "obsidian-local-rest-api\data.json"
  $apiKey = $null
  for ($i = 0; $i -lt 60 -and -not $apiKey; $i++) {
    Start-Sleep -Seconds 1
    try { $d = ReadJson $restDataPath; if ($d -and $d.apiKey) { $apiKey = [string]$d.apiKey } } catch {}
  }
  if (-not $apiKey) {
    Say "[7/7] Local REST API 키를 기다리다 멈췄습니다. 옵시디언 설정 → 커뮤니티 플러그인에서 '제한 모드'가 꺼져 있는지 확인 후 다시 실행해 주세요." Yellow
  } else {
    $uvx = Get-Command uvx -ErrorAction SilentlyContinue
    $uvxPath = "uvx"
    if ($uvx) { $uvxPath = $uvx.Source }
    $cfgDir = Join-Path $env:APPDATA "Claude"
    New-Item -ItemType Directory -Force -Path $cfgDir | Out-Null
    $cfgPath = Join-Path $cfgDir "claude_desktop_config.json"
    if (Test-Path -LiteralPath $cfgPath) { Copy-Item $cfgPath "$cfgPath.backup-$stamp" }
    $cfg = ReadJson $cfgPath
    if ($null -eq $cfg) { $cfg = New-Object PSObject }
    if (-not $cfg.PSObject.Properties["mcpServers"]) { SetProp $cfg "mcpServers" (New-Object PSObject) }
    $server = [PSCustomObject]@{
      command = $uvxPath
      args    = @("mcp-obsidian")
      env     = [PSCustomObject]@{ OBSIDIAN_API_KEY = $apiKey; OBSIDIAN_HOST = "127.0.0.1"; OBSIDIAN_PORT = "27124" }
    }
    SetProp $cfg.mcpServers "obsidian" $server
    WriteJson $cfgPath $cfg
    $claudeApp = Get-Process -Name "Claude" -ErrorAction SilentlyContinue
    if ($claudeApp) { Say "      Claude 데스크톱 앱을 종료했다가 다시 켜면 연결이 적용됩니다." Yellow }
    Say "[7/7] Claude 데스크톱 앱에 옵시디언 연결 등록 완료" Green
  }
}

Say "`n=== 완료 ===" Cyan
Say "옵시디언 아래쪽 터미널에 claude 를 입력하면 Claude와 작업할 수 있습니다.`n" White
