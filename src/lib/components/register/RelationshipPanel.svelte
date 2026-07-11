<script lang="ts">
  import StatusPill from "$lib/components/ui/StatusPill.svelte";

  export interface RelationshipItem {
    id: string;
    title: string;
    href?: string;
    meta?: string;
    archived?: boolean;
    missing?: boolean;
  }

  export interface RelationshipSection {
    title: string;
    items: RelationshipItem[];
  }

  interface Props {
    sections: RelationshipSection[];
  }

  let { sections }: Props = $props();
</script>

{#each sections as section (section.title)}
  <section class="relationship-panel" aria-labelledby={`relationship-${section.title.replace(/\s+/g, "-").toLowerCase()}`}>
    <div class="relationship-header">
      <h2 id={`relationship-${section.title.replace(/\s+/g, "-").toLowerCase()}`}>{section.title}</h2>
    </div>

    {#if section.items.length === 0}
      <p class="relationship-empty">No related records yet.</p>
    {:else}
      <div class="relationship-list">
        {#each section.items as item (item.id)}
          {#if item.href && !item.missing}
            <a class="relationship-card" href={item.href}>
              <span class="relationship-title">{item.title}</span>
              {#if item.meta}
                <span class="relationship-meta">{item.meta}</span>
              {/if}
              {#if item.archived}
                <StatusPill label="Archived" tone="inactive" context="related record" compact />
              {/if}
            </a>
          {:else}
            <div class="relationship-card missing" role="note">
              <span class="relationship-title">{item.title}</span>
              <span class="relationship-meta">{item.meta ?? "Related record is missing."}</span>
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </section>
{/each}

<style>
  .relationship-panel {
    display: grid;
    gap: 12px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface);
    padding: 18px;
  }

  .relationship-header h2 {
    margin: 0;
    font-size: 1rem;
    line-height: 1.25;
  }

  .relationship-empty,
  .relationship-meta {
    color: var(--color-muted);
    font-size: 0.8125rem;
    line-height: 1.35;
  }

  .relationship-empty {
    margin: 0;
  }

  .relationship-list {
    display: grid;
    gap: 8px;
  }

  .relationship-card {
    display: grid;
    gap: 4px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    color: inherit;
    padding: 10px 12px;
    text-decoration: none;
  }

  .relationship-card:hover {
    background: var(--color-hover);
  }

  .relationship-card.missing {
    border-color: var(--color-warning-border);
    background: var(--color-warning-soft);
  }

  .relationship-title {
    color: var(--color-text);
    font-weight: 700;
    line-height: 1.3;
  }
</style>
