<script lang="ts">
  import BackToRegisterLink from "$lib/components/register/BackToRegisterLink.svelte";
  import RecordMetadataPanel from "$lib/components/register/RecordMetadataPanel.svelte";
  import RelationshipPanel, {
    type RelationshipSection,
  } from "$lib/components/register/RelationshipPanel.svelte";
  import RestoreAction from "$lib/components/register/RestoreAction.svelte";
  import StatusPill from "$lib/components/ui/StatusPill.svelte";
  import { formatTimestamp } from "$lib/utils/date";
  import {
    getRecordActivity,
    getRecordEvidenceState,
    getRecordOwner,
    getRecordSource,
    type TraceableRecord,
  } from "./record-traceability";
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
  const traceableRecord = $derived(record as unknown as TraceableRecord);
  const owner = $derived(getRecordOwner(traceableRecord));
  const source = $derived(getRecordSource(traceableRecord));
  const evidence = $derived(getRecordEvidenceState(traceableRecord));
  const activity = $derived(getRecordActivity(traceableRecord));
  const linkedCount = $derived(
    relationshipSections.reduce((total, section) => total + section.items.filter((item) => !item.missing).length, 0),
  );
  const relationshipIssueCount = $derived(
    relationshipSections.reduce(
      (total, section) => total + section.items.filter((item) => item.missing || item.archived).length,
      0,
    ),
  );
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

  <section class="traceability-strip" aria-label="Record traceability summary">
    <div><span>Source</span><strong>{source}</strong></div>
    <div><span>Owner</span><strong>{owner}</strong></div>
    <div><span>Last updated</span><strong>{formatTimestamp(record.updatedAt)}</strong></div>
    <div>
      <span>Linked context</span>
      <strong>{linkedCount} linked{relationshipIssueCount ? ` / ${relationshipIssueCount} need review` : ""}</strong>
    </div>
    <div><span>Evidence</span><StatusPill label={evidence.label} tone={evidence.tone} context="evidence" compact /></div>
  </section>

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

    <section class="detail-panel" aria-labelledby="record-activity-title">
      <div class="detail-header"><h2 id="record-activity-title">Activity</h2></div>
      <ol class="activity-list">
        {#each activity as item (`${item.label}-${item.timestamp}`)}
          <li>
            <div><strong>{item.label}</strong><time datetime={item.timestamp}>{formatTimestamp(item.timestamp)}</time></div>
            <p>{item.detail}</p>
          </li>
        {/each}
      </ol>
    </section>

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
  .traceability-strip {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 1px;
    max-width: 1180px;
    margin-bottom: 16px;
    overflow: hidden;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-border);
  }

  .traceability-strip > div {
    display: grid;
    align-content: start;
    gap: 5px;
    min-width: 0;
    background: var(--color-surface);
    padding: 12px;
  }

  .traceability-strip span { color: var(--color-muted); font-size: 0.75rem; font-weight: 700; }
  .traceability-strip strong { font-size: 0.8125rem; overflow-wrap: anywhere; }

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

  .activity-list { display: grid; gap: 0; margin: 0; padding: 0; list-style: none; }
  .activity-list li { border-top: 1px solid var(--color-border); padding: 10px 0; }
  .activity-list li > div { display: flex; justify-content: space-between; gap: 12px; }
  .activity-list time, .activity-list p { color: var(--color-muted); font-size: 0.8125rem; }
  .activity-list p { margin: 4px 0 0; }

  @media (max-width: 720px) {
    .traceability-strip { grid-template-columns: 1fr 1fr; }
    .detail-list div {
      grid-template-columns: 1fr;
      gap: 4px;
    }
  }
</style>
