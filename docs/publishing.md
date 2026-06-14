# Publishing

How to ship Graph Project Buttons and submit it to the Obsidian community plugin
directory. The repository is built local-first; the steps below create the
remote and the release.

> Verify the directory requirements against the current
> [Obsidian developer docs](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin)
> before submitting — they change over time.

## Pre-publish checklist

- [ ] `manifest.json` — `id` is `graph-project-buttons` (must **not** contain
      "obsidian"); `version` and `minAppVersion` are correct; `description`
      is ≤ 250 chars, ends with ".", has no emoji, and does **not** contain the
      word "Obsidian".
- [ ] `versions.json` maps the plugin version to its `minAppVersion`
      (`{ "1.1.0": "1.4.0" }`).
- [ ] `npm run build` is clean and `main.js` is freshly built from `src/`.
- [ ] `npm test` and `npm run lint` pass.
- [ ] `CHANGELOG.md` has an entry for the release version.
- [ ] The GitHub handle (`danielkremen818`) is correct in `package.json`,
      `manifest.json` `authorUrl`, and the README links.
- [ ] A real screenshot exists at `docs/screenshot.png` (referenced by the
      README).

## 1. Create the GitHub repo and push (local → remote)

```bash
# from the repo root
gh repo create danielkremen818/obsidian-graph-project-buttons \
  --public --source=. --remote=origin --push
```

Set the repo **About** description and topics (e.g.
`obsidian, obsidian-plugin, graph, graph-view, projects`) so it indexes well.

## 2. Tag the release (tag = version, NO "v" prefix)

The Obsidian directory requires the git tag to equal `manifest.json` `version`
**exactly**, with no leading `v`. `.npmrc` already sets `tag-version-prefix=""`,
so `npm version` produces a bare tag.

```bash
git tag 1.1.0
git push origin 1.1.0
```

Pushing the tag triggers `.github/workflows/release.yml`, which runs
`npm ci && npm run build` and creates a **draft** GitHub Release with `main.js`,
`manifest.json`, and `styles.css` attached. Review the draft and publish it.

> If you prefer to do it by hand: create a release named exactly `1.1.0` and
> upload `main.js`, `manifest.json`, and `styles.css` as individual assets (do
> not zip them).

## 3. Submit to the community directory

First-time submissions add an entry to the
[`obsidianmd/obsidian-releases`](https://github.com/obsidianmd/obsidian-releases)
repository:

1. Fork `obsidianmd/obsidian-releases`.
2. Add an entry to `community-plugins.json`:

   ```json
   {
     "id": "graph-project-buttons",
     "name": "Graph Project Buttons",
     "author": "Daniel Kremen",
     "description": "Adds one-click project filter buttons to the graph view so you never type path queries by hand.",
     "repo": "danielkremen818/obsidian-graph-project-buttons"
   }
   ```

3. Open a PR. An automated bot validates the manifest, the release assets, and
   the guidelines; a maintainer reviews afterward.
4. Address any bot/reviewer feedback. Once merged, the plugin appears in
   **Settings → Community plugins → Browse**.

## Updates after the first release

For later versions you only bump and tag — no second `obsidian-releases` PR:

```bash
npm version <patch|minor|major>   # bumps package.json, runs version-bump.mjs,
                                  # stages manifest.json + versions.json
git commit -am "Release x.y.z"    # if npm version didn't commit for you
git tag x.y.z && git push origin main --tags
```

Obsidian picks up the new version from the tagged release and its
`manifest.json`/`versions.json`.
