<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { foundationApplication, type FoundationServices } from "$lib/application/foundation";
  import FoundationLifecycleDialog from "$lib/components/foundation/FoundationLifecycleDialog.svelte";
  import LocationHierarchyTree from "$lib/components/foundation/LocationHierarchyTree.svelte";
  import FoundationRecordWorkspace from "$lib/components/workspace/FoundationRecordWorkspace.svelte";
  import GuidedFoundationForm from "$lib/components/forms/GuidedFoundationForm.svelte";
  import {
    getFoundationUiConfig,
    type FoundationContext,
    type FoundationFormValues,
    type FoundationRecord,
  } from "$lib/components/foundation/foundation-ui";
  import RecordForm from "$lib/components/register/RecordForm.svelte";
  import RegisterPageHeader from "$lib/components/register/RegisterPageHeader.svelte";
  import RegisterState from "$lib/components/register/RegisterState.svelte";
  import RegisterTable from "$lib/components/register/RegisterTable.svelte";
  import type { RecordRevision } from "$lib/data/database";
  import { organizationAssignmentIsEffective } from "$lib/domain/enterprise";
  import { assignmentIsEffective } from "$lib/domain/operations";
  import type { FoundationRouteKind, AppRoute, RouteMode } from "$lib/navigation/route-registry";
  import { findRoute, isFoundationRouteKind } from "$lib/navigation/route-registry";
  import { workspaceScope } from "$lib/workspace/scope";
  import RegisterRecordNotFound from "./RegisterRecordNotFound.svelte";

  const FOUNDATION_STATUS_FILTERS = [
    { value: "Draft", label: "Draft" },
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
    { value: "Archived", label: "Archived" },
  ] as const;

  interface Props {
    route: AppRoute;
  }

  let { route }: Props = $props();
  let displayMode = $state<RouteMode>("list");
  let displayRecordId = $state("");
  let services = $state<FoundationServices | null>(null);
  let context = $state<FoundationContext>(emptyContext());
  let currentRecord = $state<FoundationRecord | null>(null);
  let revisions = $state<RecordRevision<FoundationRecord>[]>([]);
  let isInitializing = $state(true);
  let isLoading = $state(true);
  let recordMissing = $state(false);
  let operationError = $state<string | null>(null);
  let pendingLifecycleAction = $state<"archive" | "restore" | null>(null);
  let locationCountryFilter = $state("");
  let locationStateFilter = $state("");
  let locationCountyFilter = $state("");
  let locationCityFilter = $state("");
  let locationTypeFilter = $state("");
  let locationFunctionFilter = $state("");
  let locationOrganizationFilter = $state("");
  let locationListMode = $state<"explore" | "search">("explore");
  let mounted = false;

  const routeKind = $derived(
    isFoundationRouteKind(route.kind) ? route.kind : "organizations" as FoundationRouteKind,
  );
  const config = $derived(getFoundationUiConfig(routeKind));
  const records = $derived(config.records(context).filter((record) => {
    if (!recordMatchesScope(record)) return false;
    if (config.kind !== "locations") return true;
    const location = record as import("$lib/domain/location").Location;
    if (locationCountryFilter && location.resolvedCountryId !== locationCountryFilter) return false;
    if (locationStateFilter && location.resolvedStateOrProvinceId !== locationStateFilter) return false;
    if (locationCountyFilter && location.resolvedCountyOrDistrictId !== locationCountyFilter) return false;
    if (locationCityFilter && location.resolvedCityOrMunicipalityId !== locationCityFilter) return false;
    if (locationTypeFilter && location.nodeType !== locationTypeFilter) return false;
    if (locationFunctionFilter && !context.locationFunctionAssignments.some((item) => item.locationId === location.id && item.operationalFunctionId === locationFunctionFilter && assignmentIsEffective(item))) return false;
    if (locationOrganizationFilter && !context.organizationLocationAssignments.some((item) => item.locationId === location.id && item.organizationId === locationOrganizationFilter && organizationAssignmentIsEffective(item))) return false;
    return true;
  }));
  const columns = $derived(config.columns(context));
  const formInitialValues = $derived(scopedInitialValues(config.initialValues(displayMode === "edit" ? currentRecord : null)));
  const exploreLocations = $derived(context.locations.filter((location) => {
    if (!$workspaceScope.countryId && !$workspaceScope.siteId && !$workspaceScope.locationId && !$workspaceScope.operationalFunctionId && !$workspaceScope.organizationId) return true;
    if (recordMatchesScope(location)) return true;
    const selected = context.locations.find((item) => item.id === ($workspaceScope.locationId ?? $workspaceScope.siteId ?? $workspaceScope.countryId));
    if (!selected) return false;
    const ancestorIds = new Set<string>(); let parentId = selected.parentId; while (parentId) { ancestorIds.add(parentId); parentId = context.locations.find((item) => item.id === parentId)?.parentId ?? null; }
    return ancestorIds.has(location.id);
  }));
  const siteFilterOptions = $derived(
    context.locations
      .filter((location) => location.nodeType === "Site")
      .map((location) => ({ value: location.id, label: location.name })),
  );

  $effect(() => {
    const nextMode = route.mode ?? "list";
    const nextRecordId = route.recordId ?? "";
    displayMode = nextMode;
    displayRecordId = nextRecordId;
    if (mounted) {
      queueMicrotask(() => void loadPage(nextMode, nextRecordId));
    }
  });

  onMount(() => {
    mounted = true;
    displayMode = route.mode ?? "list";
    displayRecordId = route.recordId ?? "";
    void loadPage(displayMode, displayRecordId);
    return () => {
      mounted = false;
    };
  });

  function emptyContext(): FoundationContext {
    return {
      organizations: [], people: [], locations: [], operationalFunctions: [],
      locationFunctionAssignments: [], organizationLocationAssignments: [],
      organizationFunctionResponsibilities: [], processes: [], processLocationAssignments: [], tasks: [],
    };
  }

  async function loadContext(activeServices: FoundationServices) {
    const [organizations, people, locations, operationalFunctions, locationFunctionAssignments,
      organizationLocationAssignments, organizationFunctionResponsibilities, processes,
      processLocationAssignments, tasks] = await Promise.all([
      activeServices.organizations.list(true),
      activeServices.people.list(true),
      activeServices.locations.list(true),
      activeServices.operationalFunctions.list(true),
      activeServices.locationFunctionAssignments.list(true),
      activeServices.organizationLocationAssignments.list(true),
      activeServices.organizationFunctionResponsibilities.list(true),
      activeServices.processes.list(true),
      activeServices.processLocationAssignments.list(true),
      activeServices.tasks.list(true),
    ]);
    context = {
      organizations, people, locations, operationalFunctions, locationFunctionAssignments,
      organizationLocationAssignments, organizationFunctionResponsibilities, processes,
      processLocationAssignments, tasks,
    };
  }

  async function loadPage(nextMode: RouteMode, nextRecordId: string) {
    isLoading = true;
    operationError = null;
    recordMissing = false;
    try {
      isInitializing = !services;
      const activeServices = services ?? await foundationApplication.services();
      services = activeServices;
      isInitializing = false;
      await loadContext(activeServices);
      if ((nextMode === "detail" || nextMode === "edit") && nextRecordId) {
        try {
          currentRecord = await config.get(activeServices, nextRecordId);
          revisions = await foundationApplication.revisionHistory<FoundationRecord>(config.recordType, nextRecordId);
        } catch (error) {
          if (isNotFound(error)) {
            currentRecord = null;
            revisions = [];
            recordMissing = true;
          } else {
            throw error;
          }
        }
      } else {
        currentRecord = null;
        revisions = [];
      }
    } catch (error) {
      operationError = message(error);
      currentRecord = null;
    } finally {
      isInitializing = false;
      isLoading = false;
    }
  }

  function isNotFound(error: unknown) {
    return Boolean(error && typeof error === "object" && "code" in error && error.code === "RECORD_NOT_FOUND");
  }

  function message(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }

  function makeRecordPath(record: FoundationRecord) {
    return `${config.basePath}/${encodeURIComponent(record.id)}`;
  }

  function setLocalRoute(path: string) {
    const nextRoute = findRoute(path);
    if (!nextRoute || nextRoute.kind !== route.kind) return;
    displayMode = nextRoute.mode ?? "list";
    displayRecordId = nextRoute.recordId ?? "";
    void loadPage(displayMode, displayRecordId);
  }

  async function navigateTo(path: string) {
    setLocalRoute(path);
    try {
      await goto(path);
    } catch {
      if (typeof window !== "undefined") window.history.pushState({}, "", path);
    }
  }

  async function saveRecord(values: FoundationFormValues) {
    if (!services) throw new Error("The foundation database is still initializing.");
    const saved = displayMode === "edit" && currentRecord
      ? await config.update(services, currentRecord.id, values, currentRecord.revision)
      : await config.create(services, values);
    currentRecord = saved;
    await loadContext(services);
    revisions = await foundationApplication.revisionHistory<FoundationRecord>(config.recordType, saved.id);
    await navigateTo(makeRecordPath(saved));
  }

  async function confirmLifecycleAction(reason: string) {
    if (!services || !currentRecord || !pendingLifecycleAction) return;
    try {
      operationError = null;
      currentRecord = pendingLifecycleAction === "archive"
        ? await config.archive(services, currentRecord.id, currentRecord.revision, reason)
        : await config.restore(services, currentRecord.id, currentRecord.revision);
      await loadContext(services);
      revisions = await foundationApplication.revisionHistory<FoundationRecord>(config.recordType, currentRecord.id);
    } catch (error) {
      operationError = message(error);
    } finally {
      pendingLifecycleAction = null;
    }
  }

  function lifecycleStatus(record: FoundationRecord) {
    return record.lifecycleStatus === "archived" ? "Archived" : record.status;
  }

  function recordMatchesScope(record: FoundationRecord) {
    const scope = $workspaceScope;
    if (!Object.values(scope).some(Boolean)) return true;
    if (config.kind === "organizations") {
      if (!scope.organizationId) return true;
      let organization = context.organizations.find((item) => item.id === record.id);
      while (organization) { if (organization.id === scope.organizationId) return true; organization = context.organizations.find((item) => item.id === organization?.parentOrganizationId); }
      return false;
    }
    if (config.kind === "people") {
      const person = record as import("$lib/domain/foundation").Person;
      if (scope.organizationId && person.organizationId !== scope.organizationId) return false;
      if (scope.siteId && person.primarySiteId !== scope.siteId) return false;
      return true;
    }
    if (config.kind === "locations") {
      const location = record as import("$lib/domain/location").Location;
      if (scope.countryId && location.id !== scope.countryId && location.resolvedCountryId !== scope.countryId) return false;
      if (scope.siteId && location.id !== scope.siteId && location.resolvedSiteId !== scope.siteId) return false;
      if (scope.locationId && location.id !== scope.locationId && location.parentId !== scope.locationId) return false;
      if (scope.operationalFunctionId && !context.locationFunctionAssignments.some((item) => item.locationId === location.id && item.operationalFunctionId === scope.operationalFunctionId && assignmentIsEffective(item))) return false;
      if (scope.organizationId && !context.organizationLocationAssignments.some((item) => item.locationId === location.id && item.organizationId === scope.organizationId && organizationAssignmentIsEffective(item))) return false;
      return true;
    }
    if (config.kind === "processes") {
      const process = record as import("$lib/domain/operations").Process;
      if (scope.siteId && process.resolvedSiteId !== scope.siteId) return false;
      if (scope.locationId && process.primaryLocationId !== scope.locationId && !context.processLocationAssignments.some((item) => item.processId === process.id && item.locationId === scope.locationId)) return false;
      if (scope.operationalFunctionId && process.operationalFunctionId !== scope.operationalFunctionId) return false;
      return true;
    }
    if (config.kind === "tasks") {
      const task = record as import("$lib/domain/operations").Task;
      const process = context.processes.find((item) => item.id === task.processId);
      if (scope.siteId && task.resolvedSiteId !== scope.siteId) return false;
      if (scope.locationId && task.locationId !== scope.locationId) return false;
      if (scope.operationalFunctionId && process?.operationalFunctionId !== scope.operationalFunctionId) return false;
    }
    return true;
  }

  function scopedInitialValues(values: FoundationFormValues) {
    if (displayMode === "edit") return values;
    const next = { ...values };
    if (config.kind === "locations") next.parentId = $workspaceScope.locationId ?? $workspaceScope.siteId ?? next.parentId;
    if (config.kind === "processes") {
      next.siteId = $workspaceScope.siteId ?? next.siteId;
      next.primaryLocationId = $workspaceScope.locationId ?? $workspaceScope.siteId ?? next.primaryLocationId;
      next.operationalFunctionId = $workspaceScope.operationalFunctionId ?? next.operationalFunctionId;
    }
    if (config.kind === "tasks") {
      next.locationId = $workspaceScope.locationId ?? next.locationId;
      const candidates = context.processes.filter((item) => (!$workspaceScope.siteId || item.resolvedSiteId === $workspaceScope.siteId) && (!$workspaceScope.operationalFunctionId || item.operationalFunctionId === $workspaceScope.operationalFunctionId));
      if (candidates.length === 1) next.processId = candidates[0].id;
    }
    if (config.kind === "people") next.primarySiteId = $workspaceScope.siteId ?? next.primarySiteId;
    return next;
  }
