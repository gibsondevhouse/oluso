<script lang="ts">
  import { dev } from "$app/environment";
  import { LayoutDashboard, RefreshCw } from "lucide-svelte";

  interface ErrorDetails {
    message?: string;
    stack?: string;
  }

  interface Props {
    details?: ErrorDetails;
  }

  let { details }: Props = $props();
  let showDetails = $state(false);

  function reloadApp() {
    location.reload();
  }
</script>

<section class="page error-surface" aria-labelledby="error-title">
  <header class="page-header">
    <div class="breadcrumbs">Error</div>
    <h1 class="page-title" id="error-title">Something Went Wrong</h1>
    <p class="page-summary">
      The application encountered an unexpected error. You can reload the app or return to Home.
    </p>
  </header>

  <div class="action-row">
    <button class="button-link" type="button" onclick={reloadApp}>
      <RefreshCw size={16} aria-hidden="true" />
      Reload App
    </button>
    <a class="secondary-button" href="/home">
      <LayoutDashboard size={16} aria-hidden="true" />
      Go to Home
    </a>
  </div>

  {#if dev && details?.message}
    <details
      class="error-details"
      open={showDetails}
      ontoggle={(event) => (showDetails = (event.currentTarget as HTMLDetailsElement).open)}
    >
      <summary aria-expanded={showDetails}>Error Details</summary>
      <pre>{details.message}{#if details.stack}

{details.stack}{/if}</pre>
    </details>
  {/if}
</section>

<style>
  .error-surface {
    max-width: 760px;
  }

  .error-details {
    margin-top: 20px;
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-surface);
    background: var(--color-surface-solid);
    box-shadow: var(--surface-shadow);
    padding: 12px 14px;
  }

  summary {
    cursor: pointer;
    color: var(--color-text);
    font-weight: 700;
  }

  pre {
    overflow-x: auto;
    margin: 12px 0 0;
    color: var(--color-danger);
    white-space: pre-wrap;
  }
</style>
