import { App, PluginSettingTab, Setting } from "obsidian";
import type GraphProjectButtonsPlugin from "./main";

export type BarPosition = "left" | "right";

export interface GraphProjectButtonsSettings {
  /** Top-level folder whose subfolders become menu entries. */
  rootFolder: string;
  /** Graph search applied by the curated reset button. */
  curatedQuery: string;
  /** Label shown on the curated reset button. */
  curatedLabel: string;
  /** Show the curated reset button. */
  showCurated: boolean;
  /** Show the "All projects" button. */
  showAllButton: boolean;
  /** Show per-button lucide icons. */
  showIcons: boolean;
  /** Which side of the graph the bar docks to. */
  position: BarPosition;
}

export const DEFAULT_SETTINGS: GraphProjectButtonsSettings = {
  rootFolder: "projects",
  curatedQuery: "-path:projects/",
  curatedLabel: "Curated",
  showCurated: true,
  showAllButton: true,
  showIcons: true,
  position: "left",
};

export class GraphProjectButtonsSettingTab extends PluginSettingTab {
  private readonly plugin: GraphProjectButtonsPlugin;

  constructor(app: App, plugin: GraphProjectButtonsPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Projects root folder")
      .setDesc("Top-level folder whose subfolders become menu entries.")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.rootFolder)
          .onChange(async (value) => {
            this.plugin.settings.rootFolder = (value || "projects").trim();
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Curated query")
      .setDesc("Graph search applied by the curated reset button.")
      .addText((text) =>
        text
          .setPlaceholder("-path:projects/")
          .setValue(this.plugin.settings.curatedQuery)
          .onChange(async (value) => {
            this.plugin.settings.curatedQuery = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Curated button label")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.curatedLabel)
          .onChange(async (value) => {
            this.plugin.settings.curatedLabel = value || "Curated";
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Show curated button")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showCurated).onChange(async (value) => {
          this.plugin.settings.showCurated = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Show all-projects button")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showAllButton).onChange(async (value) => {
          this.plugin.settings.showAllButton = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Show icons")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showIcons).onChange(async (value) => {
          this.plugin.settings.showIcons = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Bar position")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("left", "Top left")
          .addOption("right", "Top right")
          .setValue(this.plugin.settings.position)
          .onChange(async (value) => {
            this.plugin.settings.position = value === "right" ? "right" : "left";
            await this.plugin.saveSettings();
          }),
      );
  }
}
