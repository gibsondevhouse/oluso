<script lang="ts">
  import type { Snippet } from "svelte";
  import { spring } from "svelte/motion";
  import { scale } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import type { DashboardCardSize, GlassCardTone } from "./dashboard.types";

  interface Props {
    title: string;
    eyebrow?: string;
    href?: string;
    size?: DashboardCardSize;
    tone?: GlassCardTone;
    index?: number;
    interactive?: boolean;
    ariaLabel?: string;
    children?: Snippet;
    meta?: Snippet;
    actions?: Snippet;
    footer?: Snippet;
  }

  let {
    title,
    eyebrow = "",
    href,
    size = "span-1",
    tone = "neutral",
    index = 0,
    interactive = true,
    ariaLabel,
    children,
    meta,
    actions,
    footer,
  }: Props = $props();

  let active = $state(false);
  const hoverDepth = spring(0, { stiffness: 0.16, damping: 0.74 });

  $effect(() => {
    hoverDepth.set(active && interactive ? 1 : 0);
  });

  const cardClass = $derived(
    [
      "glass-card",
      `glass-card--${size}`,
      `glass-card--${tone}`,
      interactive ? "glass-card--interactive" : "",
    ]
      .filter(Boolean)
      .join(" "),
  );
  const cardTransform = $derived(
    `translate3d(0, ${$hoverDepth * -4}px, 0) scale(${1 + $hoverDepth * 0.012})`,
  );
  const cardStyle = $derived(
    `--glass-card-index: ${index}; --glass-card-depth: ${$hoverDepth}; transform: ${cardTransform};`,
  );

  function activate() {
    active = true;
  }

  function deactivate() {
    active = false;
  }
</script>

