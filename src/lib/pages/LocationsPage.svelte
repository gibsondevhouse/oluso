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
    getPersistenceStatusLabel,
    locationRecords,
    persistenceDiagnostics,
  } from "$lib/persistence/local-persistence";
  import type {
    LocationInput,
    LocationRecord,
    LocationStatus,
    LocationType,
  } from "$lib/persistence/location.types";
  import {
    LOCATION_STATUSES,
    LOCATION_TYPES,
  } from "$lib/persistence/location.types";
  import { formatTimestamp } from "$lib/utils/date";

  type FormMode = "closed" | "create" | "edit";
  type FormValues = Record<string, string>;

  interface Props {
    autoInitialize?: boolean;
  }

  let { autoInitialize = true }: Props = $props();
  let formMode = $state<FormMode>("closed");
  let editingLocation = $state<LocationRecord | null>(null);
  let pageError = $state<string | null>(null);

  const statusLabel = $derived(getPersistenceStatusLabel($persistenceDiagnostics.status));
  const persistenceTone = $derived(
    $persistenceDiagnostics.status === "not_configured" ? "neutral" : $persistenceDiagnostics.status,
  );
  const initialFormValues = $derived(getInitialFormValues());

  const locationFields = [
    {
      name: "name",
      label: "Name",
      type: "text" as const,
      required: true,
      helperText: "Use the commonly recognized location name.",
    },
    {
      name: "type",
      label: "Type",
      type: "select" as const,
      required: true,
      helperText: "Choose the taxonomy value that best describes the location.",
      options: [
        { value: "", label: "Select type" },
        ...LOCATION_TYPES.map((type) => ({ value: type, label: type })),
      ],
    },
    {
      name: "status",
      label: "Status",
      type: "select" as const,
      required: true,
      options: LOCATION_STATUSES.map((status) => ({
        value: status,
        label: status === "active" ? "Active" : "Inactive",
      })),
    },
    {
      name: "description",
      label: "Description",
      type: "textarea" as const,
      helperText: "Optional operating context for the location.",
      rows: 4,
    },
  ];

  const locationColumns: RegisterTableColumn<LocationRecord>[] = [
    {
      key: "name",
      label: "Name",
      accessor: (location) => location.name,
      descriptionAccessor: (location) => location.description,
      primary: true,
      sortable: true,
    },
    {
      key: "type",
      label: "Type",
      accessor: (location) => location.type,
      sortable: true,
    },
    {
      key: "status",
      label: "Status",
      accessor: (location) => (location.status === "active" ? "Active" : "Inactive"),
      sortAccessor: (location) => location.status,
      toneAccessor: (location) => location.status,
      cellKind: "status",
      sortable: true,
    },
    {
      key: "updatedAt",
      label: "Updated",
      accessor: (location) => formatTimestamp(location.updatedAt),
      sortAccessor: (location) => location.updatedAt,
      sortable: true,
      searchable: false,
    },
  ];

  const locationActions: RegisterTableAction<LocationRecord>[] = [
    {
      label: "Edit",
      onSelect: startEdit,
    },
  ];

  const locationStatusOptions = LOCATION_STATUSES.map((status) => ({
    value: status,
    label: status === "active" ? "Active" : "Inactive",
  }));

  function getInitialFormValues(): FormValues {
    if (formMode === "edit" && editingLocation) {
      return {
        name: editingLocation.name,
        type: editingLocation.type,
        status: editingLocation.status,
        description: editingLocation.description,
      };
    }

    return {
      name: "",
      type: "",
      status: "active",
      description: "",
    };
  }

  function valuesToLocationInput(values: FormValues): LocationInput {
    return {
      name: values.name ?? "",
      type: (values.type ?? "") as LocationType,
      description: values.description ?? "",
      status: ((values.status as LocationStatus | undefined) ?? "active") as LocationStatus,
    };
  }

  function validateLocationValues(values: FormValues) {
    return olusoApplication.validateLocation(valuesToLocationInput(values)).errors;
  }

  async function initializeLocations() {
    pageError = null;

    try {
      if ($persistenceDiagnostics.status !== "ready") {
        await olusoApplication.initialize();
      } else {
        olusoApplication.listLocations();
      }
    } catch (error) {
      pageError = error instanceof Error ? error.message : String(error);
    }
  }

  function startCreate() {
    pageError = null;
    editingLocation = null;
    formMode = "create";
  }

  function startEdit(location: LocationRecord) {
    pageError = null;
    editingLocation = location;
    formMode = "edit";
  }

  function closeForm() {
    pageError = null;
    editingLocation = null;
    formMode = "closed";
  }

  function saveLocation(values: FormValues) {
    const input = valuesToLocationInput(values);

    if (formMode === "edit" && editingLocation) {
      olusoApplication.updateLocation(editingLocation.id, input);
    } else {
      olusoApplication.createLocation(input);
    }

    closeForm();
  }

  onMount(() => {
    if (autoInitialize) {
      void initializeLocations();
    }
  });
</script>

<section class="page" aria-labelledby="locations-title">
  <RegisterPageHeader
    breadcrumbs="Operations"
    title="Locations"
    titleId="locations-title"
    summary="Manage persisted operational locations used by HSE workflows."
    statusLabel={statusLabel}
    statusTone={persistenceTone}
    primaryActionLabel="Add location"
    onPrimaryAction={startCreate}
  />

  {#if pageError}
    <p class="error-message">{pageError}</p>
  {/if}

  {#if formMode !== "closed"}
    {#key `${formMode}-${editingLocation?.id ?? "new"}`}
      <RecordForm
        title={formMode === "edit" ? "Edit Location" : "Add Location"}
        ariaLabel={formMode === "edit" ? "Edit location" : "Add location"}
        context={editingLocation?.id}
        fields={locationFields}
        initialValues={initialFormValues}
        validate={validateLocationValues}
        validationSummary="Fix the highlighted fields before saving the location."
        submitLabel="Save location"
        cancelLabel="Cancel"
        onSave={saveLocation}
        onCancel={closeForm}
      />
    {/key}
  {/if}

  {#if $persistenceDiagnostics.status === "loading"}
    <RegisterState
      title="Loading locations"
      message="Initializing local persistence and reading the Locations register."
      live
    />
  {:else if $persistenceDiagnostics.status === "not_configured"}
    <RegisterState
      title="Persistence is not configured"
      message="Locations cannot be read or saved until local persistence initializes."
      secondaryActionLabel="Initialize persistence"
      onSecondaryAction={initializeLocations}
    />
  {:else if $persistenceDiagnostics.status === "error"}
    <RegisterState
      title="Locations could not load"
      message={$persistenceDiagnostics.lastError ?? "Local persistence reported an error."}
      secondaryActionLabel="Retry"
      onSecondaryAction={initializeLocations}
    />
  {:else}
    <RegisterTable
      titleId="location-count"
      records={$locationRecords}
      columns={locationColumns}
      actions={locationActions}
      recordLabel="location"
      pluralRecordLabel="locations"
      searchPlaceholder="Search locations"
      statusFilterLabel="Location status"
      statusFilterOptions={locationStatusOptions}
      statusAccessor={(location) => location.status}
      initialSortKey="name"
      emptyMessage="Add the first operational location to start using the Locations register."
      emptyActionLabel="Add new Location"
      onEmptyAction={startCreate}
    />
  {/if}
</section>
