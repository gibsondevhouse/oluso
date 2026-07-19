<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { foundationApplication, type FoundationServices } from "$lib/application/foundation";
  import FoundationLifecycleDialog from "$lib/components/foundation/FoundationLifecycleDialog.svelte";
  import LocationHierarchyTree from "$lib/components/foundation/LocationHierarchyTree.svelte";
  import LocationFunctionAssignmentPanel from "$lib/components/foundation/LocationFunctionAssignmentPanel.svelte";
  import ProcessLocationAssignmentPanel from "$lib/components/foundation/ProcessLocationAssignmentPanel.svelte";
  import {
    getFoundationUiConfig,
    type FoundationContext,
    type FoundationFormValues,
    type FoundationRecord,
  } from "$lib/components/foundation/foundation-ui";
  import RecordDetailLayout from "$lib/components/register/RecordDetailLayout.svelte";
  import RecordForm from "$lib/components/register/RecordForm.svelte";
  import RegisterPageHeader from "$lib/components/register/RegisterPageHeader.svelte";
  import RegisterState from "$lib/components/register/RegisterState.svelte";
  import RegisterTable from "$lib/components/register/RegisterTable.svelte";
  import type { RecordRevision } from "$lib/data/database";
  import { organizationAssignmentIsEffective } from "$lib/domain/enterprise";
  import { assignmentIsEffective } from "$lib/domain/operations";
  import type { FoundationRouteKind, AppRoute, RouteMode } from "$lib/navigation/route-registry";
  import { findRoute, isFoundationRouteKind } from "$lib/navigation/route-registry";
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
  let mounted = false;

  const routeKind = $derived(
    isFoundationRouteKind(route.kind) ? route.kind : "organizations" as FoundationRouteKind,
  );
  const config = $derived(getFoundationUiConfig(routeKind));
  const records = $derived(config.records(context).filter((record) => {
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
  const formInitialValues = $derived(config.initialValues(displayMode === "edit" ? currentRecord : null));
  const siteFilterOptions = $derived(
    context.locations
      .filter((location) => location.nodeType === "Site")
      .map((location) => ({ value: location.id, label: location.name })),
  );
  const detailSections = $derived(currentRecord ? [
    ...config.detailSections(currentRecord, context),
    ...(revisions.length > 0
      ? [{
          title: "Immutable revision history",
          fields: revisions.map((revision) => ({
            label: `Revision ${revision.revision} · ${revision.operation}`,
            value: `${new Date(revision.changedAt).toLocaleString()} · ${revision.changedBy}`,
          })),
        }]
      : []),
  ] : []);

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

    {#if !isLoading && !operationError}
      <p class="foundation-runtime-state" role="status">Offline-ready · Typed IndexedDB workflow</p>
    {/if}

    {#if config.kind === "locations" && !isLoading && !operationError}
      <LocationHierarchyTree
        locations={context.locations}
        onOpen={(location) => void navigateTo(makeRecordPath(location))}
      />
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
  </section>
{:else if isLoading}
  <section class="page" aria-labelledby={`${config.kind}-loading-title`}>
    <RegisterPageHeader breadcrumbs={config.breadcrumbs} title={config.title} titleId={`${config.kind}-loading-title`} summary={config.summary} />
    <RegisterState
      title={isInitializing ? "Initializing database" : "Loading record"}
      message={isInitializing ? "Preparing the typed IndexedDB application." : `Loading ${config.recordLabel} and revision context.`}
      live
    />
  </section>
{:else if recordMissing}
  <RegisterRecordNotFound registerName={config.title} recordId={displayRecordId} listPath={config.basePath} createPath={`${config.basePath}/new`} />
{:else if displayMode === "detail" && currentRecord}
  {#if operationError}<p class="error-message" role="alert">{operationError}</p>{/if}
  {#if config.kind === "locations" && services}
    <LocationFunctionAssignmentPanel
      location={currentRecord as import("$lib/domain/location").Location}
      functions={context.operationalFunctions}
      assignments={context.locationFunctionAssignments.filter((assignment) => assignment.locationId === currentRecord!.id)}
      {services}
      onChanged={() => loadPage(displayMode, displayRecordId)}
    />
  {/if}
  {#if config.kind === "processes" && services}
    <ProcessLocationAssignmentPanel
      process={currentRecord as import("$lib/domain/operations").Process}
      locations={context.locations}
      assignments={context.processLocationAssignments.filter((assignment) => assignment.processId === currentRecord!.id)}
      {services}
      onChanged={() => loadPage(displayMode, displayRecordId)}
    />
  {/if}
  <RecordDetailLayout
    breadcrumbs={config.breadcrumbs}
    title={config.titleOf(currentRecord)}
    summary={`${config.recordType} details, typed relationships, and immutable revision context.`}
    statusLabel={lifecycleStatus(currentRecord)}
    statusTone={currentRecord.lifecycleStatus === "archived" ? "inactive" : currentRecord.status}
    record={currentRecord}
    primarySections={detailSections}
    relationshipSections={config.relationshipSections(currentRecord, context)}
    backHref={config.basePath}
    onEdit={() => void navigateTo(`${makeRecordPath(currentRecord!)}/edit`)}
    onArchive={() => (pendingLifecycleAction = "archive")}
    onRestore={() => (pendingLifecycleAction = "restore")}
    onBack={() => void navigateTo(config.basePath)}
  />
{:else}
  <section class="page" aria-labelledby={`${config.kind}-form-title`}>
    <RegisterPageHeader
      breadcrumbs={config.breadcrumbs}
      title={displayMode === "edit" && currentRecord ? `Edit ${config.titleOf(currentRecord)}` : config.newActionLabel}
      titleId={`${config.kind}-form-title`}
      summary={`Create or update a validated ${config.recordLabel} in the typed IndexedDB workflow.`}
    />
    {#if operationError}<p class="error-message" role="alert">{operationError}</p>{/if}
    {#key `${displayMode}-${displayRecordId}`}
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
  .foundation-runtime-state {
    width: fit-content;
    margin: -4px 0 12px;
    border: 1px solid var(--color-positive-border);
    border-radius: 999px;
    background: var(--color-positive-soft);
    color: var(--color-positive-text);
    font-size: 0.75rem;
    font-weight: 720;
    padding: 5px 9px;
  }

  .location-filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; margin: 0 0 16px; padding: 14px; border: 1px solid var(--glass-border-subtle); border-radius: var(--radius-surface); background: rgba(10, 19, 21, .62); }
  .location-filters > div { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .location-filters h2 { margin: 0; font-size: 1rem; }
  .location-filters label { display: grid; gap: 5px; color: var(--color-muted); font-size: .72rem; font-weight: 720; }
  .location-filters select { border: 1px solid var(--glass-border-subtle); border-radius: var(--radius-control); background: rgba(5, 12, 14, .7); color: var(--color-text); padding: 8px 9px; }
</style>
