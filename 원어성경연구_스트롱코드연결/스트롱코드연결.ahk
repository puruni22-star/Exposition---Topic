; ============================================================================
;  스트롱코드연결.ahk  —  원어성경연구.exe 스트롱 코드 더블클릭 → 사전 자동 연결
;  (AutoHotkey v2 전용)
;
;  ■ 하는 일
;    원어성경연구.exe 창에서 스트롱 코드 번호(H1254, G3056, <1254>, 1254 …)를
;    마우스로 더블 클릭하면, 같은 폴더의 「스트롱코드사전.html」이 열리면서
;    그 단어의 원어·음역·발음·뜻·어원이 바로 나타납니다.
;
;  ■ 단축키
;    더블 클릭           : (원어성경연구 창 안에서) 스트롱 코드 찾기
;    Ctrl + Alt + F      : (어느 창에서든) 선택한 글자를 사전에서 찾기 / 없으면 입력창
;    Ctrl + Alt + P      : 자동 연결 잠시 멈춤 / 다시 켜기
;
;  ■ 설정은 같은 폴더의 「스트롱코드연결.ini」에서 바꿀 수 있습니다(없으면 기본값).
; ============================================================================
#Requires AutoHotkey v2.0
#SingleInstance Force
Persistent
SetTitleMatchMode 2

global APP_NAME   := "스트롱코드연결"
global INI_FILE   := A_ScriptDir "\스트롱코드연결.ini"
global DICT_FILE  := A_ScriptDir "\스트롱코드사전.html"
global DICT_TITLE := "스트롱 코드 사전"

; ---- 설정 읽기 ---------------------------------------------------------------
global TargetExes  := StrSplit(IniRead(INI_FILE, "설정", "대상프로그램", "원어성경연구.exe|bw900.exe|bw.exe"), "|", " `t")
global AllowBare   := IniRead(INI_FILE, "설정", "숫자만허용", "1") = "1"
global DefaultLang := StrUpper(IniRead(INI_FILE, "설정", "숫자만일때", ""))   ; "", "H", "G"
global BrowserCmd  := IniRead(INI_FILE, "설정", "브라우저", "")               ; 비우면 자동(Edge→Chrome→기본 브라우저)
global ReuseWindow := IniRead(INI_FILE, "설정", "창하나만", "1") = "1"
global LogFile     := IniRead(INI_FILE, "설정", "기록파일", "")               ; 시험용(보통 비워 둠)
global Paused      := false
global LaunchedPid := 0
global LastHandled := 0

; ---- 트레이 메뉴 ------------------------------------------------------------
A_IconTip := APP_NAME " — 스트롱 코드 더블클릭 → 사전"
tray := A_TrayMenu
tray.Delete()
tray.Add("스트롱 코드 사전 열기", (*) => OpenDictionary(""))
tray.Add("코드 직접 입력해서 찾기`tCtrl+Alt+F", (*) => AskAndLookup())
tray.Add()
tray.Add("자동 연결 멈춤`tCtrl+Alt+P", (*) => TogglePause())
tray.Add("윈도우 시작할 때 자동 실행", (*) => ToggleStartup())
tray.Add()
tray.Add("사용법", (*) => ShowHelp())
tray.Add("종료", (*) => ExitApp())
tray.Default := "스트롱 코드 사전 열기"
if FileExist(StartupLink())
    tray.Check("윈도우 시작할 때 자동 실행")

if !FileExist(DICT_FILE)
    MsgBox("「스트롱코드사전.html」 파일을 찾을 수 없습니다.`n`n이 프로그램과 같은 폴더에 두어 주세요.`n" DICT_FILE, APP_NAME, "Icon!")

; 같은 폴더에 원어성경연구.exe가 있고 아직 안 켜져 있으면 함께 실행
StartTargetIfPresent()
TrayTip("원어성경연구에서 스트롱 코드를 더블 클릭하면 사전이 열립니다.", APP_NAME, "Mute")

