<script lang="ts">
  import { Building2, ChevronDown, ChevronRight, Factory, Flag, Globe2, MapPin, Network, Pin } from "lucide-svelte";
  import type { EnterpriseTreeNode } from "./enterprise-tree.types";
  interface Props { node: EnterpriseTreeNode; depth: number; expanded: boolean; selected: boolean; focused: boolean; onToggle: () => void; onSelect: () => void; onPin?: () => void; onKeydown: (event: KeyboardEvent) => void; bindElement?: (element: HTMLButtonElement) => void; }
  let { node, depth, expanded, selected, focused, onToggle, onSelect, onPin, onKeydown, bindElement = () => {} }: Props = $props();
  const icons = { organization: Building2, country: Globe2, geography: Flag, site: Factory, location: MapPin, function: Network };
  const Icon = $derived(icons[node.type]);
  let nodeElement = $state<HTMLButtonElement>();
  $effect(() => { if (nodeElement) bindElement(nodeElement); });
</script>

<div class="tree-row" class:selected style:--tree-depth={depth} role="treeitem" aria-level={depth + 1} aria-selected={selected} aria-expanded={node.children.length ? expanded : undefined}>
  <button class="toggle" type="button" aria-label={`${expanded ? "Collapse" : "Expand"} ${node.name}`} disabled={!node.children.length} onclick={onToggle}>{#if node.children.length}{#if expanded}<ChevronDown size={14}/>{:else}<ChevronRight size={14}/>{/if}{/if}</button>
  <button class="node" type="button" tabindex={focused ? 0 : -1} bind:this={nodeElement} onclick={onSelect} onkeydown={onKeydown}>
    <span class={`node-icon ${node.type}`}><Icon size={15}/></span><span class="copy"><strong>{node.name}</strong>{#if node.subtitle}<small>{node.subtitle}</small>{/if}</span>
    {#if node.dataQuality && node.dataQuality !== "verified"}<span class={`quality ${node.dataQuality}`} title={node.dataQuality === "needs-review" ? "Data needs review" : "Data quality not assessed"}><span class="visually-hidden">{node.dataQuality === "needs-review" ? "Data needs review" : "Data quality not assessed"}</span></span>{/if}
  </button>
  {#if onPin && (node.type === "site" || node.type === "location")}<button class="pin" class:pinned={node.pinned} type="button" aria-label={`${node.pinned ? "Unpin" : "Pin"} ${node.name}`} onclick={onPin}><Pin size={13}/></button>{/if}
</div>

<style>
  .tree-row { display: grid; grid-template-columns: 22px minmax(0, 1fr) 28px; align-items: center; min-height: 38px; padding-left: calc(var(--tree-depth) * 17px); border-radius: var(--radius-control); }
  .tree-row:hover { background: var(--color-surface-subtle); } .tree-row.selected { background: var(--color-accent-soft); }
  button { border: 0; background: transparent; color: var(--color-muted); }
  .toggle { display: grid; place-items: center; width: 22px; height: 32px; padding: 0; } .toggle:disabled { opacity: 0; }
  .node { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 8px; min-width: 0; min-height: 36px; padding: 3px 2px; text-align: left; }
  .node-icon { display: grid; place-items: center; width: 25px; height: 25px; border-radius: 6px; background: var(--color-info-soft); color: var(--color-info-text); }
  .node-icon.organization { background: #eef0fb; color: #4858a8; } .node-icon.site, .node-icon.location { background: var(--color-positive-soft); color: var(--color-positive-text); } .node-icon.function { background: var(--color-warning-soft); color: var(--color-warning-text); }
  .copy { display: grid; min-width: 0; } strong, small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } strong { color: var(--color-text); font-size: .8125rem; } small { color: var(--color-muted); font-size: .6875rem; }
  .quality { width: 7px; height: 7px; border-radius: 50%; background: var(--color-subtle); } .quality.needs-review { background: var(--color-warning); }
  .pin { display: none; place-items: center; width: 27px; height: 27px; border-radius: var(--radius-control); } .tree-row:hover .pin, .pin.pinned { display: grid; } .pin.pinned { color: var(--color-action); }
  .visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
</style>
