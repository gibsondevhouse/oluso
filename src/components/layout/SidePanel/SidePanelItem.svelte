<script lang="ts">
  import type { SidebarItem } from "../../../lib/navigation/sidebar.types";
  import { iconMap } from "./icons";

  interface Props {
    item: SidebarItem;
    active: boolean;
    collapsed: boolean;
  }

  let { item, active, collapsed }: Props = $props();

  const IconComponent = $derived(item.icon ? iconMap[item.icon] : null);
</script>

<a
  href={item.route}
  class="side-panel-item"
  class:active
  class:collapsed
  aria-current={active ? "page" : undefined}
  title={collapsed ? item.title : undefined}
>
  {#if IconComponent}
    <span class="icon">
      <IconComponent size={18} />
    </span>
  {/if}
  
  {#if !collapsed}
    <span class="title">{item.title}</span>
    {#if item.badge !== undefined && item.badge > 0}
      <span class="badge">{item.badge}</span>
    {/if}
  {/if}
</a>

<style>
  .side-panel-item {
    display: flex;
    align-items: center;
    padding: 6px 12px;
    margin: 2px 8px;
    border-radius: 6px;
    color: var(--color-nav-text);
    text-decoration: none;
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 500;
    transition: background-color 0.15s, color 0.15s;
    user-select: none;
  }

  .side-panel-item:hover {
    background-color: var(--color-nav-hover-bg);
    color: var(--color-nav-hover-text);
  }

  .side-panel-item.active {
    background-color: var(--color-nav-active-bg);
    color: var(--color-nav-active-text);
    font-weight: 600;
  }

  .side-panel-item.collapsed {
    justify-content: center;
    padding: 8px;
    margin: 4px 8px;
  }

  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .side-panel-item:not(.collapsed) .icon {
    margin-right: 8px;
  }

  .title {
    flex-grow: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .badge {
    background-color: var(--color-badge-bg);
    color: var(--color-badge-text);
    font-size: 0.75rem;
    padding: 1px 6px;
    border-radius: 10px;
    font-weight: 600;
  }
</style>
