<script lang="ts">
  import BackToRegisterLink from "$lib/components/register/BackToRegisterLink.svelte";
  import RecordMetadataPanel from "$lib/components/register/RecordMetadataPanel.svelte";
  import RelationshipPanel, {
    type RelationshipSection,
  } from "$lib/components/register/RelationshipPanel.svelte";
  import RestoreAction from "$lib/components/register/RestoreAction.svelte";
  import StatusPill from "$lib/components/ui/StatusPill.svelte";
  import type { LifecycleMetadata } from "$lib/persistence/lifecycle.types";

  export interface DetailField {
    label: string;
    value: string | null | undefined;
  }

  export interface DetailSection {
    title: string;
    fields: DetailField[];
  }

  interface Props {
    breadcrumbs: string;
    title: string;
    summary: string;
    statusLabel: string;
    statusTone: string;
    record: LifecycleMetadata & {
      id: string;
      createdAt: string;
      updatedAt: string;
    };
    primarySections: DetailSection[];
    relatedSections?: DetailSection[];
    relationshipSections?: RelationshipSection[];
    additionalActions?: Array<{ label: string; href: string }>;
    backHref: string;
    onEdit: () => void;
    onArchive: () => void;
    onRestore: () => void;
    onBack: () => void;
  }

  let {
    breadcrumbs,
    title,
    summary,
    statusLabel,
    statusTone,
    record,
    primarySections,
    relatedSections = [],
    relationshipSections = [],
    additionalActions = [],
    backHref,
    onEdit,
    onArchive,
    onRestore,
    onBack,
  }: Props = $props();

  const isArchived = $derived(record.lifecycleStatus === "archived");
</script>

<section class="page" aria-labelledby="record-detail-title">
  <header class="page-header register-page-header">
    <div>
      <div class="breadcrumbs">{breadcrumbs}</div>
      <h1 class="page-title" id="record-detail-title">{title}</h1>
      <p class="page-summary">{summary}</p>
    </div>

    <div class="register-header-actions">
      <StatusPill label={statusLabel} tone={statusTone} context="status" />
      {#if isArchived}
        <StatusPill label="Archived" tone="inactive" context="lifecycle" />
      {/if}
    </div>
  </header>

  <div class="detail-layout">
    <RecordMetadataPanel {record} />

    {#each primarySections as section (section.title)}
      <section class="detail-panel" aria-labelledby={`section-${section.title.replace(/\s+/g, "-").toLowerCase()}`}>
        <div class="detail-header">
          <h2 id={`section-${section.title.replace(/\s+/g, "-").toLowerCase()}`}>{section.title}</h2>
        </div>
        <dl class="detail-list">
          {#each section.fields as field (field.label)}
            <div>
              <dt>{field.label}</dt>
              <dd>{field.value || "Not provided"}</dd>
            </div>
          {/each}
        </dl>
      </section>
    {/each}

    {#each relatedSections as section (section.title)}
      <section class="detail-panel" aria-labelledby={`related-${section.title.replace(/\s+/g, "-").toLowerCase()}`}>
        <div class="detail-header">
          <h2 id={`related-${section.title.replace(/\s+/g, "-").toLowerCase()}`}>{section.title}</h2>
        </div>
        <dl class="detail-list">
          {#each section.fields as field (field.label)}
            <div>
              <dt>{field.label}</dt>
              <dd>{field.value || "Not provided"}</dd>
            </div>
          {/each}
        </dl>
      </section>
    {/each}

    {#if relationshipSections.length > 0}
      <RelationshipPanel sections={relationshipSections} />
    {/if}

    <section class="detail-panel" aria-labelledby="detail-actions-title">
      <div class="detail-header">
        <h2 id="detail-actions-title">Actions</h2>
      </div>
      <div class="action-row">
        {#each additionalActions as action (action.href)}
          <a class="button-link" href={action.href}>{action.label}</a>
        {/each}
        <button class="button-link" type="button" onclick={onEdit}>Edit</button>
        {#if isArchived}
          <RestoreAction {onRestore} />
        {:else}
          <button class="danger-button" type="button" onclick={onArchive}>Archive</button>
        {/if}
        <BackToRegisterLink href={backHref} onNavigate={onBack} />
      </div>
    </section>
  </div>
</section>

<style>
  .detail-layout {
    display: grid;
    gap: 16px;
    max-width: 980px;
  }

  .detail-panel {
    display: grid;
    gap: 12px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface);
    padding: 18px;
  }

  .detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .detail-header h2 {
    margin: 0;
    font-size: 1rem;
    line-height: 1.25;
  }

  .detail-list {
    display: grid;
    gap: 0;
    margin: 0;
    border-top: 1px solid var(--color-border);
  }

  .detail-list div {
    display: grid;
    grid-template-columns: minmax(140px, 0.3fr) 1fr;
    gap: 16px;
    border-bottom: 1px solid var(--color-border);
    padding: 10px 0;
  }

  dt {
    color: var(--color-muted);
    font-size: 0.8125rem;
    font-weight: 700;
  }

  dd {
    margin: 0;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  @media (max-width: 720px) {
    .detail-list div {
      grid-template-columns: 1fr;
      gap: 4px;
    }
  }
</style>
