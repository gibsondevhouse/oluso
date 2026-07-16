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
        <span class="workspace-kicker">OLUSO Enterprise</span>
        <span class="workspace-name">HSE Assurance Console</span>
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
    background: transparent;
  }

  .workspace-header {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: var(--header-height);
    padding: 0 20px;
    border-bottom: 1px solid var(--glass-border-subtle);
    background:
      linear-gradient(180deg, rgba(15, 23, 25, 0.92), rgba(10, 17, 19, 0.88)),
      linear-gradient(90deg, rgba(45, 212, 191, 0.08), transparent 42%, rgba(96, 165, 250, 0.07));
    box-shadow: var(--elevation-z0);
    backdrop-filter: blur(var(--glass-blur-md)) saturate(var(--glass-saturate));
  }

  .icon-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-control);
    background: linear-gradient(180deg, rgba(31, 46, 49, 0.92), rgba(17, 27, 29, 0.92));
    color: var(--color-text);
    cursor: pointer;
    box-shadow: var(--elevation-z0);
    backdrop-filter: blur(var(--glass-blur-sm)) saturate(var(--glass-saturate));
  }

  .icon-button:hover {
    border-color: var(--glass-border-strong);
    background: linear-gradient(180deg, rgba(38, 55, 59, 0.96), rgba(22, 34, 36, 0.96));
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
    color: var(--color-accent-strong);
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

  .workspace-status {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.035);
    color: var(--color-muted);
    font-size: 0.75rem;
    font-weight: 720;
    line-height: 1;
    padding: 6px 10px;
    white-space: nowrap;
  }

  .workspace-status::before {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: currentColor;
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
    border-top: 1px solid var(--glass-border-subtle);
    background: rgba(9, 15, 17, 0.82);
    color: var(--color-muted);
    font-size: 0.75rem;
    line-height: 1;
    padding: 0 20px;
    backdrop-filter: blur(var(--glass-blur-md)) saturate(var(--glass-saturate));
  }

  @media (max-width: 800px) {
    .workspace-status {
      display: none;
    }
  }
</style>
