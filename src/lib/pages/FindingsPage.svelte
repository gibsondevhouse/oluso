<script lang="ts">
  import { onMount } from "svelte";
  import { olusoApplication } from "../../application/oluso-application";
  import RegisterPageHeader from "$lib/components/register/RegisterPageHeader.svelte";
  import RecordForm from "$lib/components/register/RecordForm.svelte";
  import RegisterState from "$lib/components/register/RegisterState.svelte";
  import RegisterTable from "$lib/components/register/RegisterTable.svelte";
  import type {
    RegisterTableAction,
    RegisterTableColumn,
  } from "$lib/components/register/register-table.types";
  import {
    findingRecords,
    getPersistenceStatusLabel,
    locationRecords,
    persistenceDiagnostics,
  } from "$lib/persistence/local-persistence";
  import type {
    FindingInput,
    FindingRecord,
    FindingSeverity,
    FindingStatus,
    FindingType,
  } from "$lib/persistence/finding.types";
  import {
    FINDING_TYPES,
    FINDING_SEVERITIES,
    FINDING_STATUSES,
    getFindingSeverityTone,
    getFindingStatusTone,
  } from "$lib/persistence/finding.types";
  import { formatTimestamp } from "$lib/utils/date";

  type FormMode = "closed" | "create" | "edit";
  type FormValues = Record<string, string>;

  interface Props {
    autoInitialize?: boolean;
  }

  let { autoInitialize = true }: Props = $props();
  let formMode = $state<FormMode>("closed");
  let editingFinding = $state<FindingRecord | null>(null);
  let pageError = $state<string | null>(null);

  const statusLabel = $derived(getPersistenceStatusLabel($persistenceDiagnostics.status));
  const persistenceTone = $derived(
    $persistenceDiagnostics.status === "not_configured" ? "neutral" : $persistenceDiagnostics.status,
  );
  const locationNameById = $derived(
    new Map($locationRecords.map((location) => [location.id, location.name])),
  );
  const findingFields = $derived(getFindingFields());
  const findingColumns = $derived(getFindingColumns());
  const initialFormValues = $derived(getInitialFormValues());

  const severityRank: Record<FindingSeverity, number> = {
    Low: 1,
    Medium: 2,
    High: 3,
    Critical: 4,
  };

  const findingActions: RegisterTableAction<FindingRecord>[] = [
    {
      label: "Edit",
      onSelect: startEdit,
    },
  ];

  const findingStatusOptions = FINDING_STATUSES.map((status) => ({
    value: status,
    label: status,
  }));

  function getFindingFields() {
    return [
      {
        name: "title",
        label: "Title",
        type: "text" as const,
        required: true,
        helperText: "Summarize the observation or issue.",
      },
      {
        name: "type",
        label: "Finding Type",
        type: "select" as const,
        required: true,
        helperText: "Classify the finding with a controlled type.",
        options: [
          { value: "", label: "Select finding type" },
          ...FINDING_TYPES.map((type) => ({ value: type, label: type })),
        ],
      },
      {
        name: "locationId",
        label: "Location",
        type: "select" as const,
        required: true,
        helperText: "Choose the affected operating location.",
        options: [
          { value: "", label: "Select location" },
          ...$locationRecords.map((location) => ({ value: location.id, label: location.name })),
        ],
      },
      {
        name: "severity",
        label: "Severity",
        type: "select" as const,
        required: true,
        helperText: "Set the highest credible consequence for prioritization.",
        options: [
          { value: "", label: "Select severity" },
          ...FINDING_SEVERITIES.map((severity) => ({ value: severity, label: severity })),
        ],
      },
      {
        name: "status",
        label: "Status",
        type: "select" as const,
        required: true,
        options: [
          { value: "", label: "Select status" },
          ...FINDING_STATUSES.map((status) => ({ value: status, label: status })),
        ],
      },
      {
        name: "reportedBy",
        label: "Reported by",
        type: "text" as const,
        helperText: "Optional person or team that reported the finding.",
      },
      {
        name: "description",
        label: "Description",
        type: "textarea" as const,
        helperText: "Add supporting detail, conditions observed, or immediate controls.",
        rows: 4,
      },
    ];
  }

  function getFindingColumns(): RegisterTableColumn<FindingRecord>[] {
    return [
      {
        key: "severity",
        label: "Severity",
        accessor: (finding) => finding.severity,
        sortAccessor: (finding) => severityRank[finding.severity],
        toneAccessor: (finding) => getFindingSeverityTone(finding.severity),
        cellKind: "status",
        sortable: true,
      },
      {
        key: "title",
        label: "Title",
        accessor: (finding) => finding.title,
        descriptionAccessor: (finding) => finding.description,
        primary: true,
        sortable: true,
      },
      {
        key: "location",
        label: "Location",
        accessor: (finding) => locationNameById.get(finding.locationId) ?? "Unknown location",
        sortable: true,
      },
      {
        key: "status",
        label: "Status",
        accessor: (finding) => finding.status,
        toneAccessor: (finding) => getFindingStatusTone(finding.status),
        cellKind: "status",
        sortable: true,
      },
      {
        key: "updatedAt",
        label: "Updated",
        accessor: (finding) => formatTimestamp(finding.updatedAt),
        sortAccessor: (finding) => finding.updatedAt,
        searchable: false,
        sortable: true,
      },
    ];
  }

  function getInitialFormValues(): FormValues {
    if (formMode === "edit" && editingFinding) {
      return {
        title: editingFinding.title,
        type: editingFinding.type,
        description: editingFinding.description,
        locationId: editingFinding.locationId,
        severity: editingFinding.severity,
        status: editingFinding.status,
        reportedBy: editingFinding.reportedBy,
      };
    }

    return {
      title: "",
      type: "Observation",
      description: "",
      locationId: $locationRecords[0]?.id ?? "",
      severity: "",
      status: "Open",
      reportedBy: "",
    };
  }

  function valuesToFindingInput(values: FormValues): FindingInput {
    return {
      title: values.title ?? "",
      type: ((values.type as FindingType | undefined) ?? "Observation") as FindingType,
      description: values.description ?? "",
      locationId: values.locationId ?? "",
      processId: "",
      hazardId: "",
      severity: (values.severity ?? "") as FindingSeverity,
      status: ((values.status as FindingStatus | undefined) ?? "Open") as FindingStatus,
      reportedBy: values.reportedBy ?? "",
    };
  }

  function validateFindingValues(values: FormValues) {
    return olusoApplication.validateFinding(valuesToFindingInput(values)).errors;
  }

  async function initializeFindings() {
    pageError = null;

    try {
      if ($persistenceDiagnostics.status !== "ready") {
        await olusoApplication.initialize();
      } else {
        olusoApplication.listLocations();
        olusoApplication.listFindings();
      }
    } catch (error) {
      pageError = error instanceof Error ? error.message : String(error);
    }
  }

  function startCreate() {
    pageError = null;
    editingFinding = null;
    formMode = "create";
  }

  function startEdit(finding: FindingRecord) {
    pageError = null;
    editingFinding = finding;
    formMode = "edit";
  }

  function closeForm() {
    pageError = null;
    editingFinding = null;
    formMode = "closed";
  }

  function saveFinding(values: FormValues) {
    const input = valuesToFindingInput(values);

    if (formMode === "edit" && editingFinding) {
      olusoApplication.updateFinding(editingFinding.id, input);
    } else {
      olusoApplication.createFinding(input);
    }

    closeForm();
  }

  onMount(() => {
    if (autoInitialize) {
      void initializeFindings();
    }
  });
