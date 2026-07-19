<script lang="ts">
  import type { AppRoute } from "$lib/navigation/route-registry";
  import { isFoundationRouteKind, isRegisterRouteKind } from "$lib/navigation/route-registry";
  import DashboardPage from "./DashboardPage.svelte";
  import ErrorPage from "./ErrorPage.svelte";
  import GlobalSearchPage from "./GlobalSearchPage.svelte";
  import FoundationCrudPage from "./FoundationCrudPage.svelte";
  import NotFoundPage from "./NotFoundPage.svelte";
  import RegisterCrudPage from "./RegisterCrudPage.svelte";
  import ReportsExportsPage from "./ReportsExportsPage.svelte";
  import RoutePlaceholderPage from "./RoutePlaceholderPage.svelte";
  import SettingsPage from "./SettingsPage.svelte";
  import LocalIdentitySettingsPage from "./LocalIdentitySettingsPage.svelte";
  import ChemicalMasterDataPage from "./chemical/ChemicalMasterDataPage.svelte";
  import ChemicalMigrationReviewPage from "./chemical/ChemicalMigrationReviewPage.svelte";
  import EnterpriseNavigatorPage from "./EnterpriseNavigatorPage.svelte";

  interface Props {
    route: AppRoute;
  }

  let { route }: Props = $props();
</script>

{#if route.kind === "dashboard"}
  <DashboardPage />
{:else if route.kind === "global-search"}
  <GlobalSearchPage />
{:else if route.kind === "enterprise-navigator"}
  <EnterpriseNavigatorPage />
{:else if isFoundationRouteKind(route.kind)}
  <FoundationCrudPage {route} />
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
{:else if ["chemical-substances", "chemical-products", "chemical-inventory", "chemical-uses"].includes(route.kind)}
  <ChemicalMasterDataPage {route} />
{:else if route.kind === "chemical-migration"}
  <ChemicalMigrationReviewPage />
{:else if route.kind === "not-found"}
  <NotFoundPage />
{:else if route.kind === "error"}
  <ErrorPage />
{:else}
  <RoutePlaceholderPage {route} />
{/if}
