<script lang="ts">
  import type { Snippet } from "svelte";
  import { ChevronDown, MoreHorizontal } from "lucide-svelte";
  import ContextPath from "./ContextPath.svelte";
  import RecordStatusGroup, { type RecordStatus } from "./RecordStatusGroup.svelte";
  import { formatTimestamp } from "$lib/utils/date";

  interface PathItem { label: string; href?: string; }
  interface Action { label: string; onSelect: () => void; primary?: boolean; }
  interface Props {
    eyebrow?: string;
    title: string;
    recordType: string;
    summary?: string;
    updatedAt?: string;
    updatedBy?: string;
    contextPath?: PathItem[];
    statuses?: RecordStatus[];
    actions?: Action[];
    moreActions?: Action[];
    meta?: Snippet;
  }
  let { eyebrow, title, recordType, summary, updatedAt, updatedBy, contextPath = [], statuses = [], actions = [], moreActions = [], meta }: Props = $props();
  let moreOpen = $state(false);
</script>

<header class="workspace-record-header">
  <div class="header-copy">
    {#if contextPath.length}<ContextPath items={contextPath} />{/if}
    {#if eyebrow}<span class="eyebrow">{eyebrow}</span>{/if}
    <div class="title-line"><h1>{title}</h1><span class="record-type">{recordType}</span></div>
    {#if summary}<p>{summary}</p>{/if}
    {#if updatedAt}<p class="last-updated">Last updated {formatTimestamp(updatedAt)} by {updatedBy || "Local workspace user"}</p>{/if}
    {#if meta}<div class="meta">{@render meta()}</div>{/if}
    {#if statuses.length}<RecordStatusGroup {statuses} />{/if}
  </div>
  {#if actions.length || moreActions.length}
    <div class="header-actions">
      {#each actions as action}
        <button type="button" class:primary={action.primary} onclick={action.onSelect}>{action.label}</button>
      {/each}
      {#if moreActions.length}
        <div class="more-menu">
          <button type="button" class="more-trigger" aria-expanded={moreOpen} onclick={() => (moreOpen = !moreOpen)}><MoreHorizontal size={16} /> More <ChevronDown size={14} /></button>
          {#if moreOpen}
            <div class="menu" role="menu">
              {#each moreActions as action}<button type="button" role="menuitem" onclick={() => { moreOpen = false; action.onSelect(); }}>{action.label}</button>{/each}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</header>

<style>
  .workspace-record-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 28px; padding: 24px 0; border-bottom: 1px solid var(--color-border); }
  .header-copy { display: grid; gap: 9px; min-width: 0; }
  .eyebrow { color: var(--color-action); font-size: .75rem; font-weight: 750; text-transform: uppercase; letter-spacing: .04em; }
  .title-line { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
  h1 { margin: 0; color: var(--color-text); font-size: clamp(1.65rem, 3vw, 2.25rem); line-height: 1.1; }
  .record-type { border: 1px solid var(--color-border); border-radius: 999px; background: var(--color-surface-subtle); color: var(--color-muted); font-size: .75rem; font-weight: 700; padding: 4px 8px; }
  p { max-width: 760px; margin: 0; color: var(--color-muted); }
  .last-updated { font-size: .75rem; }
  .header-actions { position: relative; display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
  button { min-height: 38px; border: 1px solid var(--color-border-strong); border-radius: var(--radius-control); background: var(--color-surface); color: var(--color-text); font-weight: 700; padding: 0 13px; }
  button:hover { border-color: var(--color-action); background: var(--color-surface-subtle); }
  button.primary { border-color: var(--color-action); background: var(--color-action); color: white; }
  .more-menu { position: relative; }
  .more-trigger { display: inline-flex; align-items: center; gap: 6px; }
  .menu { position: absolute; z-index: var(--z-depth-popover); top: calc(100% + 6px); right: 0; display: grid; min-width: 190px; border: 1px solid var(--color-border); border-radius: var(--radius-surface); background: var(--color-surface); box-shadow: var(--elevation-z2); padding: 6px; }
  .menu button { border: 0; text-align: left; }
  @media (max-width: 780px) { .workspace-record-header { flex-direction: column; } .header-actions { justify-content: flex-start; } }
</style>
