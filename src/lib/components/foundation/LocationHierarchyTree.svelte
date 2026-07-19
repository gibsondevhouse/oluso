<script lang="ts">
  import StatusPill from "$lib/components/ui/StatusPill.svelte";
  import type { Location } from "$lib/domain/foundation";

  interface Props {
    locations: Location[];
    onOpen: (location: Location) => void;
  }

  let { locations, onOpen }: Props = $props();

  const rows = $derived(buildRows(locations));

  function buildRows(records: Location[]) {
    const children = new Map<string | null, Location[]>();
    for (const record of records) {
      const siblings = children.get(record.parentId) ?? [];
      siblings.push(record);
      children.set(record.parentId, siblings);
    }
    for (const siblings of children.values()) {
      siblings.sort((left, right) => left.name.localeCompare(right.name));
    }

    const output: Array<{ location: Location; depth: number; childCount: number; descendantCount: number }> = [];
    const visited = new Set<string>();
    const countDescendants = (id: string, path = new Set<string>()): number => {
      if (path.has(id)) return 0;
      const nextPath = new Set(path).add(id);
      return (children.get(id) ?? []).reduce(
        (total, child) => total + 1 + countDescendants(child.id, nextPath),
        0,
      );
    };
    const visit = (location: Location, depth: number) => {
      if (visited.has(location.id)) return;
      visited.add(location.id);
      output.push({
        location,
        depth,
        childCount: children.get(location.id)?.length ?? 0,
        descendantCount: countDescendants(location.id),
      });
      for (const child of children.get(location.id) ?? []) visit(child, depth + 1);
    };
    for (const root of children.get(null) ?? []) visit(root, 0);
    for (const orphan of records.filter((record) => !visited.has(record.id))) visit(orphan, 0);
    return output;
  }
</script>

{#if locations.length > 0}
  <section class="hierarchy-panel" aria-labelledby="location-hierarchy-title">
    <div class="hierarchy-header">
      <div>
        <span>Typed hierarchy</span>
        <h2 id="location-hierarchy-title">Location tree</h2>
      </div>
      <p>{locations.length} nodes, including archived records</p>
    </div>
    <ol class="tree-list">
      {#each rows as row (row.location.id)}
        <li style:--tree-depth={row.depth}>
          <button type="button" onclick={() => onOpen(row.location)}>
            <span class="tree-branch" aria-hidden="true"></span>
            <span class="tree-title">
              <strong>{row.location.name}</strong>
              <small>{row.location.nodeType} · {row.location.businessId}</small>
            </span>
            <span class="tree-counts">
              {row.childCount} children · {row.descendantCount} descendants
            </span>
            {#if row.location.lifecycleStatus === "archived"}
              <StatusPill label="Archived" tone="inactive" context="location lifecycle" compact />
            {/if}
          </button>
        </li>
      {/each}
    </ol>
  </section>
{/if}

<style>
  .hierarchy-panel {
    display: grid;
    gap: 12px;
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-surface);
    background: linear-gradient(180deg, rgba(22, 33, 36, 0.86), rgba(14, 23, 25, 0.84));
    box-shadow: var(--surface-shadow);
    padding: 18px;
  }

  .hierarchy-header,
  .hierarchy-header > div {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
  }

  .hierarchy-header span {
    color: var(--color-accent-strong);
    font-size: 0.6875rem;
    font-weight: 760;
    text-transform: uppercase;
  }

  .hierarchy-header h2,
  .hierarchy-header p {
    margin: 0;
  }

  .hierarchy-header h2 {
    font-size: 1.0625rem;
  }

  .hierarchy-header p,
  .tree-counts,
  small {
    color: var(--color-muted);
    font-size: 0.75rem;
  }

  .tree-list {
    display: grid;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    padding-left: calc(var(--tree-depth) * 22px);
  }

  li button {
    display: grid;
    grid-template-columns: 14px minmax(180px, 1fr) auto auto;
    align-items: center;
    gap: 10px;
    width: 100%;
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-control);
    background: rgba(7, 12, 14, 0.28);
    color: inherit;
    padding: 10px 12px;
    text-align: left;
  }

  li button:hover {
    border-color: var(--glass-border);
    background: rgba(255, 255, 255, 0.045);
  }

  .tree-branch {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-accent);
  }

  .tree-title {
    display: grid;
    gap: 2px;
  }

  @media (max-width: 720px) {
    .hierarchy-header,
    .hierarchy-header > div {
      align-items: flex-start;
      flex-direction: column;
    }

    li {
      padding-left: calc(var(--tree-depth) * 10px);
    }

    li button {
      grid-template-columns: 12px 1fr;
    }

    .tree-counts {
      grid-column: 2;
    }
  }
</style>
