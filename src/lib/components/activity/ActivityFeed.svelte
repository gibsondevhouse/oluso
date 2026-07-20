<script lang="ts">
  import { ArrowRight, History } from "lucide-svelte";
  import type { ActivityFeedItem } from "$lib/application/portal";
  import { formatTimestamp } from "$lib/utils/date";

  interface Props {
    items: ActivityFeedItem[];
    emptyMessage?: string;
  }

  let { items, emptyMessage = "No activity matches the current filters." }: Props = $props();
</script>

{#if items.length}
  <ol class="activity-feed">
    {#each items as item (item.id)}
      <li class:limited={item.sourceState === "limited-history"}>
        <div class="activity-icon" aria-hidden="true">
          <History size={16} />
        </div>
        <div class="activity-body">
          <div class="activity-heading">
            <div>
              <strong>{item.summary}</strong>
              <span>{item.recordType} · {item.scopeLabel}</span>
            </div>
            <time datetime={item.timestamp}>{formatTimestamp(item.timestamp)}</time>
          </div>
          <dl>
            <div><dt>Actor</dt><dd>{item.actor}</dd></div>
            <div><dt>Source</dt><dd>{item.sourceLabel}</dd></div>
            <div><dt>Revision/event</dt><dd>{item.sourceRevisionId}</dd></div>
            <div><dt>Package</dt><dd>{item.sourcePackage}</dd></div>
          </dl>
          <p>{item.sourceDetail}</p>
        </div>
        <a href={item.href} aria-label={`Open ${item.recordTitle}`}>
          <ArrowRight size={16} aria-hidden="true" />
        </a>
      </li>
    {/each}
  </ol>
{:else}
  <p class="activity-empty">{emptyMessage}</p>
{/if}

<style>
  .activity-feed {
    display: grid;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .activity-feed li {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: start;
    gap: 12px;
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-surface);
    background: rgba(11, 19, 21, 0.64);
    padding: 14px;
  }

  .activity-feed li.limited {
    border-color: var(--color-warning-border);
    background: linear-gradient(180deg, var(--color-warning-soft), rgba(11, 19, 21, 0.72));
  }

  .activity-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-control);
    background: rgba(255, 255, 255, 0.045);
    color: var(--color-accent-strong);
  }

  .activity-body {
    display: grid;
    gap: 9px;
    min-width: 0;
  }

  .activity-heading {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 12px;
  }

  .activity-heading strong,
  .activity-heading span,
  .activity-body p,
  .activity-feed dd,
  .activity-feed dt {
    overflow-wrap: anywhere;
  }

  .activity-heading strong {
    display: block;
    color: var(--color-text);
    font-size: 0.9375rem;
    line-height: 1.3;
  }

  .activity-heading span,
  .activity-heading time,
  .activity-body p,
  .activity-empty {
    color: var(--color-muted);
    font-size: 0.8125rem;
    line-height: 1.4;
  }

  .activity-heading time {
    flex: 0 0 auto;
    white-space: nowrap;
  }

  .activity-feed dl {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1px;
    margin: 0;
    overflow: hidden;
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-control);
    background: var(--glass-border-subtle);
  }

  .activity-feed dl div {
    display: grid;
    gap: 4px;
    min-width: 0;
    background: rgba(5, 12, 14, 0.42);
    padding: 8px;
  }

  .activity-feed dt {
    color: var(--color-muted);
    font-size: 0.6875rem;
    font-weight: 760;
    text-transform: uppercase;
  }

  .activity-feed dd,
  .activity-body p {
    margin: 0;
  }

  .activity-feed a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-control);
    color: var(--color-accent-strong);
    text-decoration: none;
  }

  @media (max-width: 860px) {
    .activity-feed li,
    .activity-heading {
      grid-template-columns: 1fr;
    }

    .activity-heading {
      display: grid;
    }

    .activity-feed dl {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 560px) {
    .activity-feed dl {
      grid-template-columns: 1fr;
    }
  }
</style>
