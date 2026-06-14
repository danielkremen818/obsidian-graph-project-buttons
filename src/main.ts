import { Plugin, debounce, setIcon, type WorkspaceLeaf } from "obsidian";
import {
  DEFAULT_SETTINGS,
  GraphProjectButtonsSettingTab,
  type GraphProjectButtonsSettings,
} from "./settings";
import {
  computeProjects,
  isActiveQuery,
  projectQuery,
  shouldSkipSearchUpdate,
} from "./projects";

export default class GraphProjectButtonsPlugin extends Plugin {
  settings!: GraphProjectButtonsSettings;

  private projectCache: string[] | null = null;
  private readonly observers = new Map<HTMLElement, MutationObserver>();
  private collapsed = false;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.collapsed = this.settings.startCollapsed;

    this.addSettingTab(new GraphProjectButtonsSettingTab(this.app, this));

    // Re-inject when the workspace layout or active leaf changes.
    const reinject = debounce(() => {
      this.injectAll();
    }, 120, true);
    this.registerEvent(this.app.workspace.on("layout-change", reinject));
    this.registerEvent(this.app.workspace.on("active-leaf-change", reinject));

    // The project list only changes when files are added/removed/renamed.
    const invalidate = debounce(() => {
      this.projectCache = null;
      this.injectAll();
    }, 400, true);
    this.registerEvent(this.app.vault.on("create", invalidate));
    this.registerEvent(this.app.vault.on("delete", invalidate));
    this.registerEvent(this.app.vault.on("rename", invalidate));

    this.app.workspace.onLayoutReady(() => {
      this.injectAll();
    });
  }

  onunload(): void {
    for (const observer of this.observers.values()) observer.disconnect();
    this.observers.clear();
    // Scope per graph leaf so popout windows are covered too.
    for (const leaf of this.app.workspace.getLeavesOfType("graph")) {
      const content = this.getContentEl(leaf);
      content?.querySelectorAll(".gpb-bar").forEach((el) => {
        el.remove();
      });
    }
  }

  async loadSettings(): Promise<void> {
    const data = (await this.loadData()) as Partial<GraphProjectButtonsSettings> | null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.projectCache = null;
    this.refreshAll();
  }

  private getProjects(): string[] {
    if (this.projectCache) return this.projectCache;
    const paths = this.app.vault.getFiles().map((file) => file.path);
    this.projectCache = computeProjects(paths, this.settings.rootFolder);
    return this.projectCache;
  }

  private injectAll(): void {
    for (const leaf of this.app.workspace.getLeavesOfType("graph")) {
      this.injectInto(leaf);
    }
  }

  private refreshAll(): void {
    for (const leaf of this.app.workspace.getLeavesOfType("graph")) {
      const content = this.getContentEl(leaf);
      const bar = content?.querySelector(".gpb-bar");
      if (bar) bar.remove();
      this.injectInto(leaf);
    }
  }

  private getContentEl(leaf: WorkspaceLeaf): HTMLElement | null {
    return leaf.view.containerEl.querySelector<HTMLElement>(".view-content");
  }

  private injectInto(leaf: WorkspaceLeaf): void {
    const content = this.getContentEl(leaf);
    if (!content) return;
    if (content.querySelector(".gpb-bar")) return;

    const bar = content.createDiv({ cls: "gpb-bar" });
    bar.toggleClass("gpb-right", this.settings.position === "right");
    bar.toggleClass("gpb-collapsed", this.collapsed);

    const chevron = bar.createEl("button", {
      cls: "gpb-btn gpb-toggle",
      attr: { "aria-label": "Toggle project buttons" },
    });
    this.applyIcon(chevron, this.collapsed ? "chevron-right" : "chevron-left");
    this.registerDomEvent(chevron, "click", (event) => {
      event.preventDefault();
      this.collapsed = !this.collapsed;
      this.refreshAll();
    });

    const group = bar.createDiv({ cls: "gpb-group" });

    const mk = (label: string, query: string, icon: string, extraCls?: string): HTMLElement => {
      const button = group.createEl("button", {
        cls: "gpb-btn" + (extraCls ? " " + extraCls : ""),
      });
      if (this.settings.showIcons && icon) this.applyIcon(button, icon);
      button.createSpan({ text: label });
      button.dataset.query = query;
      this.registerDomEvent(button, "click", (event) => {
        event.preventDefault();
        this.setSearch(leaf, query);
        group.findAll(".gpb-btn").forEach((other) => {
          other.removeClass("gpb-active");
        });
        chevron.removeClass("gpb-active");
        button.addClass("gpb-active");
      });
      return button;
    };

    if (this.settings.showCurated) {
      mk(this.settings.curatedLabel, this.settings.curatedQuery, "sparkles", "gpb-primary");
    }
    if (this.settings.showAllButton) {
      mk("All projects", projectQuery(this.settings.rootFolder), "layers");
    }
    for (const project of this.getProjects()) {
      mk(project, projectQuery(this.settings.rootFolder, project), "folder");
    }

    this.markActive(leaf, group);
    this.observe(leaf, content);
  }

  private applyIcon(el: HTMLElement, name: string): void {
    const span = el.createSpan({ cls: "gpb-icon" });
    setIcon(span, name);
  }

  private markActive(leaf: WorkspaceLeaf, group: HTMLElement): void {
    const input = this.searchInput(leaf);
    if (!input) return;
    const current = input.value;
    group.findAll(".gpb-btn").forEach((button) => {
      const query = button.dataset.query;
      if (query && isActiveQuery(current, query)) button.addClass("gpb-active");
    });
  }

  // Re-add the bar if the graph renderer wipes .view-content (no polling).
  private observe(leaf: WorkspaceLeaf, content: HTMLElement): void {
    if (this.observers.has(content)) return;
    const observer = new MutationObserver(() => {
      if (!content.querySelector(".gpb-bar")) {
        this.observers.delete(content);
        observer.disconnect();
        this.injectInto(leaf);
      }
    });
    observer.observe(content, { childList: true });
    this.observers.set(content, observer);
    this.register(() => {
      observer.disconnect();
    });
  }

  private searchInput(leaf: WorkspaceLeaf): HTMLInputElement | null {
    const root = leaf.view.containerEl;
    return (
      root.querySelector<HTMLInputElement>(".graph-controls .search-input-container input") ??
      root.querySelector<HTMLInputElement>(".search-input-container input") ??
      root.querySelector<HTMLInputElement>("input")
    );
  }

  private setSearch(leaf: WorkspaceLeaf, query: string): void {
    const input = this.searchInput(leaf);
    if (!input) return;
    // Re-dispatching an identical query blanks the graph; skip if unchanged.
    if (shouldSkipSearchUpdate(input.value, query)) return;
    input.value = query;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }
}
