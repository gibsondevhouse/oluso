<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import ArchiveConfirmationDialog from "$lib/components/register/ArchiveConfirmationDialog.svelte";
  import RegisterPageHeader from "$lib/components/register/RegisterPageHeader.svelte";
  import RegisterState from "$lib/components/register/RegisterState.svelte";
  import RegisterTable from "$lib/components/register/RegisterTable.svelte";
  import RecordDetailLayout from "$lib/components/register/RecordDetailLayout.svelte";
  import RecordForm from "$lib/components/register/RecordForm.svelte";
  import {
    getSiteFilterOptions,
    getSiteIdForLocation,
    getRegisterConfig,
    type RegisterContext,
    type MvpRegisterKind,
  } from "$lib/components/register/register-config";
  import { olusoApplication } from "../../application/oluso-application";
  import type { AppRoute, RouteMode } from "$lib/navigation/route-registry";
  import { findRoute, isRegisterRouteKind } from "$lib/navigation/route-registry";
  import {
    persistenceDiagnostics,
    type PersistedRegisterRecord,
  } from "$lib/persistence/local-persistence";
  import { CAMPAIGN_COLLECTION_NAMES } from "$lib/persistence/campaign-register.types";
  import { rememberRecentRecord } from "$lib/workspace/recent-records";
  import { workspaceScope } from "$lib/workspace/scope";
  import RegisterRecordNotFound from "./RegisterRecordNotFound.svelte";

  interface Props {
    route: AppRoute;
  }

  let { route }: Props = $props();

  let displayMode = $state<RouteMode>("list");
  let displayRecordId = $state("");
  let records = $state<PersistedRegisterRecord[]>([]);
  let currentRecord = $state<PersistedRegisterRecord | null>(null);
  let relationshipContext = $state<RegisterContext>(createEmptyRelationshipContext());
  let isLoading = $state(true);
  let recordMissing = $state(false);
  let operationError = $state<string | null>(null);
  let pendingLifecycleAction = $state<"archive" | "restore" | null>(null);
  let mounted = false;

  const registerKind = $derived(
    isRegisterRouteKind(route.kind) ? (route.kind as MvpRegisterKind) : "locations",
  );
  const config = $derived(getRegisterConfig(registerKind));
  const context = $derived(relationshipContext);
  const formContext = $derived(getActiveFormContext(context));
  const columns = $derived(config.columns(context));
  const fields = $derived(config.fields(formContext));
  const siteFilterOptions = $derived(getSiteFilterOptions(context));
  const modeTitle = $derived(getModeTitle());
  const formInitialValues = $derived(getFormInitialValues());
  const scopedRecords = $derived(records.filter(recordMatchesWorkspaceScope));
  const tableError = $derived(
    $persistenceDiagnostics.status === "error" ? $persistenceDiagnostics.lastError : operationError,
  );

  $effect(() => {
    const unsubscribe = config.store.subscribe((value) => {
      records = value as PersistedRegisterRecord[];
    });

    return unsubscribe;
  });

  $effect(() => {
    const nextMode = route.mode ?? "list";
    const nextRecordId = route.recordId ?? "";

    displayMode = nextMode;
    displayRecordId = nextRecordId;

    if (mounted) {
      queueMicrotask(() => {
        if (!mounted || displayMode !== nextMode || displayRecordId !== nextRecordId) {
          return;
        }

        void loadPageFor(nextMode, nextRecordId);
      });
    }
  });

  onMount(() => {
    mounted = true;
    const nextMode = route.mode ?? "list";
    const nextRecordId = route.recordId ?? "";
    displayMode = nextMode;
    displayRecordId = nextRecordId;
    void loadPageFor(nextMode, nextRecordId);

    return () => {
      mounted = false;
    };
  });

  function serializeError(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }

  function getModeTitle() {
    if (displayMode === "new") {
      return config.newActionLabel;
    }

    if (displayMode === "edit" && currentRecord) {
      return `Edit ${config.getRecordTitle(currentRecord)}`;
    }

    if (displayMode === "detail" && currentRecord) {
      return config.getRecordTitle(currentRecord);
    }

    return config.title;
  }

  function getRecordSummary() {
    if (displayMode === "detail") {
      return `${config.title} record details and lifecycle status.`;
    }

    if (displayMode === "edit") {
      return `Update this ${config.recordLabel} record and save validated changes.`;
    }

    if (displayMode === "new") {
      return `Create a validated ${config.recordLabel} record.`;
    }

    return config.summary;
  }

  function getFormInitialValues() {
    const values = config.getInitialValues(
      displayMode === "edit" ? currentRecord : null,
      formContext,
    );

    if (displayMode === "new") {
      if ("siteId" in values && !values.siteId && $workspaceScope.siteId) values.siteId = $workspaceScope.siteId;
      if ("locationId" in values && !values.locationId && $workspaceScope.locationId) values.locationId = $workspaceScope.locationId;
      if ("operationalFunctionId" in values && !values.operationalFunctionId && $workspaceScope.operationalFunctionId) values.operationalFunctionId = $workspaceScope.operationalFunctionId;
    }

    if (
      displayMode !== "new" ||
      config.kind !== "corrective-actions" ||
      typeof window === "undefined"
    ) {
      return values;
    }

    const params = new URLSearchParams(window.location.search);
    const sourceType = params.get("sourceType");
    const sourceId = params.get("sourceId")?.trim() ?? "";
    const sourceTitle = params.get("sourceTitle")?.trim() ?? "";
    const allowedSourceTypes = ["Finding", "Hazard", "Incident", "Compliance Item"];

    if (!sourceType || !sourceId || !allowedSourceTypes.includes(sourceType)) {
      return values;
    }

    return {
      ...values,
      sourceType,
      sourceId,
      title: sourceTitle ? `Address: ${sourceTitle}` : values.title,
    };
  }

  function recordMatchesWorkspaceScope(record: PersistedRegisterRecord) {
    const value = record as unknown as Record<string, unknown>;
    const selectedSite = $workspaceScope.siteId;
    const selectedLocation = $workspaceScope.locationId;
    const selectedFunction = $workspaceScope.operationalFunctionId;

    if (selectedSite) {
      const directSite = [value.siteId, value.resolvedSiteId, value.primarySiteId].filter(Boolean);
      const relatedSites = getRecordSiteFilterValues(record);
      if (directSite.length > 0 || relatedSites.length > 0) {
        if (![...directSite, ...relatedSites].includes(selectedSite)) return false;
      }
    }

    if (selectedLocation) {
      const locationValues = Object.entries(value)
        .filter(([key]) => key === "locationId" || key.endsWith("LocationId") || key.endsWith("LocationIds"))
        .flatMap(([, item]) => Array.isArray(item) ? item : [item])
        .filter((item): item is string => typeof item === "string" && Boolean(item));
      if (locationValues.length > 0 && !locationValues.includes(selectedLocation)) return false;
    }

    if (selectedFunction) {
      const functionValues = [value.operationalFunctionId, value.functionId].filter(
        (item): item is string => typeof item === "string" && Boolean(item),
      );
      if (functionValues.length > 0 && !functionValues.includes(selectedFunction)) return false;
    }

    return true;
  }

  function makeRecordPath(record: PersistedRegisterRecord) {
    return `${config.basePath}/${encodeURIComponent(record.id)}`;
  }

  function createEmptyRelationshipContext(): RegisterContext {
    return {
      locations: [],
      processes: [],
      equipment: [],
      exposureMonitoring: [],
      chemicals: [],
      hazards: [],
      controls: [],
      riskAssessments: [],
      segs: [],
      findings: [],
      correctiveActions: [],
      incidents: [],
      complianceItems: [],
      campaignRecords: Object.fromEntries(
        CAMPAIGN_COLLECTION_NAMES.map((collection) => [collection, []]),
      ) as unknown as RegisterContext["campaignRecords"],
    };
  }

  function getActiveFormContext(nextContext: RegisterContext): RegisterContext {
    const active = <TRecord extends { lifecycleStatus: string }>(records: TRecord[]) =>
      records.filter((record) => record.lifecycleStatus !== "archived");

    return {
      currentRecordId: currentRecord?.id ?? "",
      locations: active(nextContext.locations),
      processes: active(nextContext.processes),
      equipment: active(nextContext.equipment),
      exposureMonitoring: active(nextContext.exposureMonitoring),
      chemicals: active(nextContext.chemicals),
      hazards: active(nextContext.hazards),
      controls: active(nextContext.controls),
      riskAssessments: active(nextContext.riskAssessments),
      segs: active(nextContext.segs),
      findings: active(nextContext.findings),
      correctiveActions: active(nextContext.correctiveActions),
      incidents: active(nextContext.incidents),
      complianceItems: active(nextContext.complianceItems),
      campaignRecords: Object.fromEntries(
        CAMPAIGN_COLLECTION_NAMES.map((collection) => [
          collection,
          active(nextContext.campaignRecords[collection]),
        ]),
      ) as RegisterContext["campaignRecords"],
    };
  }

  function getRecordSiteFilterValues(record: PersistedRegisterRecord): string[] {
    const locationIds = config.siteFilterLocationIds?.(record, context) ?? [];

    return Array.from(
      new Set(
        locationIds
          .map((locationId) => getSiteIdForLocation(locationId, context.locations))
          .filter((siteId): siteId is string => Boolean(siteId)),
      ),
    );
  }

  function loadRelationshipContext(): RegisterContext {
    return {
      locations: olusoApplication.listRegisterRecords("locations", { includeArchived: true }) as RegisterContext["locations"],
      processes: olusoApplication.listRegisterRecords("processes", { includeArchived: true }) as RegisterContext["processes"],
      equipment: olusoApplication.listRegisterRecords("equipment", { includeArchived: true }) as RegisterContext["equipment"],
      exposureMonitoring: olusoApplication.listRegisterRecords("exposureMonitoring", { includeArchived: true }) as RegisterContext["exposureMonitoring"],
      chemicals: olusoApplication.listRegisterRecords("chemicals", { includeArchived: true }) as RegisterContext["chemicals"],
      hazards: olusoApplication.listRegisterRecords("hazards", { includeArchived: true }) as RegisterContext["hazards"],
      controls: olusoApplication.listRegisterRecords("controls", { includeArchived: true }) as RegisterContext["controls"],
      riskAssessments: olusoApplication.listRegisterRecords("riskAssessments", { includeArchived: true }) as RegisterContext["riskAssessments"],
      segs: olusoApplication.listRegisterRecords("segs", { includeArchived: true }) as RegisterContext["segs"],
      findings: olusoApplication.listRegisterRecords("findings", { includeArchived: true }) as RegisterContext["findings"],
      correctiveActions: olusoApplication.listRegisterRecords("correctiveActions", { includeArchived: true }) as RegisterContext["correctiveActions"],
      incidents: olusoApplication.listRegisterRecords("incidents", { includeArchived: true }) as RegisterContext["incidents"],
      complianceItems: olusoApplication.listRegisterRecords("complianceItems", { includeArchived: true }) as RegisterContext["complianceItems"],
      campaignRecords: Object.fromEntries(
        CAMPAIGN_COLLECTION_NAMES.map((collection) => [
          collection,
          olusoApplication.listRegisterRecords(collection, { includeArchived: true }),
        ]),
      ) as RegisterContext["campaignRecords"],
    };
  }

  async function loadPageFor(nextMode: RouteMode, nextRecordId: string) {
    isLoading = true;
    operationError = null;
    recordMissing = false;

    try {
      if ($persistenceDiagnostics.status !== "ready") {
        await olusoApplication.initialize();
      }

      config.load();
      relationshipContext = loadRelationshipContext();

      if ((nextMode === "detail" || nextMode === "edit") && nextRecordId) {
        const nextRecord = olusoApplication.getRecord(config.collection, nextRecordId);
        currentRecord = nextRecord;
        recordMissing = nextRecord === null;
        if (nextRecord) {
          rememberRecentRecord({
            path: makeRecordPath(nextRecord),
            title: config.getRecordTitle(nextRecord),
            context: config.title,
          });
        }
      } else {
        currentRecord = null;
      }
    } catch (error) {
      operationError = serializeError(error);
      currentRecord = null;
    } finally {
      isLoading = false;
    }
  }

  function setLocalRoute(path: string) {
    const nextRoute = findRoute(path);

    if (!nextRoute || nextRoute.kind !== route.kind) {
      return;
    }

    displayMode = nextRoute.mode ?? "list";
    displayRecordId = nextRoute.recordId ?? "";
    void loadPageFor(displayMode, displayRecordId);
  }

  async function navigateTo(path: string) {
    setLocalRoute(path);

    try {
      await goto(path);
    } catch {
      if (typeof window !== "undefined") {
        window.history.pushState({}, "", path);
      }
    }
  }

  async function saveRecord(values: Record<string, string>) {
    const savedRecord =
      displayMode === "edit" && currentRecord
        ? await config.update(currentRecord.id, values)
        : await config.create(values);

    currentRecord = savedRecord;
    config.load();
    relationshipContext = loadRelationshipContext();
    await navigateTo(makeRecordPath(savedRecord));
  }

  async function confirmLifecycleAction() {
    if (!currentRecord || !pendingLifecycleAction) {
      pendingLifecycleAction = null;
      return;
    }

    try {
      operationError = null;
      currentRecord =
        pendingLifecycleAction === "archive"
          ? await olusoApplication.archiveRecord(config.collection, currentRecord.id)
          : await olusoApplication.restoreRecord(config.collection, currentRecord.id);
      config.load();
      relationshipContext = loadRelationshipContext();
    } catch (error) {
      operationError = serializeError(error);
    } finally {
      pendingLifecycleAction = null;
    }
  }

  function editCurrentRecord() {
    if (!currentRecord) {
      return;
    }

    void navigateTo(`${makeRecordPath(currentRecord)}/edit`);
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

    <RegisterTable
      records={scopedRecords}
      {columns}
      recordLabel={config.recordLabel}
      pluralRecordLabel={config.pluralRecordLabel}
      actions={[
        {
          label: "Edit",
          onSelect: (record) => void navigateTo(`${makeRecordPath(record)}/edit`),
        },
      ]}
      onRowOpen={(record) => void navigateTo(makeRecordPath(record))}
      titleId={`${config.kind}-count`}
      searchPlaceholder={`Search ${config.pluralRecordLabel}`}
      statusFilterLabel={`${config.recordLabel.charAt(0).toUpperCase()}${config.recordLabel.slice(1)} status`}
      statusFilterOptions={config.statusOptions}
      statusAccessor={config.getStatusFilterValue}
      extraFilterLabel="Site / Plant"
      extraFilterOptions={siteFilterOptions}
      extraFilterAccessor={getRecordSiteFilterValues}
      initialSortKey={columns[0]?.key}
      loading={isLoading}
      loadingMessage={`Loading ${config.pluralRecordLabel}.`}
      error={tableError}
      onRetry={() => void loadPageFor(displayMode, displayRecordId)}
      emptyMessage={config.emptyMessage}
      emptyActionLabel={config.newActionLabel}
      onEmptyAction={() => void navigateTo(`${config.basePath}/new`)}
    />
  </section>
{:else if isLoading}
  <section class="page" aria-labelledby={`${config.kind}-loading-title`}>
    <RegisterPageHeader
      breadcrumbs={config.breadcrumbs}
      title={config.title}
      titleId={`${config.kind}-loading-title`}
      summary={config.summary}
    />
    <RegisterState title="Loading record" message={`Loading ${config.recordLabel} record.`} live />
  </section>
{:else if recordMissing}
  <RegisterRecordNotFound
    registerName={config.title}
    listPath={config.basePath}
    createPath={`${config.basePath}/new`}
  />
{:else if displayMode === "detail" && currentRecord}
  {#if operationError}
    <p class="error-message" role="alert">{operationError}</p>
  {/if}
  <RecordDetailLayout
    breadcrumbs={config.breadcrumbs}
    title={modeTitle}
    summary={getRecordSummary()}
    statusLabel={config.getStatusLabel(currentRecord)}
    record={currentRecord}
    primarySections={config.detailSections(currentRecord, context)}
    relatedSections={config.relatedSections?.(currentRecord, context)}
    relationshipSections={config.relationshipSections?.(currentRecord, context)}
    additionalActions={config.detailActions?.(currentRecord, context)}
    backHref={config.basePath}
    onEdit={editCurrentRecord}
    onArchive={() => (pendingLifecycleAction = "archive")}
    onRestore={() => (pendingLifecycleAction = "restore")}
    onBack={() => void navigateTo(config.basePath)}
  />
{:else}
  <section class="page" aria-labelledby={`${config.kind}-form-title`}>
    <RegisterPageHeader
      breadcrumbs={config.breadcrumbs}
      title={config.title}
      titleId={`${config.kind}-form-title`}
      summary={getRecordSummary()}
    />

    {#key `${displayMode}-${displayRecordId}-${formInitialValues.sourceId ?? ""}`}
      <RecordForm
        title={modeTitle}
        ariaLabel={modeTitle}
        {fields}
        initialValues={formInitialValues}
        onSave={saveRecord}
        onCancel={() =>
          void navigateTo(currentRecord ? makeRecordPath(currentRecord) : config.basePath)}
        validate={config.validate}
        submitLabel={config.saveLabel}
        validationSummary={`Fix the highlighted fields before saving the ${config.recordLabel}.`}
      />
    {/key}
  </section>
{/if}

{#if pendingLifecycleAction && currentRecord}
  <ArchiveConfirmationDialog
    action={pendingLifecycleAction}
    recordTitle={config.getRecordTitle(currentRecord)}
    onConfirm={confirmLifecycleAction}
    onCancel={() => (pendingLifecycleAction = null)}
  />
{/if}
