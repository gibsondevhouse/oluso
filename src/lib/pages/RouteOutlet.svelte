<script lang="ts">
  import type { AppRoute } from "$lib/navigation/route-registry";
  import { isRegisterRouteKind } from "$lib/navigation/route-registry";
  import DashboardPage from "./DashboardPage.svelte";
  import ErrorPage from "./ErrorPage.svelte";
  import GlobalSearchPage from "./GlobalSearchPage.svelte";
  import NotFoundPage from "./NotFoundPage.svelte";
  import RegisterCrudPage from "./RegisterCrudPage.svelte";
  import ReportsExportsPage from "./ReportsExportsPage.svelte";
  import RoutePlaceholderPage from "./RoutePlaceholderPage.svelte";
  import SettingsPage from "./SettingsPage.svelte";
  import LocalIdentitySettingsPage from "./LocalIdentitySettingsPage.svelte";

  interface Props {
    route: AppRoute;
  }

  let { route }: Props = $props();
</script>

{#if route.kind === "dashboard"}
  <DashboardPage />
{:else if route.kind === "global-search"}
  <GlobalSearchPage />
{:else if isRegisterRouteKind(route.kind)}
  <RegisterCrudPage {route} />
{:else if route.kind === "exports"}
  <ReportsExportsPage />
{:else if route.kind === "settings"}
  <SettingsPage />
{:else if route.kind === "profile"}
  <LocalIdentitySettingsPage mode="profile" />
{:else if route.kind === "installation"}
  <LocalIdentitySettingsPage mode="installation" />
{:else if route.kind === "not-found"}
  <NotFoundPage />
{:else if route.kind === "error"}
  <ErrorPage />
{:else}
  <RoutePlaceholderPage {route} />
{/if}
