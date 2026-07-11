<script lang="ts">
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { olusoApplication } from "../application/oluso-application";
  import AppShell from "../components/layout/AppShell.svelte";
  import "../app.css";

  interface Props {
    children: import("svelte").Snippet;
  }

  let { children }: Props = $props();
  const currentPath = $derived(page.url.pathname);

  onMount(() => {
    void olusoApplication.initialize().catch(() => {
      // The repository publishes visible diagnostics for initialization failures.
    });
  });
</script>

<AppShell {currentPath}>
  {@render children()}
</AppShell>
