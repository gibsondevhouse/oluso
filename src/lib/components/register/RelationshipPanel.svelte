<script lang="ts">
  import { onMount, tick } from "svelte";
  import RecordContextPanel, {
    type ContextPanelRecord,
  } from "$lib/components/context-panel/RecordContextPanel.svelte";
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
  let activeRecord = $state<ContextPanelRecord | null>(null);
  let returnFocusId = $state("");

  const contextItems = $derived(
    sections.flatMap((section) =>
      section.items.map((item) => ({ ...item, sectionTitle: section.title })),
    ),
  );

  onMount(() => {
    syncContextFromUrl();
    window.addEventListener("popstate", syncContextFromUrl);

    return () => window.removeEventListener("popstate", syncContextFromUrl);
  });

  $effect(() => {
    sections;
    syncContextFromUrl();
  });

  function syncContextFromUrl() {
    if (typeof window === "undefined") return;

    const contextId = new URL(window.location.href).searchParams.get("context");
    if (!contextId) {
      activeRecord = null;
      return;
    }

    activeRecord = contextItems.find((item) => item.id === contextId) ?? null;
  }

  function inspectRecord(item: RelationshipItem, sectionTitle: string) {
    activeRecord = { ...item, sectionTitle };
    returnFocusId = item.id;

    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("context") === item.id) return;
    url.searchParams.set("context", item.id);
    window.history.pushState({ olusoContextPanel: item.id }, "", url);
  }

  function closeContextPanel() {
    const previousId = activeRecord?.id ?? returnFocusId;
    activeRecord = null;

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.get("context")) {
        url.searchParams.delete("context");
        window.history.replaceState({}, "", url);
      }
    }

    void tick().then(() => {
      document.querySelector<HTMLButtonElement>(`[data-context-trigger="${previousId}"]`)?.focus();
    });
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!activeRecord || event.key !== "Escape") return;
    event.preventDefault();
    closeContextPanel();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

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
            <div class="relationship-card">
              <a class="relationship-title" href={item.href}>{item.title}</a>
              {#if item.meta}
                <span class="relationship-meta">{item.meta}</span>
              {/if}
              <div class="relationship-actions">
                {#if item.archived}
                  <StatusPill label="Archived" tone="inactive" context="related record" compact />
                {/if}
                <button
                  type="button"
                  data-context-trigger={item.id}
                  onclick={() => inspectRecord(item, section.title)}
                >
                  Inspect
                </button>
              </div>
            </div>
          {:else}
            <div class="relationship-card missing" role="note">
              <span class="relationship-title">{item.title}</span>
              <span class="relationship-meta">{item.meta ?? "Related record is missing."}</span>
              <button
                type="button"
                data-context-trigger={item.id}
                onclick={() => inspectRecord(item, section.title)}
              >
                Inspect
              </button>
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </section>
{/each}

{#if activeRecord}
  <RecordContextPanel record={activeRecord} onClose={closeContextPanel} />
{/if}

<style>
  .relationship-panel {
    display: grid;
    gap: 12px;
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-surface);
    background: var(--color-surface);
    box-shadow: var(--surface-shadow);
    padding: 18px;
  }

  .relationship-header h2 {
    margin: 0;
    color: var(--color-text);
    font-size: 1.0625rem;
    font-weight: 760;
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
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-control);
    background: var(--color-surface-subtle);
    color: inherit;
    padding: 11px 12px;
    text-decoration: none;
    transition:
      background-color var(--motion-duration-fast) var(--motion-ease-standard),
      border-color var(--motion-duration-fast) var(--motion-ease-standard);
  }

  .relationship-card:hover {
    border-color: var(--glass-border);
    background: rgba(255, 255, 255, 0.045);
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

  a.relationship-title {
    text-decoration: none;
  }

  a.relationship-title:hover {
    color: var(--color-accent-strong);
  }

  .relationship-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .relationship-card button {
    width: fit-content;
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-control);
    background: rgba(255, 255, 255, 0.04);
    color: var(--color-accent-strong);
    font-size: 0.75rem;
    font-weight: 760;
    padding: 5px 8px;
  }
</style>
