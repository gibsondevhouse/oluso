import type { AppRoute } from "./route-registry";

export interface RecentNavigationItem {
  path: string;
  title: string;
  summary: string;
  visitedAt: string;
}

const RECENT_NAVIGATION_KEY = "oluso.navigation.recent";
const MAX_RECENT_ITEMS = 8;

function storageAvailable() {
  return typeof localStorage !== "undefined";
}

function parseRecentItems(value: string | null): RecentNavigationItem[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is RecentNavigationItem =>
        Boolean(
          item &&
            typeof item === "object" &&
            "path" in item &&
            typeof item.path === "string" &&
            "title" in item &&
            typeof item.title === "string" &&
            "summary" in item &&
            typeof item.summary === "string" &&
            "visitedAt" in item &&
            typeof item.visitedAt === "string",
        ),
      )
      .slice(0, MAX_RECENT_ITEMS);
  } catch {
    return [];
  }
}

export function readRecentNavigation(): RecentNavigationItem[] {
  if (!storageAvailable()) return [];

  try {
    return parseRecentItems(localStorage.getItem(RECENT_NAVIGATION_KEY));
  } catch {
    return [];
  }
}

export function clearRecentNavigationForTest() {
  if (!storageAvailable()) return;
  localStorage.removeItem(RECENT_NAVIGATION_KEY);
}

export function rememberRecentNavigation(route: AppRoute, now = new Date()) {
  if (!storageAvailable()) return;
  if (route.kind === "home" || route.kind === "global-search" || route.kind === "not-found" || route.kind === "error") {
    return;
  }
  if (route.mode === "new" || route.mode === "edit" || route.mode === "sds-new" || route.mode === "sds-edit") {
    return;
  }

  const nextItem: RecentNavigationItem = {
    path: route.path,
    title: route.recordId ? `${route.title} record` : route.title,
    summary: route.summary,
    visitedAt: now.toISOString(),
  };
  const remainingItems = readRecentNavigation().filter((item) => item.path !== nextItem.path);

  try {
    localStorage.setItem(
      RECENT_NAVIGATION_KEY,
      JSON.stringify([nextItem, ...remainingItems].slice(0, MAX_RECENT_ITEMS)),
    );
  } catch {
    // Recent navigation is a noncritical UI preference.
  }
}
