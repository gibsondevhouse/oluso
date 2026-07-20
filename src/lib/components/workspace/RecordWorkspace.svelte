<script lang="ts">
  import type { Snippet } from "svelte";
  import WorkspaceHeader from "./WorkspaceHeader.svelte";
  import WorkspaceTabs, { type WorkspaceTab } from "./WorkspaceTabs.svelte";
  import type { RecordStatus } from "./RecordStatusGroup.svelte";
  interface PathItem { label: string; href?: string; }
  interface Action { label: string; onSelect: () => void; primary?: boolean; }
  interface Props { title: string; recordType: string; summary?: string; updatedAt?: string; updatedBy?: string; contextPath?: PathItem[]; statuses?: RecordStatus[]; actions?: Action[]; moreActions?: Action[]; tabs?: WorkspaceTab[]; activeTab?: string; onTabChange?: (id: string) => void; children?: Snippet; aside?: Snippet; }
  let { title, recordType, summary, updatedAt, updatedBy, contextPath = [], statuses = [], actions = [], moreActions = [], tabs = [], activeTab = "overview", onTabChange = () => {}, children, aside }: Props = $props();
</script>

<article class="record-workspace"><WorkspaceHeader {title} {recordType} {summary} {updatedAt} {updatedBy} {contextPath} {statuses} {actions} {moreActions} />{#if tabs.length}<WorkspaceTabs {tabs} active={activeTab} onChange={onTabChange} />{/if}<div class:with-aside={Boolean(aside)} class="workspace-body"><div class="workspace-content">{#if children}{@render children()}{/if}</div>{#if aside}<aside>{@render aside()}</aside>{/if}</div></article>

<style>
  .record-workspace { width: min(100%, 1500px); margin: 0 auto; padding: 0 30px 40px; }
  .workspace-body { padding-top: 20px; } .workspace-body.with-aside { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 340px); gap: 20px; }
  .workspace-content { min-width: 0; } aside { display: grid; align-content: start; gap: 14px; }
  @media (max-width: 960px) { .workspace-body.with-aside { grid-template-columns: 1fr; } }
  @media (max-width: 640px) { .record-workspace { padding: 0 16px 28px; } }
</style>
