# AGENTS.md

Onboarding for an AI agent (or human) working **on the
graph-project-buttons repository**.

## Purpose

Graph Project Buttons injects a per-project filter bar into the Obsidian graph
view. This repo is the publishable TypeScript + esbuild source for that plugin;
the shipped artifacts are `main.js` (bundled), `manifest.json`, and
`styles.css`.

## Structure map

```
src/
  main.ts        the Plugin class — bar injection, MutationObserver re-inject,
                 graph search dispatch, event wiring, cleanup
  settings.ts    settings interface, DEFAULT_SETTINGS, and the settings tab
  projects.ts    pure, Obsidian-free helpers (the testable logic)
styles.css       the bar/button styles (shipped as-is)
manifest.json    plugin manifest (id graph-project-buttons, version, minAppVersion)
versions.json    plugin-version -> minAppVersion map
tests/           node:test suites for the pure helpers (run via tsx)
docs/            architecture.md, publishing.md
esbuild.config.mjs   bundler config (entry src/main.ts -> main.js)
version-bump.mjs     syncs manifest.json + versions.json from npm_package_version
eslint.config.mjs    eslint-plugin-obsidianmd + typescript-eslint (flat config)
```

## Where the logic lives

`src/projects.ts` holds the **pure, testable** logic — computing the project
list from vault file paths, building `path:` queries, and the no-op guard that
prevents re-dispatching the graph's current query (which blanks the graph). It
imports nothing from `obsidian`, so `npm test` runs it under plain Node. Keep
new pure logic there; keep DOM/Obsidian coupling in `main.ts`.

## Commands

```bash
npm install      # dev deps only — zero runtime dependencies
npm run build    # tsc --noEmit type-check + esbuild production bundle
npm test         # node:test unit tests (tsx loader)
npm run lint     # eslint (Obsidian developer-guideline rules)
npm run dev      # esbuild watch
```

## Invariants (keep green)

1. `npm run build` produces `main.js` with no TypeScript/esbuild errors.
2. `npm test` passes.
3. `npm run lint` is clean.
4. The bundled `main.js` contains **no `setInterval(`** — re-injection uses a
   `MutationObserver`. Obsidian reviewers reject polling.
5. No `innerHTML`; build DOM via `createDiv`/`createEl`/`createSpan`.
6. Clean up on unload: disconnect observers and remove every `.gpb-bar`. Prefer
   `this.register*` for teardown.

## Behavioral guardrails

- **The no-op search guard is load-bearing.** `setSearch` must skip when the
  input already equals the target query (`shouldSkipSearchUpdate`). Re-dispatching
  an identical query blanks the graph — a real bug that was fixed.
- The project list is cached and only invalidated (debounced) on vault
  create/delete/rename.

## Publishing rules baked in

- Plugin `id` must not contain "obsidian" (`graph-project-buttons` — OK).
- `manifest.json` `description` <= 250 chars, ends with ".", no emoji, and avoids
  the word "Obsidian".
- Release git tag equals `manifest.json` `version` exactly, **no `v` prefix**
  (`.npmrc` sets `tag-version-prefix=""`).
- Release assets: `main.js`, `manifest.json`, `styles.css`.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the PR workflow,
[docs/architecture.md](docs/architecture.md) for the design, and
[docs/publishing.md](docs/publishing.md) for submission steps.
