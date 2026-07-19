<script lang="ts">
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { olusoApplication } from "../application/oluso-application";
  import { foundationApplication } from "$lib/application/foundation";
  import AppShell from "../components/layout/AppShell.svelte";
  import { getBrowserDatabase } from "$lib/data/database";
  import "../app.css";

  interface Props {
    children: import("svelte").Snippet;
  }

  let { children }: Props = $props();
  const currentPath = $derived(page.url.pathname);
  let identityState = $state<"loading" | "ready" | "profile-required" | "error">("loading");
  let identityError = $state<string | null>(null);

  function identityRoute(path: string) {
    return path === "/settings/profile" || path === "/settings/installation";
  }

  $effect(() => {
    if (identityState === "profile-required" && !identityRoute(currentPath)) {
      void goto("/settings/profile");
    }
  });

  onMount(() => {
    const handleIdentityReady = () => { identityState = "ready"; };
    window.addEventListener("adama-identity-ready", handleIdentityReady);
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
    void getBrowserDatabase()
      .then((adapter) => adapter.localIdentity().getCurrentUser())
      .then((user) => { identityState = user ? "ready" : "profile-required"; })
      .catch((error) => {
        identityState = "error";
        identityError = error instanceof Error ? error.message : String(error);
      });
    return () => window.removeEventListener("adama-identity-ready", handleIdentityReady);
  });
</script>

<AppShell {currentPath}>
  {#if identityState === "loading"}
    <section class="identity-bootstrap" role="status">Initializing the secure local dataset…</section>
  {:else if identityState === "error"}
    <section class="identity-bootstrap" role="alert">Local identity could not be loaded: {identityError}</section>
  {:else if identityState === "ready" || identityRoute(currentPath)}
    {@render children()}
  {/if}
</AppShell>

<style>
  .identity-bootstrap { margin: 28px; border: 1px solid var(--glass-border-subtle); border-radius: var(--radius-surface); background: rgba(18, 29, 31, .86); color: var(--color-muted); padding: 24px; }
</style>
