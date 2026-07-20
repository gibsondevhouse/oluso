<script lang="ts">
  import { MapPin, X } from "lucide-svelte";
  import { pinnedScopes, setWorkspaceScope, unpinScope } from "$lib/workspace/scope";
  interface Props { compact?: boolean; }
  let { compact = false }: Props = $props();
</script>

<section class="pinned-scopes" class:compact><h2><MapPin size={16} /> Pinned Sites</h2>{#if $pinnedScopes.length}<ul>{#each $pinnedScopes as item (item.id)}<li><button class="scope" type="button" onclick={() => setWorkspaceScope(item.scope)}>{item.label}</button><button class="remove" type="button" aria-label={`Unpin ${item.label}`} onclick={() => unpinScope(item.id)}><X size={14} /></button></li>{/each}</ul>{:else}<p>Pin a useful Site or work context from the scope bar.</p>{/if}</section>

<style>
  .pinned-scopes { border: 1px solid var(--color-border); border-radius: var(--radius-surface); background: var(--color-surface); }
  h2 { display: flex; align-items: center; gap: 7px; margin: 0; border-bottom: 1px solid var(--color-border); font-size: .875rem; padding: 12px 14px; }
  ul { margin: 0; padding: 6px; list-style: none; } li { display: grid; grid-template-columns: 1fr auto; align-items: center; }
  button { border: 0; border-radius: var(--radius-control); background: transparent; color: var(--color-text); } .scope { min-height: 34px; overflow: hidden; padding: 0 8px; text-align: left; text-overflow: ellipsis; white-space: nowrap; } .remove { display: grid; place-items: center; width: 30px; height: 30px; color: var(--color-muted); }
  button:hover { background: var(--color-surface-subtle); color: var(--color-action); }
  p { margin: 0; color: var(--color-muted); font-size: .75rem; padding: 14px; }
  .compact { border: 0; background: transparent; } .compact h2 { padding-inline: 8px; } .compact p { padding-inline: 8px; }
</style>