</script>

<section class="page" aria-labelledby="findings-title">
  <RegisterPageHeader
    breadcrumbs="Field Work"
    title="Findings"
    titleId="findings-title"
    summary="Record and track HSE findings from observations, inspections, audits, and field work."
    statusLabel={statusLabel}
    statusTone={persistenceTone}
    primaryActionLabel="New Finding"
    onPrimaryAction={startCreate}
  />

  {#if pageError}
    <p class="error-message">{pageError}</p>
  {/if}

  {#if formMode !== "closed"}
    {#key `${formMode}-${editingFinding?.id ?? "new"}`}
      <RecordForm
        title={formMode === "edit" ? "Edit Finding" : "New Finding"}
        ariaLabel={formMode === "edit" ? "Edit finding" : "New finding"}
        context={editingFinding?.id}
        fields={findingFields}
        initialValues={initialFormValues}
        validate={validateFindingValues}
        validationSummary="Fix the highlighted fields before saving the finding."
        submitLabel="Save finding"
        cancelLabel="Cancel"
        onSave={saveFinding}
        onCancel={closeForm}
      />
    {/key}
  {/if}

  {#if $persistenceDiagnostics.status === "loading"}
    <RegisterState
      title="Loading findings"
      message="Initializing local persistence and reading the Findings register."
      live
    />
  {:else if $persistenceDiagnostics.status === "not_configured"}
    <RegisterState
      title="Persistence is not configured"
      message="Findings cannot be read or saved until local persistence initializes."
      secondaryActionLabel="Initialize persistence"
      onSecondaryAction={initializeFindings}
    />
  {:else if $persistenceDiagnostics.status === "error"}
    <RegisterState
      title="Findings could not load"
      message={$persistenceDiagnostics.lastError ?? "Local persistence reported an error."}
      secondaryActionLabel="Retry"
      onSecondaryAction={initializeFindings}
    />
  {:else}
    <RegisterTable
      titleId="finding-count"
      records={$findingRecords}
      columns={findingColumns}
      actions={findingActions}
      recordLabel="finding"
      pluralRecordLabel="findings"
      searchPlaceholder="Search findings"
      statusFilterLabel="Finding status"
      statusFilterOptions={findingStatusOptions}
      statusAccessor={(finding) => finding.status}
      initialSortKey="updatedAt"
      initialSortDirection="desc"
      emptyMessage="Findings capture field observations, audit issues, near misses, and other HSE work that may need follow-up."
      emptyActionLabel="Add new Finding"
      onEmptyAction={startCreate}
    />
  {/if}
</section>
