import { browser } from "$app/environment";
import { writable } from "svelte/store";

export interface RecentRecord {
  path: string;
  title: string;
  context?: string;
  visitedAt: string;
}

const STORAGE_KEY = "oluso.workspace.recent-records.v1";

function initialRecords(): RecentRecord[] {
  if (!browser) return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as RecentRecord[];
  } catch {
    return [];
  }
}

export const recentRecords = writable<RecentRecord[]>(initialRecords());

if (browser) {
  recentRecords.subscribe((records) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
      // Recent navigation is an enhancement and never blocks record work.
    }
  });
}

export function rememberRecentRecord(record: Omit<RecentRecord, "visitedAt">) {
  recentRecords.update((records) => [
    { ...record, visitedAt: new Date().toISOString() },
    ...records.filter((item) => item.path !== record.path),
  ].slice(0, 12));
}