{#snippet cardContent()}
  <div class="glass-card-header">
    <div class="glass-card-title-block">
      {#if eyebrow}
        <span class="glass-card-eyebrow">{eyebrow}</span>
      {/if}
      <h3 class="glass-card-title">{title}</h3>
    </div>
    {#if meta}
      <div class="glass-card-meta">
        {@render meta()}
      </div>
    {/if}
  </div>

  {#if children}
    <div class="glass-card-body">
      {@render children()}
    </div>
  {/if}

  {#if actions || footer}
    <div class="glass-card-footer">
      {#if footer}
        <div class="glass-card-footer-content">
          {@render footer()}
        </div>
      {/if}
      {#if actions}
        <div class="glass-card-actions">
          {@render actions()}
        </div>
      {/if}
    </div>
  {/if}
{/snippet}

{#if href}
  <a
    class={cardClass}
    data-size={size}
    data-tone={tone}
    href={href}
    aria-label={ariaLabel}
    style={cardStyle}
    onpointerenter={activate}
    onpointerleave={deactivate}
    onfocusin={activate}
    onfocusout={deactivate}
    in:scale={{ start: 0.985, duration: 220, delay: index * 34, easing: cubicOut }}
  >
    {@render cardContent()}
  </a>
{:else}
  <article
    class={cardClass}
    data-size={size}
    data-tone={tone}
    aria-label={ariaLabel}
    style={cardStyle}
    onpointerenter={activate}
    onpointerleave={deactivate}
    onfocusin={activate}
    onfocusout={deactivate}
    in:scale={{ start: 0.985, duration: 220, delay: index * 34, easing: cubicOut }}
  >
    {@render cardContent()}
  </article>
{/if}

<style>
  .glass-card {
    --glass-card-accent: rgba(68, 215, 182, 0.72);
    --glass-card-accent-soft: rgba(68, 215, 182, 0.12);
    display: flex;
    position: relative;
    flex: 1;
    min-width: 0;
    min-height: var(--bento-row-min);
    flex-direction: column;
    justify-content: space-between;
    gap: 12px;
    overflow: hidden;
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--bento-card-radius);
    background:
      linear-gradient(145deg, rgba(255, 255, 255, 0.11), transparent 42%),
      var(--glass-bg);
    box-shadow: var(--elevation-z1);
    color: var(--color-text);
    padding: 15px;
    text-decoration: none;
    transform-origin: center;
    transition:
      border-color var(--motion-duration-standard) var(--motion-ease-standard),
      background var(--motion-duration-standard) var(--motion-ease-standard),
      box-shadow var(--motion-duration-standard) var(--motion-ease-standard),
      backdrop-filter var(--motion-duration-standard) var(--motion-ease-standard);
    backdrop-filter: blur(var(--glass-blur-md)) saturate(var(--glass-saturate));
    will-change: transform;
  }

  .glass-card::before {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background:
      linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent),
      linear-gradient(180deg, var(--glass-card-accent-soft), transparent 34%);
    content: "";
    opacity: calc(0.25 + (var(--glass-card-depth) * 0.5));
    pointer-events: none;
    transition: opacity var(--motion-duration-standard) var(--motion-ease-standard);
  }

  .glass-card::after {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    border-top: 1px solid rgba(255, 255, 255, 0.24);
    content: "";
    pointer-events: none;
  }

  .glass-card--interactive {
    cursor: pointer;
  }

  .glass-card--interactive:hover,
  .glass-card--interactive:focus-visible,
  .glass-card--interactive:focus-within {
    border-color: var(--glass-border-strong);
    background:
      linear-gradient(145deg, rgba(255, 255, 255, 0.14), transparent 42%),
      var(--glass-bg-strong);
    box-shadow: var(--elevation-z3);
    backdrop-filter: blur(var(--glass-blur-lg)) saturate(165%);
  }

  .glass-card:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 3px;
  }

  .glass-card--span-2 {
    min-height: calc(var(--bento-row-min) * 1.08);
  }

  .glass-card--span-4 {
    min-height: calc(var(--bento-row-min) * 1.18);
  }

  .glass-card--accent,
  .glass-card--cyan {
    --glass-card-accent: rgba(34, 211, 238, 0.72);
    --glass-card-accent-soft: rgba(34, 211, 238, 0.12);
  }

  .glass-card--success {
    --glass-card-accent: rgba(74, 222, 128, 0.76);
    --glass-card-accent-soft: rgba(74, 222, 128, 0.12);
  }

  .glass-card--warning {
    --glass-card-accent: rgba(251, 191, 36, 0.76);
    --glass-card-accent-soft: rgba(251, 191, 36, 0.12);
  }

  .glass-card--danger {
    --glass-card-accent: rgba(248, 113, 113, 0.76);
    --glass-card-accent-soft: rgba(248, 113, 113, 0.12);
  }

  .glass-card-header,
  .glass-card-footer {
    display: flex;
    position: relative;
    z-index: 1;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }

  .glass-card-title-block {
    display: grid;
    min-width: 0;
    gap: 4px;
  }

  .glass-card-eyebrow {
    color: var(--color-muted);
    font-size: 0.6875rem;
    font-weight: 760;
    letter-spacing: 0.04em;
    line-height: 1.2;
    text-transform: uppercase;
  }

  .glass-card-title {
    margin: 0;
    color: var(--color-text);
    font-size: 0.9375rem;
    font-weight: 720;
    letter-spacing: 0;
    line-height: 1.18;
  }

  .glass-card-meta {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: flex-end;
    min-width: 0;
  }

  .glass-card-body {
    display: grid;
    position: relative;
    z-index: 1;
    gap: 8px;
    min-width: 0;
  }

  .glass-card-footer {
    align-items: center;
    color: var(--color-muted);
    font-size: 0.75rem;
    line-height: 1.25;
  }

  .glass-card-footer-content,
  .glass-card-actions {
    display: flex;
    min-width: 0;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .glass-card-actions {
    justify-content: flex-end;
  }

  @media (prefers-reduced-motion: reduce) {
    .glass-card {
      transform: none !important;
      transition: none;
    }
  }
</style>
