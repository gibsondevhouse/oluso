<script lang="ts">
  import { SIDEBAR_CONFIG } from "$lib/navigation/sidebar.config";
  import { getActiveSidebarItemId, getExpandedSectionIds } from "$lib/navigation/sidebar.utils";
  import { iconMap } from "./icons";
  import SidePanelSection from "./SidePanelSection.svelte";

  interface Props {
    currentPath: string;
    collapsed: boolean;
  }

  let { currentPath, collapsed }: Props = $props();
  let userExpandedState = $state<Record<string, boolean>>({});

  const activeItemId = $derived(getActiveSidebarItemId(currentPath, SIDEBAR_CONFIG));
  const expandedSectionIds = $derived(
    getExpandedSectionIds(currentPath, SIDEBAR_CONFIG, userExpandedState),
  );

  function toggleSection(sectionId: string) {
    const currentlyExpanded = expandedSectionIds.includes(sectionId);
    userExpandedState = {
      ...userExpandedState,
      [sectionId]: !currentlyExpanded,
    };
  }

  const AppIcon = iconMap.ShieldCheck;
</script>

<aside class="side-panel" class:collapsed aria-label="Primary navigation">
  <div class="side-panel-header">
    <div class="app-mark" aria-hidden="true">
      <AppIcon size={20} />
    </div>
    {#if !collapsed}
      <div class="app-identity">
        <span class="app-title">{SIDEBAR_CONFIG.appTitle}</span>
        <span class="app-subtitle">HSE workspace</span>
      </div>
    {/if}
  </div>

  <nav class="side-panel-nav" aria-label="Main sections">
    {#each SIDEBAR_CONFIG.sections as section (section.id)}
      <SidePanelSection
        {section}
        {collapsed}
        expanded={expandedSectionIds.includes(section.id)}
        {activeItemId}
        onToggle={() => toggleSection(section.id)}
      />
    {/each}
  </nav>

  {#if !collapsed}
    <footer class="side-panel-footer">Local desktop shell</footer>
  {/if}
</aside>

<style>
  .side-panel {
    display: flex;
    flex: 0 0 var(--side-panel-width);
    flex-direction: column;
    width: var(--side-panel-width);
    min-width: var(--side-panel-width);
    height: 100vh;
    overflow: hidden;
    border-right: 1px solid var(--color-border);
    background: var(--color-surface-raised);
    color: var(--color-nav-text);
  }

  .side-panel.collapsed {
    flex-basis: var(--side-panel-collapsed-width);
    width: var(--side-panel-collapsed-width);
    min-width: var(--side-panel-collapsed-width);
  }

  .side-panel-header {
    display: flex;
    align-items: center;
    min-height: var(--header-height);
    padding: 0 14px;
    border-bottom: 1px solid var(--color-border);
    gap: 10px;
  }

  .side-panel.collapsed .side-panel-header {
    justify-content: center;
    padding: 0;
  }

  .app-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    flex: 0 0 32px;
    border: 1px solid var(--color-border-strong);
    border-radius: 8px;
    background: var(--color-accent-soft);
    color: var(--color-accent);
  }

  .app-identity {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 1px;
  }

  .app-title {
    color: var(--color-text);
    font-size: 0.875rem;
    font-weight: 700;
    line-height: 1.1;
  }

  .app-subtitle {
    color: var(--color-muted);
    font-size: 0.75rem;
    line-height: 1.1;
  }

  .side-panel-nav {
    flex: 1;
    overflow-y: auto;
    padding: 12px 0;
  }

  .side-panel-footer {
    border-top: 1px solid var(--color-border);
    color: var(--color-muted);
    font-size: 0.75rem;
    line-height: 1.2;
    padding: 12px 16px;
  }
</style>