; ============================================================================
;  더블 클릭 감지 (원어성경연구 창이 활성일 때만)
; ============================================================================
#HotIf IsTargetActive()
~LButton::
{
    global LastHandled
    if Paused
        return
    dbl := DllCall("GetDoubleClickTime", "UInt")
    if !(A_PriorHotkey = ThisHotkey && A_TimeSincePriorHotkey <= dbl)
        return
    if (A_TickCount - LastHandled <= dbl)     ; 세 번째 클릭은 무시
        return
    LastHandled := A_TickCount
    KeyWait "LButton", "T1"
    Sleep 80                                   ; 프로그램이 단어를 선택할 시간
    text := CopySelection()
    code := ParseStrong(text)
    Log("dblclick text=[" text "] code=[" code "]")
    if (code != "")
        OpenDictionary(code)
}
#HotIf

^!f::
{
    text := CopySelection()
    code := ParseStrong(text)
    if (code != "")
        OpenDictionary(code)
    else
        AskAndLookup(text)
}

^!p::TogglePause()

; ============================================================================
;  함수들
; ============================================================================
IsTargetActive(*) {
    try exe := WinGetProcessName("A")
    catch
        return false
    for name in TargetExes
        if (name != "" && StrLower(exe) = StrLower(name))
            return true
    return false
}

; 현재 선택된 글자를 클립보드를 거쳐 가져오고, 원래 클립보드는 되돌려 놓음
CopySelection() {
    saved := ClipboardAll()
    A_Clipboard := ""
    Send "^c"
    got := ClipWait(0.6)
    text := got ? A_Clipboard : ""
    A_Clipboard := saved
    saved := ""
    return Trim(text, " `t`r`n")
}

; 스트롱 코드 인식: H1254 / G3056 / h 1254 / <1254> / [H01254] / 히1254 / 헬3056 / 1254
; 돌려주는 값: "H1254", "G3056", 숫자만이면 "1254"(또는 설정에 따라 H/G 붙임), 아니면 ""
ParseStrong(text) {
    if (text = "" || StrLen(text) > 20)
        return ""
    if !RegExMatch(text, "i)^[<\[(（{]?\s*(H|G|히|헬|HEB|GRK|GK)?\s*[-:.]?\s*0*(\d{1,5})\s*[A-Za-z]?\s*[>\])）}]?\s*[.,;:]?$", &m)
        return ""
    num := Integer(m[2])
    if (num < 1)
        return ""
    p := StrUpper(m[1])
    if (p = "H" || p = "히" || p = "HEB") {
        if (num > 8674)
            return ""
        return "H" num
    }
    if (p = "G" || p = "헬" || p = "GRK" || p = "GK") {
        if (num > 5624)
            return ""
        return "G" num
    }
    if (!AllowBare || num > 8674)
        return ""
    if (DefaultLang = "H" || DefaultLang = "G")
        return DefaultLang num
    return String(num)
}

