<script lang="ts">
  import type { Snippet } from "svelte";
  import { tick } from "svelte";
  import { persistenceDiagnostics } from "$lib/persistence/local-persistence";
  import CommandPalette from "$lib/components/navigation/CommandPalette.svelte";
  import SaveState, { type SaveStateKind } from "$lib/components/feedback/SaveState.svelte";
  import ScopeBar from "$lib/components/workspace/ScopeBar.svelte";
  import { findRoute } from "$lib/navigation/route-registry";
  import { rememberRecentNavigation } from "$lib/navigation/recent-navigation";
  import { iconMap } from "./SidePanel/icons";
  import SidePanel from "./SidePanel/SidePanel.svelte";

  interface Props {
    currentPath: string;
    children?: Snippet;
  }

  const NAV_COLLAPSED_KEY = "oluso.navigation.collapsed";

  let { currentPath, children }: Props = $props();
  let collapsed = $state(readNavigationCollapsedPreference());
  let commandPaletteOpen = $state(false);
  let commandButton = $state<HTMLButtonElement | null>(null);
  let statusMessage = $state("Navigation expanded");

  const ToggleIcon = $derived(collapsed ? iconMap.PanelLeftOpen : iconMap.PanelLeftClose);
  const SearchIcon = iconMap.Search;
  const toggleLabel = $derived(collapsed ? "Expand navigation" : "Collapse navigation");
  const saveState = $derived(({
    not_configured: "offline",
    loading: "saving",
    ready: "saved",
    error: "error",
  } satisfies Record<string, SaveStateKind>)[$persistenceDiagnostics.status]);

  async function toggleNavigation() {
    collapsed = !collapsed;
    writeNavigationCollapsedPreference(collapsed);
    statusMessage = collapsed ? "Navigation collapsed" : "Navigation expanded";
    await tick();
  }

  function readNavigationCollapsedPreference() {
    if (typeof localStorage === "undefined") return false;

    try {
      return localStorage.getItem(NAV_COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  }

  function writeNavigationCollapsedPreference(value: boolean) {
    if (typeof localStorage === "undefined") return;

    try {
      localStorage.setItem(NAV_COLLAPSED_KEY, String(value));
    } catch {
      // Navigation collapse is a noncritical UI preference.
    }
  }

  function isEditableTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false;

    return Boolean(
      target.closest("input, textarea, select, [contenteditable='true'], [contenteditable='']"),
    );
  }

  function openCommandPalette() {
    commandPaletteOpen = true;
    statusMessage = "Command palette opened";
  }

  function closeCommandPalette() {
    commandPaletteOpen = false;
    statusMessage = "Command palette closed";
    void tick().then(() => commandButton?.focus());
  }

  function handleKeydown(event: KeyboardEvent) {
    const key = event.key.toLowerCase();

    if ((event.ctrlKey || event.metaKey) && key === "k") {
      event.preventDefault();
      if (commandPaletteOpen) {
        closeCommandPalette();
      } else {
        openCommandPalette();
      }
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key === "\\") {
      event.preventDefault();
      void toggleNavigation();
      return;
    }

    if (
      event.key === "/" &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      !isEditableTarget(event.target)
    ) {
      event.preventDefault();
      openCommandPalette();
    }
  }

  $effect(() => {
    const route = findRoute(currentPath);
    if (route) {
      rememberRecentNavigation(route);
    }
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="app-shell" class:collapsed>
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <SidePanel {currentPath} {collapsed} />

  <div class="workspace-frame">
    <header class="workspace-header corporate-glass-surface backdrop-blur-corporate">
      <button
        type="button"
        class="icon-button"
        onclick={toggleNavigation}
        aria-label={toggleLabel}
        title={toggleLabel}
      >
        <ToggleIcon size={18} />
      </button>
      <div class="workspace-title">
        <span class="workspace-kicker">ADAMA HSE</span>
        <span class="workspace-name">Operational workspace</span>
      </div>
      <button
        bind:this={commandButton}
        type="button"
        class="command-button"
        onclick={openCommandPalette}
        aria-label="Open command palette"
        title="Open command palette"
      >
        <SearchIcon size={16} aria-hidden="true" />
        <span>Search or jump to…</span>
        <kbd aria-hidden="true">⌘ K</kbd>
      </button>
      <div aria-label="Save status"><SaveState state={saveState} /></div>
    </header>

    <ScopeBar />

    <main class="workspace-main" id="main-content" tabindex="-1">
      {#if children}
        {@render children()}
      {/if}
    </main>

    <span class="visually-hidden" role="status" aria-live="polite">{statusMessage}</span>
  </div>
</div>

<CommandPalette open={commandPaletteOpen} onClose={closeCommandPalette} />

<style>
  .app-shell {
    display: flex;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background:
      radial-gradient(circle at 92% 0%, rgba(0, 152, 69, 0.08), transparent 32rem),
      var(--app-background);
    color: var(--color-text);
  }

  .workspace-frame {
    display: flex;
    flex: 1;
    min-width: 0;
    height: 100vh;
    flex-direction: column;
    overflow: hidden;
    background: transparent;
  }

  .workspace-header {
    position: relative;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: var(--header-height);
    padding: 0 18px;
    border-bottom: 1px solid rgba(174, 185, 178, 0.56);
  }

  .icon-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-control);
    background: var(--color-surface);
    color: var(--color-text);
    cursor: pointer;
  }

  .icon-button:hover {
    border-color: var(--color-action);
    background: var(--color-surface-subtle);
  }

  .icon-button:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .workspace-title {
    display: flex;
    min-width: 0;
    flex: 0 0 190px;
    flex-direction: column;
    gap: 1px;
  }

  .workspace-kicker {
    color: var(--color-action);
    font-size: 0.6875rem;
    font-weight: 760;
    letter-spacing: 0.055em;
    line-height: 1.2;
    text-transform: uppercase;
  }

  .workspace-name {
    color: var(--color-text);
    font-size: 0.9375rem;
    font-weight: 720;
    line-height: 1.2;
  }

  .command-button { display: inline-flex; align-items: center; gap: 8px; width: min(360px, 34vw); min-height: 36px; margin-left: auto; border: 1px solid var(--color-border); border-radius: var(--radius-control); background: var(--color-surface-inset); color: var(--color-muted); cursor: pointer; font-size: .75rem; font-weight: 700; padding: 0 9px; text-align: left; }
  .command-button:hover { border-color: var(--color-border-strong); color: var(--color-text); }
  .command-button:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
  .command-button span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .command-button kbd { border: 1px solid var(--color-border); border-radius: 4px; background: var(--color-surface); color: var(--color-muted); padding: 1px 5px; }

  .workspace-main {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .workspace-main:focus {
    outline: none;
  }

  .skip-link { position: fixed; z-index: 110; top: 8px; left: 8px; transform: translateY(-150%); border-radius: var(--radius-control); background: var(--color-action); color: white; padding: 8px 12px; }
  .skip-link:focus { transform: translateY(0); }
  .visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

  @media (max-width: 800px) {
    .command-button { width: 38px; justify-content: center; } .command-button span, .command-button kbd { display: none; }
  }

  @media (max-width: 640px) {
    .workspace-header { padding-inline: 12px; }
    .workspace-kicker { display: none; }
  }
</style>
