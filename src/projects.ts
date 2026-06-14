/**
 * Pure, Obsidian-independent helpers.
 *
 * These hold the testable logic that used to live inline in the plugin class:
 * computing the project list from vault file paths, building graph-search
 * queries, and the no-op guard that decides whether a search update should be
 * skipped. Keeping them free of any `obsidian` import lets `npm test` exercise
 * them under plain Node, with no running Obsidian.
 */

/** Strip any trailing slashes from a folder path (`"projects/"` -> `"projects"`). */
export function normalizeRoot(rootFolder: string): string {
  return rootFolder.replace(/\/+$/, "");
}

/**
 * Derive the sorted, de-duplicated list of immediate subfolders of `rootFolder`
 * from a flat list of vault file paths.
 *
 * Behaviour is preserved exactly from the original plugin: a path counts when
 * its first segment equals the (normalized) root and it has at least a second
 * segment, and the *second* segment is taken as the project name. A file that
 * sits directly inside the root therefore contributes its filename — an
 * intentional quirk kept for backwards compatibility.
 */
export function computeProjects(filePaths: string[], rootFolder: string): string[] {
  const root = normalizeRoot(rootFolder);
  const set = new Set<string>();
  for (const filePath of filePaths) {
    const parts = filePath.split("/");
    if (parts[0] === root && parts.length > 1) set.add(parts[1]);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/**
 * Build the graph-search query for a project button. With no `project` it is the
 * "All projects" query (`path:<root>/`); with one it scopes to that subfolder.
 */
export function projectQuery(rootFolder: string, project?: string): string {
  const root = normalizeRoot(rootFolder);
  return project ? `path:${root}/${project}/` : `path:${root}/`;
}

/**
 * The critical no-op guard: re-dispatching the graph's current query blanks the
 * graph, so a search update must be skipped when the trimmed current value
 * already equals the target query.
 */
export function shouldSkipSearchUpdate(currentValue: string, query: string): boolean {
  return currentValue.trim() === query;
}

/** Whether a button whose query is `query` should be highlighted as active. */
export function isActiveQuery(currentValue: string, query: string): boolean {
  return currentValue.trim() === query;
}
