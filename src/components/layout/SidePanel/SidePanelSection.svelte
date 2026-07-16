<script lang="ts">
  import type { SidebarSection } from "../../../lib/navigation/sidebar.types";
  import { iconMap } from "./icons";
  import SidePanelItem from "./SidePanelItem.svelte";

  interface Props {
    section: SidebarSection;
    collapsed: boolean;
    expanded: boolean;
    activeItemId: string | null;
    onToggle: () => void;
  }

  let { section, collapsed, expanded, activeItemId, onToggle }: Props = $props();

  const IconComponent = $derived(section.icon ? iconMap[section.icon] : null);
  const ChevronIcon = $derived(expanded ? iconMap.ChevronDown : iconMap.ChevronRight);
  const sectionActive = $derived(section.children.some((item) => item.id === activeItemId));
</script>

<div class="side-panel-section" class:collapsed class:active={sectionActive}>
  {#if !collapsed}
    {#if section.collapsible}
      <button
        type="button"
        class="section-header interactive"
        onclick={onToggle}
        aria-expanded={expanded}
      >
        {#if IconComponent}
          <span class="icon">
            <IconComponent size={16} />
          </span>
        {/if}
        <span class="title">{section.title}</span>
        {#if ChevronIcon}
          <span class="chevron">
            <ChevronIcon size={14} />
          </span>
        {/if}
      </button>
    {:else}
      <div class="section-header static">
        {#if IconComponent}
          <span class="icon">
            <IconComponent size={16} />
          </span>
        {/if}
        <span class="title">{section.title}</span>
      </div>
    {/if}
  {:else}
    <div class="section-divider"></div>
  {/if}

  {#if !section.collapsible || expanded || collapsed}
    <div class="section-content">
      {#each section.children as item (item.id)}
        <SidePanelItem
          {item}
          active={item.id === activeItemId}
          {collapsed}
        />
      {/each}
    </div>
  {/if}
</div>

<style>
  .side-panel-section {
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;
  }

  .section-header {
    display: flex;
    align-items: center;
    min-height: 30px;
    padding: 6px 16px;
    font-size: 0.75rem;
    font-weight: 760;
    text-transform: uppercase;
    letter-spacing: 0;
    color: var(--color-nav-section-title);
    background: none;
    border: none;
    text-align: left;
    width: 100%;
    box-sizing: border-box;
  }

  .section-header.interactive {
    cursor: pointer;
    user-select: none;
  }

  .section-header.interactive:hover {
    color: var(--color-nav-hover-text);
  }

  .section-header.interactive:focus {
    border-radius: var(--radius-control);
    outline: 2px solid var(--color-focus);
    outline-offset: -2px;
  }

  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-right: 8px;
    opacity: 0.8;
  }

  .title {
    flex-grow: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chevron {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    opacity: 0.6;
  }

  .section-divider {
    height: 1px;
    background-color: var(--glass-border-subtle);
    margin: 8px 12px;
  }

  .section-content {
    display: flex;
    flex-direction: column;
  }

  .side-panel-section.collapsed {
    margin-bottom: 4px;
  }

  .side-panel-section.active .section-header {
    color: var(--color-nav-active-text);
  }
</style>
