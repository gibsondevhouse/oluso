<script lang="ts">
  import { onMount } from "svelte";
  import { corporateFade, corporateSlideFly } from "$lib/transitions";

  interface Props {
    action: "archive" | "restore";
    recordTitle: string;
    onConfirm: (reason: string) => void;
    onCancel: () => void;
  }

  let { action, recordTitle, onConfirm, onCancel }: Props = $props();
  let reason = $state("");
  let error = $state("");
  let dialogElement: HTMLDivElement | null = null;
  const isArchive = $derived(action === "archive");

  onMount(() => dialogElement?.focus());

  function confirm() {
    if (isArchive && !reason.trim()) {
      error = "Archive reason is required.";
      return;
    }
    onConfirm(reason.trim());
  }
</script>

<div class="dialog-backdrop corporate-dialog-backdrop backdrop-blur-corporate" role="presentation" onclick={onCancel} transition:corporateFade={{ duration: 120 }}>
  <div
    class="dialog corporate-dialog-surface backdrop-blur-corporate"
    role="dialog"
    aria-modal="true"
    aria-labelledby="foundation-lifecycle-title"
    tabindex="-1"
    bind:this={dialogElement}
    onclick={(event) => event.stopPropagation()}
    onkeydown={(event) => {
      if (event.key === "Escape") onCancel();
    }}
    transition:corporateSlideFly={{ duration: 180 }}
  >
    <h2 id="foundation-lifecycle-title">{isArchive ? "Archive" : "Restore"} record?</h2>
    <p>{isArchive ? `Archive ${recordTitle}? Active dependents will no longer be able to select it.` : `Restore ${recordTitle} to active workflows?`}</p>
    {#if isArchive}
      <label for="foundation-archive-reason">Archive reason</label>
      <textarea
        id="foundation-archive-reason"
        rows="3"
        bind:value={reason}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? "foundation-archive-error" : undefined}
      ></textarea>
      {#if error}<p class="error-message" id="foundation-archive-error" role="alert">{error}</p>{/if}
    {/if}
    <div class="action-row">
      <button class={isArchive ? "danger-button" : "button-link"} type="button" onclick={confirm}>
        {isArchive ? "Archive" : "Restore"}
      </button>
      <button class="secondary-button" type="button" onclick={onCancel}>Cancel</button>
    </div>
  </div>
</div>

<style>
  .dialog-backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  .dialog {
    display: grid;
    gap: 12px;
    width: min(440px, 100%);
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-surface);
    padding: 22px;
  }

  h2,
  p {
    margin: 0;
  }

  p {
    color: var(--color-muted);
    font-size: 0.875rem;
  }

  label {
    font-size: 0.875rem;
    font-weight: 720;
  }
</style>
