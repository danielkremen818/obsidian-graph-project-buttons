import { test } from "node:test";
import assert from "node:assert/strict";
import {
  activeLabel,
  computeProjects,
  isActiveQuery,
  normalizeRoot,
  projectQuery,
  shouldSkipSearchUpdate,
} from "../src/projects.ts";

const FILES = [
  "projects/alpha/note.md",
  "projects/alpha/sub/deep.md",
  "projects/beta/index.md",
  "projects/gamma/a.md",
  "inbox/scratch.md",
  "notes/top.md",
];

test("computeProjects returns sorted, de-duplicated subfolders of the root", () => {
  assert.deepEqual(computeProjects(FILES, "projects"), ["alpha", "beta", "gamma"]);
});

test("computeProjects ignores files outside the root", () => {
  const out = computeProjects(["inbox/x.md", "notes/y.md"], "projects");
  assert.deepEqual(out, []);
});

test("computeProjects normalizes a trailing slash on the root", () => {
  assert.deepEqual(computeProjects(FILES, "projects/"), ["alpha", "beta", "gamma"]);
});

test("computeProjects sorts with locale comparison", () => {
  const files = ["projects/Zeta/a.md", "projects/alpha/a.md", "projects/Beta/a.md"];
  assert.deepEqual(computeProjects(files, "projects"), ["alpha", "Beta", "Zeta"]);
});

test("computeProjects ignores files directly in the root", () => {
  // parts = ["projects", "readme.md"] -> no subfolder, so no project.
  assert.deepEqual(computeProjects(["projects/readme.md"], "projects"), []);
});

test("computeProjects skips dot-folders under the root", () => {
  assert.deepEqual(computeProjects(["projects/.claude/x.md"], "projects"), []);
});

test("computeProjects with a different root only matches that root", () => {
  const files = ["work/one/a.md", "work/two/b.md", "projects/skip/c.md"];
  assert.deepEqual(computeProjects(files, "work"), ["one", "two"]);
});

test("normalizeRoot strips trailing slashes", () => {
  assert.equal(normalizeRoot("projects/"), "projects");
  assert.equal(normalizeRoot("a/b///"), "a/b");
  assert.equal(normalizeRoot("projects"), "projects");
});

test("projectQuery builds the All-projects query with no project", () => {
  assert.equal(projectQuery("projects"), "path:projects/");
  assert.equal(projectQuery("projects/"), "path:projects/");
});

test("projectQuery builds a scoped query for a project", () => {
  assert.equal(projectQuery("projects", "alpha"), "path:projects/alpha/");
  assert.equal(projectQuery("work/", "team"), "path:work/team/");
});

test("shouldSkipSearchUpdate is true only when the trimmed current value equals the query", () => {
  assert.equal(shouldSkipSearchUpdate("path:projects/", "path:projects/"), true);
  assert.equal(shouldSkipSearchUpdate("  path:projects/  ", "path:projects/"), true);
  assert.equal(shouldSkipSearchUpdate("path:projects/alpha/", "path:projects/"), false);
  assert.equal(shouldSkipSearchUpdate("", "path:projects/"), false);
});

test("isActiveQuery mirrors the skip logic", () => {
  assert.equal(isActiveQuery(" path:projects/alpha/ ", "path:projects/alpha/"), true);
  assert.equal(isActiveQuery("path:projects/", "path:projects/alpha/"), false);
});

test("activeLabel returns the title of the entry matching the trimmed search", () => {
  const entries = [
    { title: "Curated", query: "-path:projects/" },
    { title: "All projects", query: "path:projects/" },
    { title: "alpha", query: "path:projects/alpha/" },
  ];
  assert.equal(activeLabel(entries, " path:projects/alpha/ "), "alpha");
  assert.equal(activeLabel(entries, "-path:projects/"), "Curated");
});

test("activeLabel falls back to Filter when no entry matches", () => {
  const entries = [{ title: "alpha", query: "path:projects/alpha/" }];
  assert.equal(activeLabel(entries, "tag:#todo"), "Filter");
  assert.equal(activeLabel([], ""), "Filter");
});
