# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/danielkremen818/obsidian-graph-project-buttons/compare/1.1.0...HEAD
[1.1.0]: https://github.com/danielkremen818/obsidian-graph-project-buttons/releases/tag/1.1.0
