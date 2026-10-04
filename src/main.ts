import { Menu, Plugin, debounce, setIcon, type WorkspaceLeaf } from "obsidian";
import {
  DEFAULT_SETTINGS,
  GraphProjectButtonsSettingTab,
  type GraphProjectButtonsSettings,
} from "./settings";
import {
  activeLabel,
  computeProjects,
  isActiveQuery,
  projectQuery,
  shouldSkipSearchUpdate,
  type FilterEntry,
} from "./projects";

interface MenuEntry extends FilterEntry {
  icon: string;
}

export default class GraphProjectButtonsPlugin extends Plugin {
  settings!: GraphProjectButtonsSettings;

  private projectCache: string[] | null = null;
  private readonly observers = new Map<HTMLElement, MutationObserver>();

  async onload(): Promise<void> {
    await this.loadSettings();

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

    const button = bar.createEl("button", {
      cls: "gpb-btn gpb-menu",
      attr: { "aria-label": "Graph filter" },
    });
    if (this.settings.showIcons) this.applyIcon(button, "filter");
    const label = button.createSpan();
    this.applyIcon(button, "chevron-down").addClass("gpb-chevron");
    this.updateLabel(leaf, label);

    this.registerDomEvent(button, "click", (event) => {
      event.preventDefault();
      this.openMenu(leaf, event, label);
    });

    this.observe(leaf, content);
  }

  private applyIcon(el: HTMLElement, name: string): HTMLElement {
    const span = el.createSpan({ cls: "gpb-icon" });
    setIcon(span, name);
    return span;
  }

  // Fixed entries (curated, all projects) and one entry per project folder.
  private menuEntries(): { fixed: MenuEntry[]; projects: MenuEntry[] } {
    const root = this.settings.rootFolder;
    const fixed: MenuEntry[] = [];
    if (this.settings.showCurated) {
      fixed.push({
        title: this.settings.curatedLabel,
        query: this.settings.curatedQuery,
        icon: "sparkles",
      });
    }
    if (this.settings.showAllButton) {
      fixed.push({ title: "All projects", query: projectQuery(root), icon: "layers" });
    }
    const projects = this.getProjects().map((name) => ({
      title: name,
      query: projectQuery(root, name),
      icon: "folder",
    }));
    return { fixed, projects };
  }

  private updateLabel(leaf: WorkspaceLeaf, label: HTMLElement): void {
    const { fixed, projects } = this.menuEntries();
    const current = this.searchInput(leaf)?.value ?? "";
    label.setText(activeLabel([...fixed, ...projects], current));
  }

  private openMenu(leaf: WorkspaceLeaf, event: MouseEvent, label: HTMLElement): void {
    const { fixed, projects } = this.menuEntries();
    const current = this.searchInput(leaf)?.value ?? "";
    const menu = new Menu();
    const add = (entry: MenuEntry): void => {
      menu.addItem((item) => {
        item.setTitle(entry.title);
        if (this.settings.showIcons) item.setIcon(entry.icon);
        if (isActiveQuery(current, entry.query)) item.setChecked(true);
        item.onClick(() => {
          this.setSearch(leaf, entry.query);
          this.updateLabel(leaf, label);
        });
      });
    };
    fixed.forEach(add);
    if (fixed.length > 0 && projects.length > 0) menu.addSeparator();
    projects.forEach(add);
    menu.showAtMouseEvent(event);
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
