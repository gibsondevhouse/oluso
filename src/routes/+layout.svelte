<script lang="ts">
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { olusoApplication } from "../application/oluso-application";
  import { foundationApplication } from "$lib/application/foundation";
  import AppShell from "../components/layout/AppShell.svelte";
  import "../app.css";

  interface Props {
    children: import("svelte").Snippet;
  }

  let { children }: Props = $props();
  const currentPath = $derived(page.url.pathname);

  onMount(() => {
    const initialization = [
      "/people/organizations",
      "/people/workers",
      "/operations/locations",
      "/operations/processes",
      "/operations/tasks",
    ].some((path) => currentPath === path || currentPath.startsWith(`${path}/`))
      ? foundationApplication.initialize()
      : olusoApplication.initialize();
    void initialization.catch(() => {
      // The repository publishes visible diagnostics for initialization failures.
    });
  });
</script>

<AppShell {currentPath}>
  {@render children()}
</AppShell>
