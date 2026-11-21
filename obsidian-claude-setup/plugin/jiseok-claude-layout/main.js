/*
 * Claude 작업 레이아웃 (jiseok-claude-layout)
 *
 * 옵시디언을 열면 다음 레이아웃을 자동으로 맞춥니다.
 *   - 왼쪽 사이드바 : 파일 탐색기(+검색, 북마크 탭)
 *   - 가운데        : 노트 편집 영역
 *   - 가운데 아래   : 통합 터미널(cmd, 볼트 폴더) → 여기서 `claude` 실행
 *   - 오른쪽 사이드바: 백링크(+나가는 링크, 태그, 개요 탭)
 *
 * 그리고 Claude Code와 함께 작업하기 위한 명령을 추가합니다.
 *   - Claude Code 실행 (볼트 폴더에서 새 터미널 창)
 *   - 현재 노트를 Claude 참조(@경로)로 복사
 */
const { Plugin, PluginSettingTab, Setting, Notice, FileSystemAdapter } = require("obsidian");

const DEFAULT_SETTINGS = {
  applyOnStartup: true,
  openTerminal: true,
  leftWidth: 260,
  rightWidth: 480,
  claudeCommand: "claude",
  launcher: "cmd", // "cmd" | "wt" (Windows Terminal)
};

const LEFT_VIEWS = ["file-explorer", "search", "bookmarks"];
const RIGHT_VIEWS = ["backlink", "outgoing-link", "tag", "outline"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = class JiseokClaudeLayout extends Plugin {
  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

    this.addCommand({
      id: "apply-layout",
      name: "Claude 작업 레이아웃 적용",
      callback: () => this.applyLayout(true),
    });
    this.addCommand({
      id: "launch-claude",
      name: "Claude Code 실행 (볼트 폴더)",
      callback: () => this.launchClaude(),
    });
    this.addCommand({
      id: "copy-note-ref",
      name: "현재 노트를 Claude 참조(@경로)로 복사",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;
        if (!checking) this.copyNoteRef(file);
        return true;
      },
    });

    this.addRibbonIcon("bot", "Claude Code 실행", () => this.launchClaude());
    this.addRibbonIcon("layout-dashboard", "Claude 작업 레이아웃 적용", () => this.applyLayout(true));

    this.addSettingTab(new ClaudeLayoutSettingTab(this.app, this));

    this.app.workspace.onLayoutReady(() => {
      if (this.settings.applyOnStartup) {
        // 다른 플러그인(터미널 등)이 먼저 로드되도록 잠시 기다린다.
        setTimeout(() => this.applyLayout(false), 800);
      }
    });
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  /* ---------------- 레이아웃 ---------------- */

  leafType(leaf) {
    try {
      return leaf.getViewState().type;
    } catch (e) {
      return "";
    }
  }

  viewAvailable(type) {
    const reg = this.app.viewRegistry;
    if (reg && typeof reg.getViewCreatorByType === "function") {
      return !!reg.getViewCreatorByType(type);
    }
    return true;
  }

  getMainLeaf() {
    const ws = this.app.workspace;
    let found = null;
    ws.iterateRootLeaves((leaf) => {
      if (!found && !this.leafType(leaf).startsWith("terminal:")) found = leaf;
    });
    return found;
  }

  async ensureSideViews(side, types) {
    const ws = this.app.workspace;
    for (const type of types) {
      if (!this.viewAvailable(type)) continue;
      if (ws.getLeavesOfType(type).length > 0) continue;
      const leaf = side === "left" ? ws.getLeftLeaf(false) : ws.getRightLeaf(false);
      if (leaf) await leaf.setViewState({ type, active: false });
    }
    const first = ws.getLeavesOfType(types[0])[0];
    if (first) {
      // 탭 그룹 안에서 이 탭을 맨 앞으로 보이게 한다.
      const parent = first.parent;
      if (parent && typeof parent.selectTab === "function") parent.selectTab(first);
    }
  }

  setSideWidth(split, width) {
    if (!split || !width) return;
    try {
      if (typeof split.setSize === "function") split.setSize(width);
    } catch (e) {
      /* 내부 API가 바뀌었으면 너비 조정은 건너뛴다 */
    }
  }

  async applyLayout(manual) {
    const ws = this.app.workspace;
    try {
      await this.ensureSideViews("left", LEFT_VIEWS);
      await this.ensureSideViews("right", RIGHT_VIEWS);

      ws.leftSplit && ws.leftSplit.expand();
      ws.rightSplit && ws.rightSplit.expand();
      this.setSideWidth(ws.leftSplit, this.settings.leftWidth);
      this.setSideWidth(ws.rightSplit, this.settings.rightWidth);

      if (!this.getMainLeaf()) ws.getLeaf(false);

      if (this.settings.openTerminal) await this.ensureTerminal(manual);

      const main = this.getMainLeaf();
      if (main) ws.setActiveLeaf(main, { focus: true });

      if (manual) new Notice("Claude 작업 레이아웃을 적용했습니다.");
    } catch (e) {
      console.error("[jiseok-claude-layout]", e);
      if (manual) new Notice("레이아웃 적용 중 오류: " + e.message);
    }
  }

  findTerminalLeaf() {
    let found = null;
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (!found && this.leafType(leaf).startsWith("terminal:")) found = leaf;
    });
    return found;
  }

  async ensureTerminal(manual) {
    if (this.findTerminalLeaf()) return; // 이미 열려 있으면 그대로 둔다

    const commands = (this.app.commands && this.app.commands.commands) || {};
    const ids = Object.keys(commands).filter((id) => id.startsWith("terminal:open-terminal"));
    const pick =
      ids.find((id) => /integrated/.test(id) && /root/.test(id)) ||
      ids.find((id) => /integrated/.test(id)) ||
      ids[0];

    if (!pick) {
      if (manual) {
        new Notice("Terminal 플러그인이 없거나 꺼져 있습니다. 커뮤니티 플러그인에서 'Terminal'을 켜 주세요.");
      }
      return;
    }

    const ws = this.app.workspace;
    const main = this.getMainLeaf();
    if (main) ws.setActiveLeaf(main, { focus: false });
    this.app.commands.executeCommandById(pick);

    for (let i = 0; i < 25; i++) {
      await sleep(200);
      const leaf = this.findTerminalLeaf();
      if (leaf) {
        if (typeof leaf.setPinned === "function") leaf.setPinned(true);
        return;
      }
    }
  }

  /* ---------------- Claude 연결 ---------------- */

  vaultPath() {
    const adapter = this.app.vault.adapter;
    if (adapter instanceof FileSystemAdapter) return adapter.getBasePath();
    return null;
  }

  launchClaude() {
    const cwd = this.vaultPath();
    if (!cwd) {
      new Notice("볼트 폴더 경로를 찾을 수 없습니다.");
      return;
    }
    const cmd = (this.settings.claudeCommand || "claude").trim();
    const { spawn } = require("child_process");
    const opts = { detached: true, stdio: "ignore" };

    try {
      let child;
      if (process.platform === "win32") {
        const line =
          this.settings.launcher === "wt"
            ? `wt.exe -d "${cwd}" cmd /k ${cmd}`
            : `start "Claude Code" /D "${cwd}" cmd /k ${cmd}`;
        child = spawn("cmd.exe", ["/c", line], Object.assign({ windowsVerbatimArguments: true }, opts));
      } else if (process.platform === "darwin") {
        const script = `tell application "Terminal" to do script "cd ${JSON.stringify(cwd).slice(1, -1)} && ${cmd}"`;
        child = spawn("osascript", ["-e", script], opts);
      } else {
        child = spawn("x-terminal-emulator", ["-e", `bash -lc 'cd "${cwd}" && ${cmd}; exec bash'`], opts);
      }
      child.on("error", (err) => new Notice("Claude Code 실행 실패: " + err.message));
      child.unref();
      new Notice("Claude Code를 볼트 폴더에서 실행합니다.");
    } catch (e) {
      new Notice("Claude Code 실행 실패: " + e.message);
    }
  }

  async copyNoteRef(file) {
    const ref = "@" + file.path;
    try {
      await navigator.clipboard.writeText(ref);
      new Notice(`복사됨: ${ref}\nClaude Code 입력창에 붙여 넣으세요.`);
    } catch (e) {
      new Notice("클립보드 복사 실패: " + e.message);
    }
  }
};

class ClaudeLayoutSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    const s = this.plugin.settings;
    const save = () => this.plugin.saveSettings();
    containerEl.empty();
    containerEl.createEl("h2", { text: "Claude 작업 레이아웃" });

    new Setting(containerEl)
      .setName("시작할 때 레이아웃 적용")
      .setDesc("옵시디언을 열면 파일 탐색기 · 백링크 · 터미널을 자동으로 배치합니다.")
      .addToggle((t) => t.setValue(s.applyOnStartup).onChange(async (v) => { s.applyOnStartup = v; await save(); }));

    new Setting(containerEl)
      .setName("아래쪽 터미널 열기")
      .setDesc("Terminal 플러그인의 통합 터미널(볼트 폴더)을 엽니다. 거기서 claude 를 입력하면 됩니다.")
      .addToggle((t) => t.setValue(s.openTerminal).onChange(async (v) => { s.openTerminal = v; await save(); }));

    new Setting(containerEl)
      .setName("왼쪽 사이드바 너비(px)")
      .addText((t) => t.setValue(String(s.leftWidth)).onChange(async (v) => { s.leftWidth = parseInt(v, 10) || 0; await save(); }));

    new Setting(containerEl)
      .setName("오른쪽 사이드바 너비(px)")
      .addText((t) => t.setValue(String(s.rightWidth)).onChange(async (v) => { s.rightWidth = parseInt(v, 10) || 0; await save(); }));

    new Setting(containerEl)
      .setName("Claude 실행 명령")
      .setDesc("기본값: claude  (예: claude --continue  → 지난 대화 이어서)")
      .addText((t) => t.setValue(s.claudeCommand).onChange(async (v) => { s.claudeCommand = v; await save(); }));

    new Setting(containerEl)
      .setName("새 창 터미널 종류 (Windows)")
      .addDropdown((d) =>
        d
          .addOption("cmd", "명령 프롬프트(cmd)")
          .addOption("wt", "Windows Terminal")
          .setValue(s.launcher)
          .onChange(async (v) => { s.launcher = v; await save(); })
      );
  }
}
