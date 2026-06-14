# Contributing to Graph Project Buttons

Thanks for your interest. This plugin is small, has zero runtime dependencies,
and is scoped to one job: project filter buttons in the Obsidian graph view.
Contributions that keep it focused are very welcome.

## Prerequisites

- **Node.js ≥ 20** (CI runs the matrix on 20, 22, and 24).
- `npm install` installs dev dependencies only — there are **no runtime
  dependencies**, and that is a hard constraint.

## Project layout

```
src/main.ts       Plugin class: injection, MutationObserver, search dispatch
src/settings.ts   settings interface + settings tab
src/projects.ts   pure, Obsidian-free helpers (unit-tested)
tests/            node:test suites for the pure helpers
docs/             architecture + publishing notes
```

The shipped `main.js` is **generated** by esbuild — never edit it by hand. Edit
`src/` and rebuild.

## Development workflow

```bash
npm install
npm run dev      # esbuild watch -> main.js
npm run build    # type-check + production bundle
npm test         # unit tests
npm run lint     # eslint-plugin-obsidianmd + typescript-eslint
```

To test in a real vault, copy or symlink the repo into
`<vault>/.obsidian/plugins/graph-project-buttons/` and run `npm run dev`.

### The green-bar invariant

Every change must keep **all** of these green (CI enforces them):

1. `npm run build` succeeds.
2. `npm test` passes.
3. `npm run lint` is clean.

And the plugin invariants in [AGENTS.md](AGENTS.md) must hold — in particular:
no `setInterval` (use the `MutationObserver`), no `innerHTML`, and full cleanup
on unload.

## Where to put logic

Pure, testable logic goes in `src/projects.ts` with a matching test in
`tests/`. DOM and Obsidian-API coupling stays in `src/main.ts`. If you add new
testable behavior, factor it into `projects.ts` so `npm test` can cover it
without a running Obsidian.

## Pull requests

- Fork and open a PR against `main`. PRs from forks are welcome.
- Only the maintainer (**@danielkremen818**) merges to `main`.
- Keep the PR focused; update `CHANGELOG.md` (`## [Unreleased]`) and any docs
  your change affects.
- Make sure the green-bar invariant holds before requesting review.
