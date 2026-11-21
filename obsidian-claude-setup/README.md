# 옵시디언 + Claude 연결 키트

옵시디언을 열면 아래처럼 **자동으로 배치**되고, 그 자리에서 **Claude와 함께 작업**할 수 있게 해 줍니다.

```
┌──────────────┬──────────────────────────────┬───────────────────┐
│ 파일 탐색기   │  노트 편집 (새 탭)             │ 백링크             │
│ _성경본문색인 │                              │ (링크된 언급 /      │
│ 01_Raw       │                              │  링크되지 않은 언급)│
│ 02_Wiki      ├──────────────────────────────┤ + 나가는 링크       │
│ 03_Project   │ >_ cmd (고정)                 │ + 태그 + 개요       │
│ ...          │ C:\...\My Note> claude        │                   │
└──────────────┴──────────────────────────────┴───────────────────┘
                                         상태 표시줄: CLI REST 127.0.0.1:27124
```

## Claude와 연결되는 두 가지 길

| 방법 | 어디서 | 무엇을 할 수 있나 |
|---|---|---|
| **① Claude Code** (주 방법) | 옵시디언 아래 cmd 터미널에 `claude` 입력 | 볼트의 노트를 직접 읽고, 찾고, 새 노트를 쓰고 고칩니다. `CLAUDE.md`에 적힌 폴더 구조와 규칙을 따릅니다. |
| **② Claude 데스크톱 앱** | Claude 앱 대화창 | Local REST API(127.0.0.1:27124)를 통해 볼트를 검색하고 노트를 읽고 씁니다. |

## 설치 (한 번만)

1. 이 `obsidian-claude-setup` 폴더를 PC에 내려받습니다.
   (GitHub에서 **Code → Download ZIP** → 압축 풀기)
2. **옵시디언을 완전히 닫습니다.**
3. `install.bat`을 더블클릭합니다.
   - 볼트 경로 기본값은 `바탕화면\옵시디언\My Note`입니다.
   - 다른 곳이면 PowerShell에서 아래처럼 실행합니다.

     ```bash
     powershell -ExecutionPolicy Bypass -File install.ps1 -VaultPath "D:\다른 볼트"
     ```

4. 옵시디언을 엽니다. 처음 한 번은 **설정 → 커뮤니티 플러그인**에서 "제한 모드 끄기"를 확인하고, 새 플러그인 3개(Terminal, Local REST API, Claude 작업 레이아웃)가 켜져 있는지 봅니다.
5. Claude Code가 없다면 PowerShell에서 설치합니다.

   ```bash
   irm https://claude.ai/install.ps1 | iex
   ```

6. **Claude 데스크톱 앱도 연결하려면** (②번 방법):
   - 4번에서 옵시디언을 한 번 켜면 Local REST API가 API 키를 만듭니다.
   - 옵시디언을 닫고 `install.bat`을 **한 번 더** 실행하면, 그 키로 Claude 앱 설정(`%APPDATA%\Claude\claude_desktop_config.json`)에 `obsidian` 연결이 등록됩니다.
   - `uvx`가 없다고 나오면 먼저 아래 명령으로 uv를 설치합니다.

     ```bash
     powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
     ```

   - Claude 데스크톱 앱을 완전히 종료했다가 다시 켭니다.

## 터미널을 아래쪽에 열기 (권장 설정 한 가지)

Terminal 플러그인 설정에서 **새 인스턴스 동작(New instance behavior)**을 **새 수평 분할(New horizontal split)**로 바꾸세요. 그래야 터미널이 사진처럼 노트 **아래**에 열립니다. 한 번 열린 터미널은 옵시디언이 기억해서 다음에도 그 자리에 다시 열립니다.

## 매일 쓰는 법

| 하고 싶은 일 | 방법 |
|---|---|
| Claude와 대화 시작 | 아래 cmd 터미널에 `claude` 입력 후 Enter |
| 지난 대화 이어 하기 | `claude --continue` |
| 별도 창에서 Claude 실행 | 왼쪽 리본의 🤖 아이콘, 또는 명령 팔레트(Ctrl+P) → "Claude Code 실행" |
| 지금 보는 노트를 Claude에게 보여 주기 | Ctrl+P → "현재 노트를 Claude 참조(@경로)로 복사" → Claude 입력창에 붙여 넣기 |
| 레이아웃이 흐트러졌을 때 | 리본의 레이아웃 아이콘, 또는 Ctrl+P → "Claude 작업 레이아웃 적용" |

### Claude에게 이렇게 부탁해 보세요
- `@설교조안/261018_마22장15-22.md 이 초안을 70~80대 성도님들이 듣기 쉽게 문장을 짧게 다듬어 줘`
- `01_Raw 에 새로 넣은 강의 메모를 02_Wiki 에 주제별 노트로 정리하고 원자료에 링크해 줘`
- `_성경본문색인 에서 아직 설교하지 않은 요한복음 본문을 찾아 줘`
- `품성_MD 의 노트들을 바탕으로 '작은 예수' 품성 12주 양육 과정 초안을 03_Project 에 만들어 줘`

## 들어 있는 파일

| 파일 | 설명 |
|---|---|
| `install.bat` / `install.ps1` | 설치 스크립트. 실행 전에 `.obsidian` 설정을 `.obsidian-backup-날짜` 폴더에 백업합니다. |
| `plugin/jiseok-claude-layout/` | 직접 만든 옵시디언 플러그인. 시작할 때 레이아웃을 맞추고 Claude 실행 명령을 추가합니다. |
| `vault-template/CLAUDE.md` | Claude가 볼트에서 일할 때 읽는 안내서(폴더 구조, 회중 정보, 작업 규칙). 볼트에 맞게 고쳐 쓰세요. |
| `vault-template/.claude/settings.json` | 읽기·검색은 묻지 않고 허용, REST API 키 파일은 읽지 못하게 막음. |

## 되돌리기
- 볼트의 `.obsidian-backup-날짜` 폴더 안 `.json` 파일을 `.obsidian`에 다시 복사하면 설치 전 설정으로 돌아갑니다.
- Claude 앱 설정은 `claude_desktop_config.json.backup-날짜`로 백업되어 있습니다.