OpenDictionary(code) {
    if !FileExist(DICT_FILE) {
        MsgBox("「스트롱코드사전.html」을 찾을 수 없습니다.`n" DICT_FILE, APP_NAME, "Icon!")
        return
    }
    url := FileUrl(DICT_FILE) (code != "" ? "#" code : "")
    browser := FindBrowser()
    Log("open code=[" code "] url=[" url "] browser=[" browser "]")
    if (browser != "") {
        if ReuseWindow {
            for exeName in ["msedge.exe", "chrome.exe"]
                loop 3 {
                    if !(hwnd := WinExist(DICT_TITLE " ahk_exe " exeName))
                        break
                    WinClose(hwnd)
                    WinWaitClose(hwnd, , 1)
                }
        }
        try {
            Run('"' browser '" --app="' url '" --window-size=760,820')
            return
        } catch as e {
            Log("browser run failed: " e.Message)
        }
    }
    ; Edge/Chrome이 없으면: 기본 브라우저로 (주소의 # 부분이 사라지지 않도록 중간 파일 사용)
    tmp := A_Temp "\스트롱코드_열기.html"
    try FileDelete(tmp)
    FileAppend('<!doctype html><meta charset="utf-8"><script>location.replace(' JsStr(url) ');</script>', tmp, "UTF-8")
    Run(tmp)
}

FindBrowser() {
    if (BrowserCmd != "")
        return BrowserCmd
    cands := [
        EnvGet("ProgramFiles(x86)") "\Microsoft\Edge\Application\msedge.exe",
        EnvGet("ProgramFiles") "\Microsoft\Edge\Application\msedge.exe",
        EnvGet("LocalAppData") "\Microsoft\Edge\Application\msedge.exe",
        EnvGet("ProgramFiles") "\Google\Chrome\Application\chrome.exe",
        EnvGet("ProgramFiles(x86)") "\Google\Chrome\Application\chrome.exe",
        EnvGet("LocalAppData") "\Google\Chrome\Application\chrome.exe"
    ]
    for p in cands
        if (p != "" && FileExist(p))
            return p
    return ""
}

; D:\내목회\원어성경연구(BibleWork 9 응용)\스트롱코드사전.html → file:///D:/%EB%82%B4.../...
FileUrl(path) {
    out := ""
    buf := Buffer(StrPut(StrReplace(path, "\", "/"), "UTF-8"))
    n := StrPut(StrReplace(path, "\", "/"), buf, "UTF-8") - 1
    loop n {
        b := NumGet(buf, A_Index - 1, "UChar")
        c := Chr(b)
        if (b < 128 && RegExMatch(c, "[A-Za-z0-9/:._~-]"))
            out .= c
        else
            out .= Format("%{:02X}", b)
    }
    return "file:///" out
}

JsStr(s) => '"' StrReplace(StrReplace(s, "\", "\\"), '"', '\"') '"'

AskAndLookup(initial := "") {
    ib := InputBox("찾을 스트롱 코드를 입력하세요.`n예: H1254 (히브리어), G3056 (헬라어), 1254", APP_NAME, "w320 h150", initial)
    if (ib.Result != "OK")
        return
    code := ParseStrong(Trim(ib.Value))
    if (code = "") {
        MsgBox("스트롱 코드 형식이 아닙니다: " ib.Value "`n예: H1254, G3056", APP_NAME, "Icon!")
        return
    }
    OpenDictionary(code)
}

TogglePause() {
    global Paused
    Paused := !Paused
    if Paused
        A_TrayMenu.Check("자동 연결 멈춤`tCtrl+Alt+P")
    else
        A_TrayMenu.Uncheck("자동 연결 멈춤`tCtrl+Alt+P")
    TrayTip(Paused ? "자동 연결을 잠시 멈췄습니다." : "자동 연결을 다시 켰습니다.", APP_NAME, "Mute")
}

StartupLink() => A_Startup "\" APP_NAME ".lnk"

ToggleStartup() {
    lnk := StartupLink()
    if FileExist(lnk) {
        FileDelete(lnk)
        A_TrayMenu.Uncheck("윈도우 시작할 때 자동 실행")
    } else {
        target := A_IsCompiled ? A_ScriptFullPath : A_AhkPath
        args := (A_IsCompiled ? "" : '"' A_ScriptFullPath '" ') "/norun"
        FileCreateShortcut(target, lnk, A_ScriptDir, args, "원어성경연구 스트롱 코드 사전 연결")
        A_TrayMenu.Check("윈도우 시작할 때 자동 실행")
    }
}

StartTargetIfPresent() {
    global LaunchedPid
    for name in TargetExes {
        if (name = "")
            continue
        if ProcessExist(name)
            return
    }
    exe := A_ScriptDir "\" TargetExes[1]
    if (A_Args.Length && A_Args[1] = "/norun")
        return
    if FileExist(exe) {
        try {
            Run('"' exe '"', A_ScriptDir, , &pid)
            LaunchedPid := pid
        }
    }
}

ShowHelp() {
    MsgBox(
        "■ 원어성경연구 창에서 스트롱 코드 번호를 더블 클릭하세요.`n"
      . "    → 스트롱 코드 사전 창이 열리며 뜻이 나타납니다.`n`n"
      . "■ 인식하는 형식`n"
      . "    H1254, G3056, <1254>, [H01254], 히1254, 헬3056, 1254(숫자만)`n"
      . "    숫자만 있으면 히브리어·헬라어 뜻을 함께 보여 드립니다.`n`n"
      . "■ Ctrl+Alt+F : 선택한 글자를 사전에서 찾기 (어느 창에서나)`n"
      . "■ Ctrl+Alt+P : 자동 연결 잠시 멈춤 / 다시 켜기`n`n"
      . "■ 설정 파일: 스트롱코드연결.ini",
        APP_NAME, "Iconi")
}

Log(msg) {
    if (LogFile != "")
        try FileAppend(FormatTime(, "HH:mm:ss") " " msg "`n", LogFile, "UTF-8")
}
