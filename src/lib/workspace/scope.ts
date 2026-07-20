import { browser } from "$app/environment";
import { derived, get, writable } from "svelte/store";

export interface WorkspaceScope {
  organizationId?: string;
  countryId?: string;
  siteId?: string;
  locationId?: string;
  operationalFunctionId?: string;
}

export interface WorkspaceScopeLabels {
  organization?: string;
  country?: string;
  site?: string;
  location?: string;
  operationalFunction?: string;
}

export interface PinnedScope {
  id: string;
  label: string;
  scope: WorkspaceScope;
}

const SCOPE_STORAGE_KEY = "oluso.workspace.scope.v1";
const PINNED_SCOPE_STORAGE_KEY = "oluso.workspace.pinned-scopes.v1";

function readStored<T>(key: string, fallback: T): T {
  if (!browser) return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function persistedWritable<T>(key: string, fallback: T) {
  const store = writable<T>(readStored(key, fallback));
  if (browser) {
    store.subscribe((value) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Scope remains usable for the session when storage is unavailable.
      }
    });
  }
  return store;
}

export const workspaceScope = persistedWritable<WorkspaceScope>(SCOPE_STORAGE_KEY, {});
export const workspaceScopeLabels = writable<WorkspaceScopeLabels>({});
export const pinnedScopes = persistedWritable<PinnedScope[]>(PINNED_SCOPE_STORAGE_KEY, []);

export const hasWorkspaceScope = derived(workspaceScope, (scope) => Object.values(scope).some(Boolean));

export function setWorkspaceScope(next: WorkspaceScope) {
  workspaceScope.set(compactScope(next));
}

export function updateWorkspaceScope(partial: Partial<WorkspaceScope>) {
  workspaceScope.update((current) => compactScope({ ...current, ...partial }));
}

export function clearWorkspaceScope() {
  workspaceScope.set({});
  workspaceScopeLabels.set({});
}

export function pinCurrentScope(label: string) {
  const scope = compactScope(get(workspaceScope));
  if (!Object.values(scope).some(Boolean)) return;
  const id = scopeKey(scope);
  pinnedScopes.update((items) => [
    { id, label, scope },
    ...items.filter((item) => item.id !== id),
  ].slice(0, 8));
}

export function unpinScope(id: string) {
  pinnedScopes.update((items) => items.filter((item) => item.id !== id));
}

export function scopeKey(scope: WorkspaceScope) {
  return [
    scope.organizationId,
    scope.countryId,
    scope.siteId,
    scope.locationId,
    scope.operationalFunctionId,
  ].map((value) => value ?? "*").join(":");
}

function compactScope(scope: WorkspaceScope): WorkspaceScope {
  return Object.fromEntries(
    Object.entries(scope).filter(([, value]) => Boolean(value)),
  ) as WorkspaceScope;
}
