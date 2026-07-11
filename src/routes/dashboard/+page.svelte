<script lang="ts">
  import { findRoute } from "$lib/navigation/route-registry";
  import RouteOutlet from "$lib/pages/RouteOutlet.svelte";

  const route = findRoute("/dashboard");
</script>

{#if route}
  <RouteOutlet {route} />
{/if}
