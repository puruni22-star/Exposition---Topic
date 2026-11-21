<#
  옵시디언 + Claude 연결 설치 스크립트 (Windows PowerShell 5.1 이상)

  하는 일
    1) .obsidian 설정 파일 백업
    2) 코어 플러그인 켜기 : 파일 탐색기, 검색, 북마크, 백링크, 나가는 링크, 태그, 개요
    3) 커뮤니티 플러그인 설치·켜기
         - Terminal              (아래쪽 cmd 터미널)
         - Local REST API        (Claude 데스크톱 앱이 볼트에 접근하는 통로, 127.0.0.1:27124)
         - Claude 작업 레이아웃   (이 폴더의 plugin\jiseok-claude-layout)
    4) 볼트에 CLAUDE.md, .claude\settings.json 복사 (이미 있으면 건드리지 않음)
    5) Claude Code(CLI) 설치 여부 확인
    6) Claude 데스크톱 앱에 obsidian MCP 서버 등록 (Local REST API 키가 있을 때)

  사용법
    옵시디언을 완전히 끈 다음 install.bat 을 더블클릭하거나:
      powershell -ExecutionPolicy Bypass -File install.ps1
      powershell -ExecutionPolicy Bypass -File install.ps1 -VaultPath "D:\다른 볼트"
#>
param(
  [string]$VaultPath = (Join-Path $env:USERPROFILE "Desktop\옵시디언\My Note"),
  [switch]$SkipDownload,
  [switch]$SkipDesktop,
  [switch]$InstallClaudeCode
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
  $json = $obj | ConvertTo-Json -Depth 20
  [IO.File]::WriteAllText($path, $json, $Utf8NoBom)
}

Say "`n=== 옵시디언 + Claude 연결 설치 ===`n" Cyan

# ---------------------------------------------------------------- 0. 확인
$ObsDir = Join-Path $VaultPath ".obsidian"
if (-not (Test-Path -LiteralPath $ObsDir)) {
  Say "볼트를 찾지 못했습니다: $VaultPath" Red
  Say "  -VaultPath ""볼트 폴더 경로"" 로 다시 실행하세요." Yellow
  exit 1
}
Say "볼트: $VaultPath"

if (Get-Process -Name "Obsidian" -ErrorAction SilentlyContinue) {
  Say "옵시디언이 실행 중입니다. 설정이 덮어써지지 않도록 옵시디언을 완전히 닫아 주세요." Yellow
  Read-Host "닫았으면 Enter"
}

# ---------------------------------------------------------------- 1. 백업
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Backup = Join-Path $VaultPath ".obsidian-backup-$stamp"
New-Item -ItemType Directory -Path $Backup | Out-Null
Get-ChildItem -LiteralPath $ObsDir -Filter *.json | Copy-Item -Destination $Backup
Say "[1/6] 설정 백업: $Backup" Green

# ---------------------------------------------------------------- 2. 코어 플러그인
$corePath = Join-Path $ObsDir "core-plugins.json"
$coreWanted = @("file-explorer", "global-search", "bookmarks", "backlink", "outgoing-link", "tag-pane", "outline", "command-palette", "workspaces")
$core = ReadJson $corePath
if ($core -is [System.Array]) {
  $list = [System.Collections.ArrayList]@($core)
  foreach ($id in $coreWanted) { if (-not $list.Contains($id)) { [void]$list.Add($id) } }
  WriteJson $corePath $list.ToArray()
} else {
  if ($null -eq $core) { $core = New-Object PSObject }
  foreach ($id in $coreWanted) {
    if ($core.PSObject.Properties[$id]) { $core.$id = $true }
    else { $core | Add-Member -NotePropertyName $id -NotePropertyValue $true }
  }
  WriteJson $corePath $core
}
Say "[2/6] 코어 플러그인 켬: 파일 탐색기 / 검색 / 북마크 / 백링크 / 나가는 링크 / 태그 / 개요" Green

# ---------------------------------------------------------------- 3. 커뮤니티 플러그인
$PluginsDir = Join-Path $ObsDir "plugins"
New-Item -ItemType Directory -Force -Path $PluginsDir | Out-Null

$remote = @(
  @{ id = "terminal"; repo = "polyipseity/obsidian-terminal"; name = "Terminal" },
  @{ id = "obsidian-local-rest-api"; repo = "coddingtonbear/obsidian-local-rest-api"; name = "Local REST API" }
)
foreach ($p in $remote) {
  $dest = Join-Path $PluginsDir $p.id
  if (Test-Path -LiteralPath (Join-Path $dest "main.js")) {
    Say "      $($p.name): 이미 설치됨"
    continue
  }
  if ($SkipDownload) { Say "      $($p.name): 다운로드 건너뜀 (-SkipDownload)" Yellow; continue }
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  foreach ($f in @("main.js", "manifest.json", "styles.css")) {
    $url = "https://github.com/$($p.repo)/releases/latest/download/$f"
    try { Invoke-WebRequest -Uri $url -OutFile (Join-Path $dest $f) -UseBasicParsing }
    catch { if ($f -ne "styles.css") { throw "다운로드 실패: $url" } }
  }
  Say "      $($p.name): 설치함"
}

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
Say "[3/6] 커뮤니티 플러그인 켬: Terminal / Local REST API / Claude 작업 레이아웃" Green

