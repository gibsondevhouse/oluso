<script lang="ts">
  import type { AppRoute } from "$lib/navigation/route-registry";

  interface Props {
    route: AppRoute;
  }

  let { route }: Props = $props();
</script>

<section class="page" aria-labelledby="placeholder-title">
  <header class="page-header">
    <div class="breadcrumbs">
      {#if route.section}
        {route.section}
      {:else}
        OLUSO
      {/if}
    </div>
    <h1 class="page-title" id="placeholder-title">{route.title}</h1>
    <p class="page-summary">{route.summary}</p>
  </header>

  <section class="empty-state" aria-labelledby="placeholder-empty-title">
    <h2 id="placeholder-empty-title">No records to show</h2>
    <p>
      This route is registered in the MVP shell. Data loading, forms, tables, and persistence are
      intentionally deferred.
    </p>
  </section>
</section>
