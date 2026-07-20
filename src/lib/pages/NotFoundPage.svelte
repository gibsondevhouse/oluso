<script lang="ts">
  import { ArrowLeft, LayoutDashboard } from "lucide-svelte";

  function goBack() {
    history.back();
  }
</script>

<section class="page error-surface" aria-labelledby="not-found-title">
  <header class="page-header">
    <div class="breadcrumbs">Error</div>
    <h1 class="page-title" id="not-found-title">Page Not Found</h1>
    <p class="page-summary">
      The page you requested does not exist or is not part of the current OLUSO route set.
    </p>
  </header>

  <div class="action-row">
    <a class="button-link" href="/home">
      <LayoutDashboard size={16} aria-hidden="true" />
      Go to Home
    </a>
    <button class="secondary-button" type="button" onclick={goBack}>
      <ArrowLeft size={16} aria-hidden="true" />
      Go Back
    </button>
  </div>
</section>

<style>
  .error-surface {
    max-width: 720px;
  }
</style>
