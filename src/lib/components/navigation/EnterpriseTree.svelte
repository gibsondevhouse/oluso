<script lang="ts">
  import { tick } from "svelte";
  import { Search } from "lucide-svelte";
  import TreeNode from "./TreeNode.svelte";
  import type { EnterpriseTreeNode } from "./enterprise-tree.types";
  interface VisibleNode { node: EnterpriseTreeNode; depth: number; }
  interface Props { nodes: EnterpriseTreeNode[]; selectedId?: string; onSelect: (node: EnterpriseTreeNode) => void; onPin?: (node: EnterpriseTreeNode) => void; searchPlaceholder?: string; }
  let { nodes, selectedId, onSelect, onPin, searchPlaceholder = "Search by name or code" }: Props = $props();
  let query = $state("");
  let expanded = $state(new Set<string>());
  let focusedIndex = $state(0);
  let elements = new Map<string, HTMLButtonElement>();
  const filteredNodes = $derived(filterTree(nodes, query));
  const visible = $derived(flatten(filteredNodes));

  $effect(() => {
    if (nodes.length && expanded.size === 0) expanded = new Set(nodes.map((node) => node.id));
    if (focusedIndex >= visible.length) focusedIndex = Math.max(0, visible.length - 1);
  });

  function filterTree(source: EnterpriseTreeNode[], search: string): EnterpriseTreeNode[] {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return source;
    return source.flatMap((node) => {
      const children = filterTree(node.children, search);
      if (`${node.name} ${node.subtitle ?? ""}`.toLowerCase().includes(normalized) || children.length) return [{ ...node, children }];
      return [];
    });
  }
  function flatten(source: EnterpriseTreeNode[], depth = 0): VisibleNode[] {
    return source.flatMap((node) => [{ node, depth }, ...(expanded.has(node.id) || query ? flatten(node.children, depth + 1) : [])]);
  }
  function toggle(node: EnterpriseTreeNode) {
    const next = new Set(expanded); next.has(node.id) ? next.delete(node.id) : next.add(node.id); expanded = next;
  }
  async function focusAt(index: number) { focusedIndex = Math.max(0, Math.min(visible.length - 1, index)); await tick(); elements.get(visible[focusedIndex]?.node.id)?.focus(); }
  function keydown(event: KeyboardEvent, item: VisibleNode, index: number) {
    if (event.key === "ArrowDown") { event.preventDefault(); void focusAt(index + 1); }
    else if (event.key === "ArrowUp") { event.preventDefault(); void focusAt(index - 1); }
    else if (event.key === "ArrowRight" && item.node.children.length) { event.preventDefault(); if (!expanded.has(item.node.id)) toggle(item.node); else void focusAt(index + 1); }
    else if (event.key === "ArrowLeft") { event.preventDefault(); if (expanded.has(item.node.id)) toggle(item.node); else { const prior = [...visible].slice(0, index).reverse().find((candidate) => candidate.depth < item.depth); if (prior) void focusAt(visible.indexOf(prior)); } }
    else if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(item.node); }
  }
</script>

<div class="enterprise-tree"><label><Search size={15}/><span class="visually-hidden">Search hierarchy</span><input bind:value={query} placeholder={searchPlaceholder}/></label><div class="tree" role="tree" aria-label="Enterprise hierarchy">{#each visible as item, index (item.node.id)}<TreeNode node={item.node} depth={item.depth} expanded={expanded.has(item.node.id) || Boolean(query)} selected={item.node.id === selectedId} focused={index === focusedIndex} onToggle={() => toggle(item.node)} onSelect={() => { focusedIndex = index; onSelect(item.node); }} onPin={onPin ? () => onPin(item.node) : undefined} onKeydown={(event) => keydown(event, item, index)} bindElement={(element) => elements.set(item.node.id, element)} />{/each}{#if visible.length === 0}<p>No nodes match “{query}”.</p>{/if}</div></div>

<style>
  .enterprise-tree { display: grid; grid-template-rows: auto minmax(0, 1fr); min-height: 0; }
  label { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 7px; margin: 0 8px 9px; border: 1px solid var(--color-border); border-radius: var(--radius-control); background: var(--color-surface); color: var(--color-muted); padding: 0 9px; }
  input { min-width: 0; min-height: 36px; border: 0; background: transparent; outline: 0; }
  .tree { min-height: 0; overflow-y: auto; } p { color: var(--color-muted); font-size: .8125rem; padding: 12px; }
  .visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
</style>