# ---------------------------------------------------------------- 4. CLAUDE.md
$tpl = Join-Path $Here "vault-template"
$claudeMd = Join-Path $VaultPath "CLAUDE.md"
if (Test-Path -LiteralPath $claudeMd) { Say "[4/6] CLAUDE.md 이미 있음 → 그대로 둠" Green }
else { Copy-Item (Join-Path $tpl "CLAUDE.md") $claudeMd; Say "[4/6] CLAUDE.md 만듦 (Claude가 볼트 구조와 규칙을 읽는 파일)" Green }
$dotClaude = Join-Path $VaultPath ".claude"
New-Item -ItemType Directory -Force -Path $dotClaude | Out-Null
$settingsDest = Join-Path $dotClaude "settings.json"
if (-not (Test-Path -LiteralPath $settingsDest)) { Copy-Item (Join-Path $tpl ".claude\settings.json") $settingsDest }

# ---------------------------------------------------------------- 5. Claude Code
$claudeCmd = Get-Command claude -ErrorAction SilentlyContinue
if ($claudeCmd) {
  Say "[5/6] Claude Code 설치 확인: $($claudeCmd.Source)" Green
} elseif ($InstallClaudeCode) {
  Say "[5/6] Claude Code 설치 중..." Green
  Invoke-RestMethod https://claude.ai/install.ps1 | Invoke-Expression
} else {
  Say "[5/6] Claude Code가 아직 없습니다. 설치하려면 PowerShell에서:" Yellow
  Say "        irm https://claude.ai/install.ps1 | iex" White
  Say "      (또는 이 스크립트를 -InstallClaudeCode 옵션으로 다시 실행)" Yellow
}

# ---------------------------------------------------------------- 6. Claude 데스크톱 MCP
if ($SkipDesktop) {
  Say "[6/6] Claude 데스크톱 연결 건너뜀 (-SkipDesktop)" Yellow
} else {
  $restData = ReadJson (Join-Path $PluginsDir "obsidian-local-rest-api\data.json")
  $apiKey = $null
  if ($restData -and $restData.apiKey) { $apiKey = [string]$restData.apiKey }

  if (-not $apiKey) {
    Say "[6/6] Local REST API 키가 아직 없습니다." Yellow
    Say "      옵시디언을 한 번 켜서 Local REST API 플러그인이 키를 만든 뒤," Yellow
    Say "      옵시디언을 닫고 이 스크립트를 다시 실행하면 Claude 데스크톱 앱이 연결됩니다." Yellow
  } else {
    $uvx = Get-Command uvx -ErrorAction SilentlyContinue
    $uvxPath = "uvx"
    if ($uvx) { $uvxPath = $uvx.Source }
    else {
      Say "      uv(파이썬 도구)가 없습니다. 설치:  powershell -c ""irm https://astral.sh/uv/install.ps1 | iex""" Yellow
    }

    $cfgDir = Join-Path $env:APPDATA "Claude"
    New-Item -ItemType Directory -Force -Path $cfgDir | Out-Null
    $cfgPath = Join-Path $cfgDir "claude_desktop_config.json"
    if (Test-Path -LiteralPath $cfgPath) { Copy-Item $cfgPath "$cfgPath.backup-$stamp" }
    $cfg = ReadJson $cfgPath
    if ($null -eq $cfg) { $cfg = New-Object PSObject }
    if (-not $cfg.PSObject.Properties["mcpServers"]) {
      $cfg | Add-Member -NotePropertyName mcpServers -NotePropertyValue (New-Object PSObject)
    }
    $server = [PSCustomObject]@{
      command = $uvxPath
      args    = @("mcp-obsidian")
      env     = [PSCustomObject]@{
        OBSIDIAN_API_KEY = $apiKey
        OBSIDIAN_HOST    = "127.0.0.1"
        OBSIDIAN_PORT    = "27124"
      }
    }
    if ($cfg.mcpServers.PSObject.Properties["obsidian"]) { $cfg.mcpServers.obsidian = $server }
    else { $cfg.mcpServers | Add-Member -NotePropertyName obsidian -NotePropertyValue $server }
    WriteJson $cfgPath $cfg
    Say "[6/6] Claude 데스크톱 앱에 'obsidian' 연결 등록: $cfgPath" Green
    Say "      Claude 데스크톱 앱을 완전히 종료했다가 다시 켜세요." Green
  }
}

Say "`n=== 완료 ===" Cyan
Say "옵시디언을 열면: 왼쪽 파일 탐색기 · 가운데 노트 · 아래 cmd 터미널 · 오른쪽 백링크"
Say "아래 터미널에 claude 를 입력하면 볼트 폴더에서 Claude와 작업할 수 있습니다.`n"
