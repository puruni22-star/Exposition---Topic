# 스트롱코드연결 설치 스크립트
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
$src = Split-Path -Parent $MyInvocation.MyCommand.Path
$title = '스트롱코드연결 설치'

function Say($msg, $icon = 'Information') {
    [System.Windows.Forms.MessageBox]::Show($msg, $title, 'OK', $icon) | Out-Null
}

try {
    # 1. 설치할 폴더 찾기
    $target = 'D:\내목회\원어성경연구(BibleWork 9 응용)'
    if (-not (Test-Path -LiteralPath (Join-Path $target '원어성경연구.exe'))) {
        $found = $null
        if (Test-Path -LiteralPath 'D:\내목회') {
            $found = Get-ChildItem -LiteralPath 'D:\내목회' -Recurse -Filter '원어성경연구.exe' -ErrorAction SilentlyContinue | Select-Object -First 1
        }
        if ($found) { $target = $found.DirectoryName }
        else {
            Say "원어성경연구.exe가 있는 폴더를 찾지 못했습니다.`n다음 창에서 그 폴더를 골라 주세요."
            $dlg = New-Object System.Windows.Forms.FolderBrowserDialog
            $dlg.Description = '원어성경연구.exe가 들어 있는 폴더를 선택하세요'
            if ($dlg.ShowDialog() -ne 'OK') { Say '설치를 취소했습니다.'; exit 1 }
            $target = $dlg.SelectedPath
        }
    }

    # 2. 실행 중인 이전 버전 종료
    Get-CimInstance Win32_Process -Filter "Name='AutoHotkey64.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -like '*스트롱코드연결.ahk*' } |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Milliseconds 500

    # 3. 파일 복사 (설정 파일은 이미 있으면 그대로 둠)
    $files = @{
        'strongs_link.ahk'         = '스트롱코드연결.ahk'
        'strongs_dictionary.html'  = '스트롱코드사전.html'
        'AutoHotkey64.exe'         = 'AutoHotkey64.exe'
        'AutoHotkey_license.txt'   = 'AutoHotkey_license.txt'
    }
    foreach ($k in $files.Keys) {
        Copy-Item -LiteralPath (Join-Path $src $k) -Destination (Join-Path $target $files[$k]) -Force
    }
    $ini = Join-Path $target '스트롱코드연결.ini'
    if (-not (Test-Path -LiteralPath $ini)) {
        Copy-Item -LiteralPath (Join-Path $src 'strongs_link.ini') -Destination $ini
    }
    Get-ChildItem -LiteralPath $target | Unblock-File -ErrorAction SilentlyContinue

    # 4. 바로가기 만들기 (바탕화면 + 윈도우 시작 시 자동 실행)
    $engine = Join-Path $target 'AutoHotkey64.exe'
    $script = Join-Path $target '스트롱코드연결.ahk'
    $shell = New-Object -ComObject WScript.Shell
    $links = @(
        (Join-Path ([Environment]::GetFolderPath('Desktop')) '원어성경연구 (스트롱 사전).lnk'),
        (Join-Path ([Environment]::GetFolderPath('Startup')) '스트롱코드연결.lnk')
    )
    foreach ($l in $links) {
        $sc = $shell.CreateShortcut($l)
        $sc.TargetPath = $engine
        $sc.Arguments = '"' + $script + '"'
        if ($l -eq $links[1]) { $sc.Arguments += ' /norun' }
        $sc.WorkingDirectory = $target
        $exe = Join-Path $target '원어성경연구.exe'
        if (Test-Path -LiteralPath $exe) { $sc.IconLocation = "$exe,0" }
        $sc.Description = '원어성경연구 + 스트롱 코드 더블클릭 사전'
        $sc.Save()
    }

    # 5. 실행
    Start-Process -FilePath $engine -ArgumentList ('"' + $script + '"') -WorkingDirectory $target

    Say ("설치가 끝났습니다!`n`n설치 위치: $target`n`n" +
         "• 바탕화면의 「원어성경연구 (스트롱 사전)」 아이콘으로 실행하세요.`n" +
         "• 원어성경연구에서 스트롱 코드 번호를 더블 클릭하면 사전이 열립니다.`n" +
         "• 윈도우를 켤 때 자동으로 준비됩니다.")
}
catch {
    Say ("설치 중 문제가 생겼습니다:`n" + $_.Exception.Message) 'Error'
    exit 1
}
