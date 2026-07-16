<script lang="ts" generics="TItem extends DashboardGridItem">
  import type { Snippet } from "svelte";
  import { fly } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import type { DashboardGridItem } from "./dashboard.types";

  type DashboardGridDensity = "compact" | "balanced" | "spacious";

  interface Props {
    items: readonly TItem[];
    labelledBy?: string;
    density?: DashboardGridDensity;
    staggerMs?: number;
    children?: Snippet<[TItem, number]>;
  }

  let {
    items,
    labelledBy,
    density = "balanced",
    staggerMs = 34,
    children,
  }: Props = $props();
</script>

<section
  class="dashboard-grid dashboard-grid--{density}"
  aria-labelledby={labelledBy}
  style={`--dashboard-stagger-ms: ${staggerMs}ms`}
>
  {#each items as item, index (item.id)}
    <div
      class="dashboard-grid-cell"
      data-size={item.size ?? "span-1"}
      style={`--dashboard-card-index: ${index}`}
      in:fly={{
        y: 12,
        duration: 280,
        delay: index * staggerMs,
        easing: quintOut,
      }}
    >
      {#if children}
        {@render children(item, index)}
      {/if}
    </div>
  {/each}
</section>

<style>
  .dashboard-grid {
    display: grid;
    grid-auto-flow: dense;
    grid-auto-rows: minmax(var(--bento-row-min), auto);
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: var(--bento-gap);
    isolation: isolate;
    width: 100%;
  }

  .dashboard-grid--compact {
    --bento-gap: 10px;
    --bento-row-min: 92px;
  }

  .dashboard-grid--balanced {
    --bento-gap: 12px;
    --bento-row-min: 116px;
  }

  .dashboard-grid--spacious {
    --bento-gap: 14px;
    --bento-row-min: 148px;
  }

  .dashboard-grid-cell {
    display: flex;
    min-width: 0;
    min-height: 0;
    position: relative;
    z-index: var(--z-depth-base);
  }

  .dashboard-grid-cell:hover,
  .dashboard-grid-cell:focus-within {
    z-index: var(--z-depth-raised);
  }

  .dashboard-grid-cell[data-size="span-1"] {
    grid-column: span var(--bento-span-1);
  }

  .dashboard-grid-cell[data-size="span-2"] {
    grid-column: span var(--bento-span-2);
  }

  .dashboard-grid-cell[data-size="span-4"] {
    grid-column: span var(--bento-span-4);
  }

  @media (max-width: 1180px) {
    .dashboard-grid-cell[data-size="span-1"] {
      grid-column: span 4;
    }

    .dashboard-grid-cell[data-size="span-2"] {
      grid-column: span 8;
    }
  }

  @media (max-width: 840px) {
    .dashboard-grid-cell[data-size="span-1"] {
      grid-column: span 6;
    }

    .dashboard-grid-cell[data-size="span-2"],
    .dashboard-grid-cell[data-size="span-4"] {
      grid-column: span 12;
    }
  }

  @media (max-width: 560px) {
    .dashboard-grid {
      grid-template-columns: 1fr;
    }

    .dashboard-grid-cell,
    .dashboard-grid-cell[data-size] {
      grid-column: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .dashboard-grid-cell {
      transition: none;
    }
  }
</style>
