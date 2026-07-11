<script lang="ts">
  import type { Snippet } from "svelte";
  import { tick } from "svelte";
  import {
    getPersistenceStatusLabel,
    persistenceDiagnostics,
  } from "$lib/persistence/local-persistence";
  import { iconMap } from "./SidePanel/icons";
  import SidePanel from "./SidePanel/SidePanel.svelte";

  interface Props {
    currentPath: string;
    children?: Snippet;
  }

  let { currentPath, children }: Props = $props();
  let collapsed = $state(false);
  let statusMessage = $state("Navigation expanded");

  const ToggleIcon = $derived(collapsed ? iconMap.PanelLeftOpen : iconMap.PanelLeftClose);
  const toggleLabel = $derived(collapsed ? "Expand navigation" : "Collapse navigation");
  const persistenceStatusLabel = $derived(getPersistenceStatusLabel($persistenceDiagnostics.status));

  async function toggleNavigation() {
    collapsed = !collapsed;
    statusMessage = collapsed ? "Navigation collapsed" : "Navigation expanded";
    await tick();
  }

  function handleKeydown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === "\\") {
      event.preventDefault();
      toggleNavigation();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="app-shell" class:collapsed>
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
        <span class="workspace-kicker">OLUSO</span>
        <span class="workspace-name">Desktop Workspace</span>
      </div>
      <div
        class="workspace-status"
        class:status-ready={$persistenceDiagnostics.status === "ready"}
        class:status-error={$persistenceDiagnostics.status === "error"}
        class:status-loading={$persistenceDiagnostics.status === "loading"}
        aria-label="Persistence status"
      >
        {persistenceStatusLabel}
      </div>
    </header>

    <main class="workspace-main" id="main-content" tabindex="-1">
      {#if children}
        {@render children()}
      {/if}
    </main>

    <div class="workspace-status-strip" role="status" aria-live="polite">
      <span>{statusMessage}</span>
      <span>
        {#if $persistenceDiagnostics.dataPath}
          {$persistenceDiagnostics.dataPath}
        {:else}
          No persistence data path
        {/if}
      </span>
    </div>
  </div>
</div>

<style>
  .app-shell {
    display: flex;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: var(--color-bg);
    color: var(--color-text);
  }

  .workspace-frame {
    display: flex;
    flex: 1;
    min-width: 0;
    height: 100vh;
    flex-direction: column;
    overflow: hidden;
    background: var(--color-bg);
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
    border: 1px solid var(--color-border-strong);
    border-radius: 6px;
    background: var(--color-surface);
    color: var(--color-text);
    cursor: pointer;
  }

  .icon-button:hover {
    background: var(--color-hover);
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
    color: var(--color-muted);
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0;
    line-height: 1.2;
    text-transform: uppercase;
  }

  .workspace-name {
    color: var(--color-text);
    font-size: 0.9375rem;
    font-weight: 650;
    line-height: 1.2;
  }

  .workspace-status {
    border: 1px solid var(--color-border);
    border-radius: 999px;
    color: var(--color-muted);
    font-size: 0.75rem;
    line-height: 1;
    padding: 6px 10px;
    white-space: nowrap;
  }

  .workspace-status.status-loading {
    border-color: var(--color-warning-border);
    background: var(--color-warning-soft);
    color: var(--color-warning-text);
  }

  .workspace-status.status-ready {
    border-color: var(--color-success-border);
    background: var(--color-success-soft);
    color: var(--color-success-text);
  }

  .workspace-status.status-error {
    border-color: var(--color-danger-border);
    background: var(--color-danger-soft);
    color: var(--color-danger);
  }

  .workspace-main {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .workspace-main:focus {
    outline: none;
  }

  .workspace-status-strip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 28px;
    border-top: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-muted);
    font-size: 0.75rem;
    line-height: 1;
    padding: 0 20px;
  }

  @media (max-width: 800px) {
    .workspace-status {
      display: none;
    }
  }
</style>
