// Pure helpers with no `obsidian` import, so they run under plain Node in tests.

/** Strip trailing slashes from a folder path (`"projects/"` -> `"projects"`). */
export function normalizeRoot(rootFolder: string): string {
  return rootFolder.replace(/\/+$/, "");
}

/**
 * Sorted, de-duplicated list of immediate subfolders of `rootFolder`, taken
 * from a flat list of vault file paths. A path matches when its first segment
 * is the root and it has at least three segments (`root/<folder>/<file>`); the
 * second segment is the project name. Files directly under the root and
 * dot-folders (`.claude`) are skipped.
 */
export function computeProjects(filePaths: string[], rootFolder: string): string[] {
  const root = normalizeRoot(rootFolder);
  const set = new Set<string>();
  for (const filePath of filePaths) {
    const parts = filePath.split("/");
    if (parts[0] !== root || parts.length < 3) continue;
    if (parts[1].startsWith(".")) continue;
    set.add(parts[1]);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/**
 * Graph-search query for a project button. With no `project` it is the
 * "All projects" query (`path:<root>/`); with one it scopes to that subfolder.
 */
export function projectQuery(rootFolder: string, project?: string): string {
  const root = normalizeRoot(rootFolder);
  return project ? `path:${root}/${project}/` : `path:${root}/`;
}

// Re-dispatching the graph's current query blanks the graph, so skip the update
// when the trimmed current value already equals the target query.
export function shouldSkipSearchUpdate(currentValue: string, query: string): boolean {
  return currentValue.trim() === query;
}

/** Whether a button whose query is `query` should be highlighted as active. */
export function isActiveQuery(currentValue: string, query: string): boolean {
  return currentValue.trim() === query;
}

/** A filter entry in the graph menu: its visible title and the query it sets. */
export interface FilterEntry {
  title: string;
  query: string;
}

/** Menu-button label: the title of the entry matching the current search, else `Filter`. */
export function activeLabel(entries: FilterEntry[], currentValue: string): string {
  for (const entry of entries) {
    if (isActiveQuery(currentValue, entry.query)) return entry.title;
  }
  return "Filter";
}
