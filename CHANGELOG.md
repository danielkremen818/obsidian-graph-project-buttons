# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-10-04

### Changed
- The row of filter buttons is collapsed into one compact button, labelled with
  the active filter, that opens a native Obsidian menu of the same entries.
  A long label truncates with an ellipsis instead of overflowing a narrow pane.

### Fixed
- Files directly under the root folder no longer appear as projects; only real
  subfolders do. Dot-folders (such as `.claude`) are skipped.

### Removed
- The chevron collapse toggle and the `startCollapsed` setting.

## [1.1.2] - 2026-06-14

### Added
- A GitHub Sponsors funding link, surfaced through the plugin manifest
  (`fundingUrl`) and a short Support section in the README.

### Changed
- Upgraded the CI and release GitHub Actions to the Node 24 runtime
  (`actions/checkout@v5`, `actions/setup-node@v5`), clearing the upcoming
  forced-Node-24 deprecation for JavaScript actions.

## [1.1.1] - 2026-06-14

### Changed
- Dropped the `builtin-modules` dev dependency in favour of Node's own
  `module.builtinModules`, so the esbuild config keeps both bare and
  `node:`-prefixed builtins external without a third-party package.
- Release builds now attach build-provenance attestations, and the release
  notes are pulled straight from this changelog instead of being left blank.

### Added
- A short Privacy section in the README spelling out that the plugin only reads
  the vault's file list (paths) to find project folders — never file contents,
  no network, nothing written outside its own settings.

## [1.1.0] - 2026-06-14

First public release, ported from the directly-installed plain-JavaScript
plugin to a TypeScript + esbuild repository.

### Added
- Per-subfolder project filter buttons in the graph view, auto-discovered from
  a configurable root folder (default `projects`).
- **Curated** reset button (default query `-path:projects/`) and an
  **All projects** button.
- Active-button highlighting based on the graph's current search.
- Collapsible bar with a chevron toggle, per-button lucide icons, and a
  left/right dock position.
- `MutationObserver`-based re-injection when the graph re-renders (no polling).
- Project-list cache, invalidated on vault create/delete/rename.
- Full settings tab (root folder, curated query/label, button toggles, icons,
  position, start-collapsed) persisted via `loadData`/`saveData`.

[Unreleased]: https://github.com/danielkremen818/obsidian-graph-project-buttons/compare/1.2.0...HEAD
[1.2.0]: https://github.com/danielkremen818/obsidian-graph-project-buttons/compare/1.1.2...1.2.0
[1.1.2]: https://github.com/danielkremen818/obsidian-graph-project-buttons/compare/1.1.1...1.1.2
[1.1.1]: https://github.com/danielkremen818/obsidian-graph-project-buttons/compare/1.1.0...1.1.1
[1.1.0]: https://github.com/danielkremen818/obsidian-graph-project-buttons/releases/tag/1.1.0
