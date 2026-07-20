<script lang="ts">
  import type { Snippet } from "svelte";
  import { tick } from "svelte";
  import { Search } from "lucide-svelte";
  import { persistenceDiagnostics } from "$lib/persistence/local-persistence";
  import CommandPalette from "$lib/components/navigation/CommandPalette.svelte";
  import SaveState, { type SaveStateKind } from "$lib/components/feedback/SaveState.svelte";
  import ScopeBar from "$lib/components/workspace/ScopeBar.svelte";
  import { iconMap } from "./SidePanel/icons";
  import SidePanel from "./SidePanel/SidePanel.svelte";

  interface Props {
    currentPath: string;
    children?: Snippet;
  }

  let { currentPath, children }: Props = $props();
  let collapsed = $state(false);
  let statusMessage = $state("Navigation expanded");
  let commandPaletteOpen = $state(false);

  const ToggleIcon = $derived(collapsed ? iconMap.PanelLeftOpen : iconMap.PanelLeftClose);
  const toggleLabel = $derived(collapsed ? "Expand navigation" : "Collapse navigation");
  const saveState = $derived(({
    not_configured: "offline",
    loading: "saving",
    ready: "saved",
    error: "error",
  } satisfies Record<string, SaveStateKind>)[$persistenceDiagnostics.status]);

  async function toggleNavigation() {
    collapsed = !collapsed;
    statusMessage = collapsed ? "Navigation collapsed" : "Navigation expanded";
    await tick();
  }

  function handleKeydown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      commandPaletteOpen = !commandPaletteOpen;
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key === "\\") {
      event.preventDefault();
      toggleNavigation();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="app-shell" class:collapsed>
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <SidePanel {currentPath} {collapsed} />

  <div class="workspace-frame">
    <header class="workspace-header">
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
      <button class="command-button" type="button" onclick={() => (commandPaletteOpen = true)} aria-label="Open command palette"><Search size={16} /><span>Search or jump to…</span><kbd>⌘ K</kbd></button>
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

<CommandPalette open={commandPaletteOpen} onClose={() => (commandPaletteOpen = false)} />

<style>
  .app-shell {
    display: flex;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: var(--app-background);
    color: var(--color-text);
  }

  .workspace-frame {
    display: flex;
    flex: 1;
    min-width: 0;
    height: 100vh;
    flex-direction: column;
    overflow: hidden;
    background: var(--app-background);
  }

  .workspace-header {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: var(--header-height);
    padding: 0 20px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface);
  }

  .icon-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
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
    flex: 1;
    flex-direction: column;
    gap: 1px;
  }

  .workspace-kicker {
    color: var(--color-action);
    font-size: 0.6875rem;
    font-weight: 760;
    letter-spacing: 0;
    line-height: 1.2;
    text-transform: uppercase;
  }

  .workspace-name {
    color: var(--color-text);
    font-size: 0.9375rem;
    font-weight: 720;
    line-height: 1.2;
  }

  .command-button { display: flex; align-items: center; gap: 8px; width: min(270px, 26vw); min-height: 34px; border: 1px solid var(--color-border); border-radius: var(--radius-control); background: var(--color-surface-subtle); color: var(--color-muted); font-size: .75rem; padding: 0 8px; text-align: left; }
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