</script>

{#if displayMode === "list"}
  <section class="page" aria-labelledby={`${config.kind}-title`}>
    <RegisterPageHeader
      breadcrumbs={config.breadcrumbs}
      title={config.title}
      titleId={`${config.kind}-title`}
      summary={config.summary}
      primaryActionLabel={config.newActionLabel}
      onPrimaryAction={() => void navigateTo(`${config.basePath}/new`)}
    />

    {#if config.kind === "locations" && !isLoading && !operationError}
      <div class="location-mode-switcher" role="group" aria-label="Location browsing mode"><button type="button" class:active={locationListMode === "explore"} aria-pressed={locationListMode === "explore"} onclick={() => (locationListMode = "explore")}><strong>Explore hierarchy</strong><span>Browse geography and physical layout</span></button><button type="button" class:active={locationListMode === "search"} aria-pressed={locationListMode === "search"} onclick={() => (locationListMode = "search")}><strong>Search and filter Locations</strong><span>Find a specific Location or group</span></button></div>
      {#if locationListMode === "explore"}
        <LocationHierarchyTree
          locations={exploreLocations}
          onOpen={(location) => void navigateTo(makeRecordPath(location))}
        />
      {:else}
      <section class="location-filters" aria-labelledby="location-filters-title">
        <div><h2 id="location-filters-title">Global Location filters</h2><button type="button" onclick={() => {
          locationCountryFilter = ""; locationStateFilter = ""; locationCountyFilter = ""; locationCityFilter = "";
          locationTypeFilter = ""; locationFunctionFilter = ""; locationOrganizationFilter = "";
        }}>Clear filters</button></div>
        <label>Country<select bind:value={locationCountryFilter}><option value="">All countries</option>{#each context.locations.filter((item) => item.nodeType === "Country") as item}<option value={item.id}>{item.name}</option>{/each}</select></label>
        <label>State or Province<select bind:value={locationStateFilter}><option value="">All states / provinces</option>{#each context.locations.filter((item) => item.nodeType === "StateOrProvince") as item}<option value={item.id}>{item.name}</option>{/each}</select></label>
        <label>County or District<select bind:value={locationCountyFilter}><option value="">All counties / districts</option>{#each context.locations.filter((item) => item.nodeType === "CountyOrDistrict") as item}<option value={item.id}>{item.name}</option>{/each}</select></label>
        <label>City or Municipality<select bind:value={locationCityFilter}><option value="">All cities / municipalities</option>{#each context.locations.filter((item) => item.nodeType === "CityOrMunicipality") as item}<option value={item.id}>{item.name}</option>{/each}</select></label>
        <label>Location type<select bind:value={locationTypeFilter}><option value="">All node types</option>{#each [...new Set(context.locations.map((item) => item.nodeType))].sort() as item}<option value={item}>{item}</option>{/each}</select></label>
        <label>Operational Function<select bind:value={locationFunctionFilter}><option value="">All Functions</option>{#each context.operationalFunctions.filter((item) => item.lifecycleStatus === "active") as item}<option value={item.id}>{item.name}</option>{/each}</select></label>
        <label>Organization<select bind:value={locationOrganizationFilter}><option value="">All Organizations</option>{#each context.organizations.filter((item) => item.lifecycleStatus === "active") as item}<option value={item.id}>{item.name}</option>{/each}</select></label>
      </section>
      {/if}
    {/if}

    {#if config.kind !== "locations" || locationListMode === "search"}
    <RegisterTable
      {records}
      {columns}
      recordLabel={config.recordLabel}
      pluralRecordLabel={config.pluralRecordLabel}
      actions={[{ label: "Edit", onSelect: (record) => void navigateTo(`${makeRecordPath(record)}/edit`) }]}
      onRowOpen={(record) => void navigateTo(makeRecordPath(record))}
      titleId={`${config.kind}-count`}
      searchPlaceholder={`Search ${config.pluralRecordLabel}`}
      statusFilterLabel="Workflow status"
      statusFilterOptions={[...FOUNDATION_STATUS_FILTERS]}
      statusAccessor={lifecycleStatus}
      extraFilterLabel="Site"
      extraFilterOptions={siteFilterOptions}
      extraFilterAccessor={(record) => config.siteFilterValues(record)}
      initialSortKey="name"
      loading={isLoading}
      loadingMessage={isInitializing ? "Initializing browser database." : `Loading ${config.pluralRecordLabel}.`}
      error={operationError}
      onRetry={() => void loadPage(displayMode, displayRecordId)}
      emptyMessage={config.emptyMessage}
      emptyActionLabel={config.newActionLabel}
      onEmptyAction={() => void navigateTo(`${config.basePath}/new`)}
    />
    {/if}
  </section>
{:else if isLoading}
  <section class="page" aria-labelledby={`${config.kind}-loading-title`}>
    <RegisterPageHeader breadcrumbs={config.breadcrumbs} title={config.title} titleId={`${config.kind}-loading-title`} summary={config.summary} />
    <RegisterState
      title={isInitializing ? "Initializing database" : "Loading record"}
      message={isInitializing ? "Preparing your local workspace." : `Loading ${config.recordLabel} and connected records.`}
      live
    />
  </section>
{:else if recordMissing}
  <RegisterRecordNotFound registerName={config.title} listPath={config.basePath} createPath={`${config.basePath}/new`} />
{:else if displayMode === "detail" && currentRecord}
  {#if operationError}<p class="error-message" role="alert">{operationError}</p>{/if}
  {#if services}
  <FoundationRecordWorkspace
    record={currentRecord}
    {context}
    {revisions}
    {services}
    onEdit={() => void navigateTo(`${makeRecordPath(currentRecord!)}/edit`)}
    onArchive={() => (pendingLifecycleAction = "archive")}
    onRestore={() => (pendingLifecycleAction = "restore")}
    onChanged={() => loadPage(displayMode, displayRecordId)}
  />
  {/if}
{:else}
  <section class="page" aria-labelledby={`${config.kind}-form-title`}>
    <RegisterPageHeader
      breadcrumbs={config.breadcrumbs}
      title={displayMode === "edit" && currentRecord ? `Edit ${config.titleOf(currentRecord)}` : config.newActionLabel}
      titleId={`${config.kind}-form-title`}
      summary={`Create or update this ${config.recordLabel} and its operating context.`}
    />
    {#if operationError}<p class="error-message" role="alert">{operationError}</p>{/if}
    {#key `${displayMode}-${displayRecordId}`}
      {#if displayMode === "new" && (config.kind === "processes" || config.kind === "tasks")}
      <GuidedFoundationForm
        kind={config.kind}
        title={config.newActionLabel}
        fields={(values) => config.fields(context, values, currentRecord)}
        initialValues={formInitialValues}
        onSave={saveRecord}
        onCancel={() => void navigateTo(config.basePath)}
        validate={config.validate}
        submitLabel={`Create ${config.recordLabel}`}
      />
      {:else}
      <RecordForm
        title={displayMode === "edit" && currentRecord ? `Edit ${config.titleOf(currentRecord)}` : config.newActionLabel}
        ariaLabel={`${config.recordType} form`}
        fields={(values) => config.fields(context, values, currentRecord)}
        initialValues={formInitialValues}
        onSave={saveRecord}
        onCancel={() => void navigateTo(currentRecord ? makeRecordPath(currentRecord) : config.basePath)}
        validate={config.validate}
        context={currentRecord ? `${currentRecord.businessId} · revision ${currentRecord.revision}` : "New typed record"}
        submitLabel={displayMode === "edit" ? "Save changes" : `Create ${config.recordLabel}`}
        validationSummary={`Fix the highlighted fields before saving the ${config.recordLabel}.`}
      />
      {/if}
    {/key}
  </section>
{/if}

{#if pendingLifecycleAction && currentRecord}
  <FoundationLifecycleDialog
    action={pendingLifecycleAction}
    recordTitle={config.titleOf(currentRecord)}
    onConfirm={confirmLifecycleAction}
    onCancel={() => (pendingLifecycleAction = null)}
  />
{/if}

<style>
  .location-filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; margin: 0 0 16px; padding: 14px; border: 1px solid var(--color-border); border-radius: var(--radius-surface); background: var(--color-surface); }
  .location-filters > div { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .location-filters h2 { margin: 0; font-size: 1rem; }
  .location-filters label { display: grid; gap: 5px; color: var(--color-muted); font-size: .72rem; font-weight: 720; }
  .location-filters select { border: 1px solid var(--color-field-border); border-radius: var(--radius-control); background: var(--color-field-bg); color: var(--color-text); padding: 8px 9px; }
  .location-mode-switcher { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-bottom: 15px; }
  .location-mode-switcher button { display: grid; gap: 2px; min-height: 58px; border: 1px solid var(--color-border); border-radius: var(--radius-surface); background: var(--color-surface); color: var(--color-text); padding: 10px 13px; text-align: left; }
  .location-mode-switcher button.active { border-color: var(--color-action); background: var(--color-accent-soft); color: var(--color-action); }
  .location-mode-switcher span { color: var(--color-muted); font-size: .75rem; font-weight: 500; }
  @media (max-width: 640px) { .location-mode-switcher { grid-template-columns: 1fr; } }
</style>
