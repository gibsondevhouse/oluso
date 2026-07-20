<script lang="ts">
  import { SIDEBAR_CONFIG } from "$lib/navigation/sidebar.config";
  import { getActiveSidebarItemId, getExpandedSectionIds } from "$lib/navigation/sidebar.utils";
  import { iconMap } from "./icons";
  import SidePanelSection from "./SidePanelSection.svelte";
  import { onMount } from "svelte";

  interface Props {
    currentPath: string;
    collapsed: boolean;
  }

  let { currentPath, collapsed }: Props = $props();
  let userExpandedState = $state<Record<string, boolean>>({});
  const expandedStorageKey = "oluso.navigation.expanded-section.v1";

  const activeItemId = $derived(getActiveSidebarItemId(currentPath, SIDEBAR_CONFIG));
  const expandedSectionIds = $derived(
    getExpandedSectionIds(currentPath, SIDEBAR_CONFIG, userExpandedState),
  );

  function toggleSection(sectionId: string) {
    const currentlyExpanded = expandedSectionIds.includes(sectionId);
    userExpandedState = Object.fromEntries(SIDEBAR_CONFIG.sections.filter((item) => item.collapsible).map((item) => [item.id, item.id === sectionId ? !currentlyExpanded : false]));
    try { window.localStorage.setItem(expandedStorageKey, currentlyExpanded ? "" : sectionId); } catch { /* navigation still works without saved preference */ }
  }

  onMount(() => {
    try {
      const saved = window.localStorage.getItem(expandedStorageKey);
      if (saved) userExpandedState = Object.fromEntries(SIDEBAR_CONFIG.sections.filter((item) => item.collapsible).map((item) => [item.id, item.id === saved]));
    } catch { /* use configured defaults */ }
  });
</script>

<aside class="side-panel corporate-glass-dark backdrop-blur-corporate" class:collapsed aria-label="Primary navigation">
  <div class="side-panel-header">
    <div class="app-mark" aria-hidden="true">
      <img src="/adama-hse-icon.svg" alt="" />
    </div>
    {#if !collapsed}
      <div class="app-identity">
        <span class="app-title">{SIDEBAR_CONFIG.appTitle}</span>
        <span class="app-subtitle">Operations Portal</span>
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
    <footer class="side-panel-footer">
      <span>Local-first data layer</span>
      <strong>Manual exchange only</strong>
    </footer>
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
    border-right: 1px solid rgba(255, 255, 255, 0.1);
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
    border-bottom: 1px solid rgba(255, 255, 255, 0.11);
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
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 6px;
    background: #176b47;
    overflow: hidden;
  }

  .app-mark img {
    display: block;
    width: 100%;
    height: 100%;
  }

  .app-identity {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 1px;
  }

  .app-title {
    color: #ffffff;
    font-size: 0.875rem;
    font-weight: 760;
    letter-spacing: 0.015em;
    line-height: 1.1;
  }

  .app-subtitle {
    color: #aeb8b2;
    font-size: 0.75rem;
    font-weight: 650;
    line-height: 1.1;
  }

  .side-panel-nav {
    flex: 1;
    overflow-y: auto;
    padding: 14px 0;
  }

  .side-panel-footer {
    display: grid;
    gap: 4px;
    border-top: 1px solid rgba(255, 255, 255, 0.11);
    background: rgba(0, 0, 0, 0.08);
    color: #aeb8b2;
    font-size: 0.75rem;
    line-height: 1.2;
    padding: 12px 16px;
  }

  .side-panel-footer strong {
    color: #7cdb9f;
    font-size: 0.75rem;
    font-weight: 760;
  }
</style>
