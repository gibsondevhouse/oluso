<script lang="ts">
  import { onMount } from "svelte";

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

<div class="dialog-backdrop" role="presentation" onclick={onCancel}>
  <div
    class="dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="foundation-lifecycle-title"
    tabindex="-1"
    bind:this={dialogElement}
    onclick={(event) => event.stopPropagation()}
    onkeydown={(event) => {
      if (event.key === "Escape") onCancel();
    }}
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
    background: rgba(0, 0, 0, 0.52);
    padding: 24px;
    backdrop-filter: blur(8px);
  }

  .dialog {
    display: grid;
    gap: 12px;
    width: min(440px, 100%);
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-surface);
    background: var(--color-surface-solid);
    padding: 22px;
    box-shadow: var(--elevation-z3);
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
