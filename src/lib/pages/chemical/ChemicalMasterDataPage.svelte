<script lang="ts">
  import { goto } from "$app/navigation";
  import { getBrowserDatabase, type RecordEnvelope, type RecordRevision } from "$lib/data/database";
  import { IndexedDbRecordRepository } from "$lib/data/repositories";
  import { ChemicalApplication } from "$lib/application/chemical";
  import {
    APPLICATION_METHODS, CHEMICAL_OPERATING_CONDITIONS, CHEMICAL_USE_FREQUENCIES,
    COMPONENT_ROLES, COMPOSITION_SOURCES, CONCENTRATION_UNITS, CONTAINER_TYPES,
    DURATION_UNITS, INVENTORY_INFORMATION_SOURCES, INVENTORY_STATUSES,
    PRODUCT_FORMULATION_TYPES, PRODUCT_PHYSICAL_STATES, QUANTITY_SCALES, QUANTITY_UNITS,
    SDS_REVIEW_STATUSES, SUBSTANCE_CLASSIFICATIONS, SUBSTANCE_PHYSICAL_FORMS,
    type ChemicalProduct, type ChemicalSubstance, type ChemicalUse, type DocumentReference,
    type ProductSubstance, type SdsRevision, type SiteChemicalInventory,
  } from "$lib/domain/chemical";
  import type { FoundationLocation } from "$lib/domain/foundation";
  import type { AppRoute } from "$lib/navigation/route-registry";
  import ConfirmationDialog from "$lib/components/feedback/ConfirmationDialog.svelte";
  import GuidedForm from "$lib/components/forms/GuidedForm.svelte";
  import FormStep from "$lib/components/forms/FormStep.svelte";
  import { workspaceScope } from "$lib/workspace/scope";

  interface Props { route: AppRoute }
  let { route }: Props = $props();

  interface NamedRecord extends RecordEnvelope { name?: string; title?: string; displayName?: string; productName?: string; status?: string }
  interface ProcessRecord extends NamedRecord { resolvedSiteId: string | null; locationId?: string }
  interface TaskRecord extends NamedRecord { processId: string; resolvedSiteId: string | null }

  let application = $state<ChemicalApplication | null>(null);
  let loading = $state(true);
  let saving = $state(false);
  let stateMessage = $state("Preparing workspace");
  let error = $state<string | null>(null);
  let loadedPath = $state("");
  let substances = $state<ChemicalSubstance[]>([]);
  let products = $state<ChemicalProduct[]>([]);
  let inventory = $state<SiteChemicalInventory[]>([]);
  let uses = $state<ChemicalUse[]>([]);
  let compositions = $state<ProductSubstance[]>([]);
  let sdsRevisions = $state<SdsRevision[]>([]);
  let documents = $state<DocumentReference[]>([]);
  let revisions = $state<RecordRevision[]>([]);
  let organizations = $state<NamedRecord[]>([]);
  let people = $state<NamedRecord[]>([]);
  let locations = $state<FoundationLocation[]>([]);
  let processes = $state<ProcessRecord[]>([]);
  let tasks = $state<TaskRecord[]>([]);

  let substanceForm = $state({ canonicalName: "", casNumber: "", classification: "Unknown", physicalForm: "Unknown", synonyms: "", description: "" });
  let productForm = $state({ productName: "", manufacturerOrganizationId: "", manufacturerUnknown: false, productCode: "", formulationType: "Unknown", physicalState: "Unknown", description: "" });
  let inventoryForm = $state({ productId: "", siteId: "", storageLocationId: "", observedQuantity: "", quantityUnit: "Pounds", maximumInventory: "", maximumInventoryUnit: "Pounds", containerType: "Unknown", containerCount: "", inventoryStatus: "Needs Verification", observationDate: "", informationSource: "Unknown", verifiedByPersonId: "", notes: "" });
  let useForm = $state({ productId: "", siteId: "", locationId: "", processId: "", taskId: "", operatingCondition: "Routine", frequency: "Unknown", duration: "", durationUnit: "Unknown", quantityScale: "Unknown", applicationMethod: "Unknown", deferredControlNotes: "", notes: "" });
  let sdsForm = $state({ revisionDate: "", revisionDateUnknown: false, effectiveDate: "", receivedDate: "", language: "English", jurisdiction: "United States", currentStatus: "Pending Review", reviewStatus: "Not Reviewed", reviewedByPersonId: "", reviewedAt: "", notes: "", documentTitle: "", externalPath: "", externalSystem: "OneDrive", availabilityStatus: "Needs Verification" });
  let compositionForm = $state({ substanceId: "", componentRole: "Unknown", minimumConcentration: "", maximumConcentration: "", concentrationUnit: "Not Disclosed", tradeSecret: false, compositionSource: "Unknown", notes: "" });
  let query = $state("");
  let lifecycleFilter = $state("active");
  let secondaryFilter = $state("all");
  let pendingArchive = $state<{ record: RecordEnvelope; type: "substance" | "product" | "inventory" | "use" } | null>(null);
  let inventoryStep = $state(0);
  const inventorySteps = [
    { id: "product-place", label: "Product and place", description: "Choose what is present and where" },
    { id: "quantity", label: "Quantity and container", description: "Describe the observed stock" },
    { id: "evidence", label: "Evidence", description: "Record source and verification" },
    { id: "review", label: "Review", description: "Confirm the inventory observation" },
  ];

  interface ChemicalWorkspaceSummary {
    question: string;
    answer: string;
    nextAction: string;
    history: string;
  }

  const entity = $derived(route.kind);
  const basePath = $derived(route.basePath ?? "/master/products");
  const currentSubstance = $derived(substances.find((record) => record.id === route.recordId));
  const currentProduct = $derived(products.find((record) => record.id === (route.parentRecordId ?? route.recordId)));
  const currentInventory = $derived(inventory.find((record) => record.id === route.recordId));
  const currentUse = $derived(uses.find((record) => record.id === route.recordId));
  const currentSds = $derived(sdsRevisions.find((record) => record.id === route.recordId));
  const sites = $derived(locations.filter((location) => location.nodeType === "Site" && location.lifecycleStatus === "active"));
  const storageOptions = $derived(locations.filter((location) => inventoryForm.siteId && (location.id === inventoryForm.siteId || location.resolvedSiteId === inventoryForm.siteId) && location.lifecycleStatus === "active"));
  const useLocationOptions = $derived(locations.filter((location) => useForm.siteId && (location.id === useForm.siteId || location.resolvedSiteId === useForm.siteId) && location.lifecycleStatus === "active"));
  const useProcessOptions = $derived(processes.filter((process) => process.resolvedSiteId === useForm.siteId && process.lifecycleStatus === "active"));
  const useTaskOptions = $derived(tasks.filter((task) => task.processId === useForm.processId && task.resolvedSiteId === useForm.siteId && task.lifecycleStatus === "active"));
  const normalizedQuery = $derived(query.trim().toLocaleLowerCase());
  const filteredSubstances = $derived(substances.filter((record) =>
    (lifecycleFilter === "all" || record.lifecycleStatus === lifecycleFilter) &&
    (secondaryFilter === "all" || (secondaryFilter === "has-cas" ? Boolean(record.casNumber) : !record.casNumber)) &&
    (!normalizedQuery || `${record.canonicalName} ${record.casNumber ?? ""} ${record.synonyms.join(" ")}`.toLocaleLowerCase().includes(normalizedQuery))
  ));
  const filteredProducts = $derived(products.filter((record) =>
    (lifecycleFilter === "all" || record.lifecycleStatus === lifecycleFilter) &&
    (!$workspaceScope.siteId || inventory.some((item) => item.productId === record.id && item.siteId === $workspaceScope.siteId) || uses.some((item) => item.productId === record.id && item.siteId === $workspaceScope.siteId)) &&
    (!$workspaceScope.operationalFunctionId || uses.some((item) => item.productId === record.id && item.operationalFunctionId === $workspaceScope.operationalFunctionId)) &&
    (secondaryFilter === "all" || (secondaryFilter === "missing-sds" ? !sdsRevisions.some((sds) => sds.productId === record.id && sds.currentStatus === "Current") : true)) &&
    (!normalizedQuery || `${record.productName} ${record.productCode ?? ""} ${record.formulationType}`.toLocaleLowerCase().includes(normalizedQuery))
  ));
  const filteredInventory = $derived(inventory.filter((record) =>
    (lifecycleFilter === "all" || record.lifecycleStatus === lifecycleFilter) &&
    (!$workspaceScope.siteId || record.siteId === $workspaceScope.siteId) &&
    (!$workspaceScope.locationId || record.storageLocationId === $workspaceScope.locationId) &&
    (secondaryFilter === "all" || record.inventoryStatus === secondaryFilter) &&
    (!normalizedQuery || `${productName(record.productId)} ${locationName(record.siteId)} ${locationName(record.storageLocationId)}`.toLocaleLowerCase().includes(normalizedQuery))
  ));
  const filteredUses = $derived(uses.filter((record) =>
    (lifecycleFilter === "all" || record.lifecycleStatus === lifecycleFilter) &&
    (!$workspaceScope.siteId || record.siteId === $workspaceScope.siteId) &&
    (!$workspaceScope.locationId || record.locationId === $workspaceScope.locationId) &&
    (!$workspaceScope.operationalFunctionId || record.operationalFunctionId === $workspaceScope.operationalFunctionId) &&
    (secondaryFilter === "all" || record.operatingCondition === secondaryFilter) &&
    (!normalizedQuery || `${productName(record.productId)} ${processName(record.processId)} ${taskName(record.taskId)}`.toLocaleLowerCase().includes(normalizedQuery))
  ));
  const workspaceSummary = $derived(chemicalWorkspaceSummary());

  function label(record: NamedRecord | undefined) { return record?.name ?? record?.title ?? record?.displayName ?? record?.productName ?? "Unknown"; }
  function productName(id: string) { return products.find((record) => record.id === id)?.productName ?? "Missing Product"; }
  function substanceName(id: string) { return substances.find((record) => record.id === id)?.canonicalName ?? "Missing Substance"; }
  function locationName(id: string) { return locations.find((record) => record.id === id)?.name ?? "Missing Location"; }
  function processName(id: string) { return label(processes.find((record) => record.id === id)); }
  function taskName(id?: string) { return id ? label(tasks.find((record) => record.id === id)) : "Not assigned"; }
  function organizationName(id?: string) { return id ? label(organizations.find((record) => record.id === id)) : "Unknown manufacturer"; }
  function history(recordType: string, id: string) { return revisions.filter((revision) => revision.recordType === recordType && revision.recordId === id).sort((left, right) => left.revision - right.revision); }
  function numberOrUndefined(value: string) { return value.trim() === "" ? undefined : Number(value); }

  async function typedList<T extends RecordEnvelope>(database: IDBDatabase, storeName: "organizations" | "people" | "locations" | "processes" | "tasks", recordType: string) {
    return new IndexedDbRecordRepository<T>(database, storeName, { recordType }).list({ includeArchived: true });
  }

  async function load() {
    const pathAtStart = route.path;
    if (loadedPath && loadedPath !== pathAtStart) {
      query = "";
      lifecycleFilter = "active";
      secondaryFilter = "all";
    }
    loading = true;
    error = null;
    stateMessage = "Loading chemical records";
    try {
      const adapter = await getBrowserDatabase();
      const app = new ChemicalApplication(adapter.database);
      application = app;
      [substances, products, inventory, uses, compositions, sdsRevisions, documents, revisions, organizations, people, locations, processes, tasks] = await Promise.all([
        app.repositories.substances.list({ includeArchived: true }),
        app.repositories.products.list({ includeArchived: true }),
        app.repositories.inventory.list({ includeArchived: true }),
        app.repositories.uses.list({ includeArchived: true }),
        app.repositories.composition.list({ includeArchived: true }),
        app.repositories.sds.list({ includeArchived: true }),
        app.repositories.documents.list({ includeArchived: true }),
        getAllRevisions(adapter.database),
        typedList<NamedRecord>(adapter.database, "organizations", "Organization"),
        typedList<NamedRecord>(adapter.database, "people", "Person"),
        typedList<FoundationLocation>(adapter.database, "locations", "Location"),
        typedList<ProcessRecord>(adapter.database, "processes", "Process"),
        typedList<TaskRecord>(adapter.database, "tasks", "Task"),
      ]);
      loadedPath = pathAtStart;
      initializeForms();
      stateMessage = "Offline ready";
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
      stateMessage = "Workspace unavailable";
    } finally {
      loading = false;
    }
  }

  async function getAllRevisions(database: IDBDatabase) {
    const transaction = database.transaction("record_revisions", "readonly");
    return new Promise<RecordRevision[]>((resolve, reject) => {
      const request = transaction.objectStore("record_revisions").getAll();
      request.onsuccess = () => resolve(request.result as RecordRevision[]);
      request.onerror = () => reject(request.error);
    });
  }

  function initializeForms() {
    if (route.mode === "new" && route.kind === "chemical-inventory") {
      inventoryForm.siteId = $workspaceScope.siteId ?? "";
      inventoryForm.storageLocationId = $workspaceScope.locationId ?? "";
    }
    if (route.mode === "edit" && currentSubstance) substanceForm = {
      canonicalName: currentSubstance.canonicalName, casNumber: currentSubstance.casNumber ?? "",
      classification: currentSubstance.substanceClassifications[0] ?? "Unknown", physicalForm: currentSubstance.physicalForm,
      synonyms: currentSubstance.synonyms.join(", "), description: currentSubstance.description,
    };
    if (route.mode === "edit" && currentProduct) productForm = {
      productName: currentProduct.productName, manufacturerOrganizationId: currentProduct.manufacturerOrganizationId ?? "",
      manufacturerUnknown: currentProduct.manufacturerUnknown, productCode: currentProduct.productCode ?? "",
      formulationType: currentProduct.formulationType, physicalState: currentProduct.physicalState, description: currentProduct.description,
    };
    if (route.mode === "edit" && currentInventory) inventoryForm = {
      productId: currentInventory.productId, siteId: currentInventory.siteId, storageLocationId: currentInventory.storageLocationId,
      observedQuantity: currentInventory.observedQuantity?.toString() ?? "", quantityUnit: currentInventory.quantityUnit ?? "Pounds",
      maximumInventory: currentInventory.maximumInventory?.toString() ?? "", maximumInventoryUnit: currentInventory.maximumInventoryUnit ?? "Pounds",
      containerType: currentInventory.containerType, containerCount: currentInventory.containerCount?.toString() ?? "",
      inventoryStatus: currentInventory.inventoryStatus, observationDate: currentInventory.observationDate ?? "",
      informationSource: currentInventory.informationSource, verifiedByPersonId: currentInventory.verifiedByPersonId ?? "", notes: currentInventory.notes,
    };
    if (route.mode === "edit" && currentUse) useForm = {
      productId: currentUse.productId, siteId: currentUse.siteId, locationId: currentUse.locationId,
      processId: currentUse.processId, taskId: currentUse.taskId ?? "", operatingCondition: currentUse.operatingCondition,
      frequency: currentUse.frequency, duration: currentUse.duration?.toString() ?? "", durationUnit: currentUse.durationUnit,
      quantityScale: currentUse.quantityScale, applicationMethod: currentUse.applicationMethod,
      deferredControlNotes: currentUse.deferredControlNotes, notes: currentUse.notes,
    };
    if (route.mode === "sds-edit" && currentSds) sdsForm = {
      revisionDate: currentSds.revisionDate ?? "", revisionDateUnknown: currentSds.revisionDateUnknown,
      effectiveDate: currentSds.effectiveDate ?? "", receivedDate: currentSds.receivedDate ?? "", language: currentSds.language,
      jurisdiction: currentSds.jurisdiction, currentStatus: currentSds.currentStatus, reviewStatus: currentSds.reviewStatus,
      reviewedByPersonId: currentSds.reviewedByPersonId ?? "", reviewedAt: currentSds.reviewedAt?.slice(0, 10) ?? "",
      notes: currentSds.notes, documentTitle: "", externalPath: "", externalSystem: "OneDrive", availabilityStatus: "Needs Verification",
    };
  }

  $effect(() => { if (route.path !== loadedPath) void load(); });

  async function save(event: SubmitEvent) {
    event.preventDefault();
    if (!application) return;
    saving = true; error = null; stateMessage = "Saving";
    try {
      let saved: RecordEnvelope;
      if (entity === "chemical-substances") {
        const input = { canonicalName: substanceForm.canonicalName, casNumber: substanceForm.casNumber,
          synonyms: substanceForm.synonyms.split(","), substanceClassifications: [substanceForm.classification] as ChemicalSubstance["substanceClassifications"],
          physicalForm: substanceForm.physicalForm as ChemicalSubstance["physicalForm"], description: substanceForm.description };
        saved = currentSubstance ? await application.substances.update(currentSubstance.id, input, currentSubstance.revision) : await application.substances.create(input);
      } else if (entity === "chemical-products" && !route.mode?.startsWith("sds")) {
        const input = { productName: productForm.productName, manufacturerOrganizationId: productForm.manufacturerOrganizationId,
          manufacturerUnknown: productForm.manufacturerUnknown, formulationType: productForm.formulationType as ChemicalProduct["formulationType"],
          physicalState: productForm.physicalState as ChemicalProduct["physicalState"], productCode: productForm.productCode, description: productForm.description };
        saved = currentProduct ? await application.products.update(currentProduct.id, input, currentProduct.revision) : await application.products.create(input);
      } else if (entity === "chemical-inventory") {
        const input = { ...inventoryForm, observedQuantity: numberOrUndefined(inventoryForm.observedQuantity), maximumInventory: numberOrUndefined(inventoryForm.maximumInventory),
          containerCount: numberOrUndefined(inventoryForm.containerCount), quantityUnit: inventoryForm.observedQuantity ? inventoryForm.quantityUnit as SiteChemicalInventory["quantityUnit"] : undefined,
          maximumInventoryUnit: inventoryForm.maximumInventory ? inventoryForm.maximumInventoryUnit as SiteChemicalInventory["maximumInventoryUnit"] : undefined,
          containerType: inventoryForm.containerType as SiteChemicalInventory["containerType"], inventoryStatus: inventoryForm.inventoryStatus as SiteChemicalInventory["inventoryStatus"],
          informationSource: inventoryForm.informationSource as SiteChemicalInventory["informationSource"] };
        saved = currentInventory ? await application.inventory.update(currentInventory.id, input, currentInventory.revision) : await application.inventory.create(input);
      } else if (entity === "chemical-uses") {
        const input = { ...useForm, taskId: useForm.taskId || undefined, duration: numberOrUndefined(useForm.duration),
          operatingCondition: useForm.operatingCondition as ChemicalUse["operatingCondition"], frequency: useForm.frequency as ChemicalUse["frequency"],
          durationUnit: useForm.durationUnit as ChemicalUse["durationUnit"], quantityScale: useForm.quantityScale as ChemicalUse["quantityScale"],
          applicationMethod: useForm.applicationMethod as ChemicalUse["applicationMethod"], status: "Active" as const };
        saved = currentUse ? await application.uses.update(currentUse.id, input, currentUse.revision) : await application.uses.create(input);
      } else {
        let documentReferenceId = currentSds?.documentReferenceId;
        if (sdsForm.documentTitle.trim()) {
          const document = await application.documents.create({ title: sdsForm.documentTitle, documentType: "Safety Data Sheet",
            externalPath: sdsForm.externalPath, externalSystem: sdsForm.externalSystem as DocumentReference["externalSystem"],
            availabilityStatus: sdsForm.availabilityStatus as DocumentReference["availabilityStatus"] });
          documentReferenceId = document.id;
        }
        const input = { productId: currentProduct!.id, revisionDate: sdsForm.revisionDate, revisionDateUnknown: sdsForm.revisionDateUnknown,
          effectiveDate: sdsForm.effectiveDate, receivedDate: sdsForm.receivedDate, language: sdsForm.language, jurisdiction: sdsForm.jurisdiction,
          documentReferenceId, currentStatus: sdsForm.currentStatus as SdsRevision["currentStatus"], reviewStatus: sdsForm.reviewStatus as SdsRevision["reviewStatus"],
          reviewedByPersonId: sdsForm.reviewedByPersonId || undefined, reviewedAt: sdsForm.reviewedAt || undefined, notes: sdsForm.notes };
        saved = currentSds ? await application.sds.updateRevision(currentSds.id, input, currentSds.revision) : await application.sds.addRevision(input);
      }
      stateMessage = "Saved";
      const target = route.mode?.startsWith("sds") ? `/master/products/${currentProduct!.id}/sds/${saved.id}` : `${basePath}/${saved.id}`;
      await goto(target);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
      stateMessage = error.includes("revision") ? "Record changed—reload and review" : "Needs review";
    } finally { saving = false; }
  }

  async function archiveOrRestore(record: RecordEnvelope, type: "substance" | "product" | "inventory" | "use") {
    if (!application) return;
    error = null;
    try {
      if (record.lifecycleStatus === "archived") {
        if (type === "substance") await application.substances.restore(record.id, record.revision);
        if (type === "product") await application.products.restore(record.id, record.revision);
        if (type === "inventory") await application.inventory.restore(record.id, record.revision);
        if (type === "use") await application.uses.restore(record.id, record.revision);
      } else { pendingArchive = { record, type }; return; }
      await load();
    } catch (cause) { error = cause instanceof Error ? cause.message : String(cause); }
  }

  async function confirmArchive(reason: string) {
    if (!application || !pendingArchive) return;
    const { record, type } = pendingArchive;
    try {
      if (type === "substance") await application.substances.archive(record.id, record.revision, reason);
      if (type === "product") await application.products.archive(record.id, record.revision, reason);
      if (type === "inventory") await application.inventory.archive(record.id, record.revision, reason);
      if (type === "use") await application.uses.archive(record.id, record.revision, reason);
      pendingArchive = null;
      await load();
    } catch (cause) { error = cause instanceof Error ? cause.message : String(cause); }
  }

  async function linkComposition(event: SubmitEvent) {
    event.preventDefault(); if (!application || !currentProduct) return;
    saving = true; error = null;
    try {
      await application.composition.linkSubstance({ productId: currentProduct.id, substanceId: compositionForm.substanceId,
        componentRole: compositionForm.componentRole as ProductSubstance["componentRole"], minimumConcentration: numberOrUndefined(compositionForm.minimumConcentration),
        maximumConcentration: numberOrUndefined(compositionForm.maximumConcentration), concentrationUnit: compositionForm.concentrationUnit as ProductSubstance["concentrationUnit"],
        tradeSecret: compositionForm.tradeSecret, compositionSource: compositionForm.compositionSource as ProductSubstance["compositionSource"], notes: compositionForm.notes });
      compositionForm.substanceId = ""; await load();
    } catch (cause) { error = cause instanceof Error ? cause.message : String(cause); } finally { saving = false; }
  }

  async function markCurrent(revision: SdsRevision) {
    if (!application) return;
    const current = sdsRevisions.find((candidate) => candidate.productId === revision.productId && candidate.language === revision.language && candidate.jurisdiction === revision.jurisdiction && candidate.currentStatus === "Current");
    try {
      await application.sds.markCurrent(revision.id, { [revision.id]: revision.revision, ...(current ? { [current.id]: current.revision } : {}) });
      await load();
    } catch (cause) { error = cause instanceof Error ? cause.message : String(cause); }
  }

  function clearInventoryRelationships() { inventoryForm.storageLocationId = ""; }
  function clearUseSiteRelationships() { useForm.locationId = ""; useForm.processId = ""; useForm.taskId = ""; }
  function clearUseTask() { useForm.taskId = ""; }

  function chemicalWorkspaceSummary(): ChemicalWorkspaceSummary | null {
    if (entity === "chemical-substances" && currentSubstance) {
      const linkedProducts = compositions.filter((item) => item.substanceId === currentSubstance.id).length;
      return {
        question: "Which Products use this Substance, and what identity gaps remain?",
        answer: `${currentSubstance.substanceClassifications.join(", ") || "Unclassified"}; ${linkedProducts} linked Product${linkedProducts === 1 ? "" : "s"}.`,
        nextAction: currentSubstance.casNumber ? "Review linked Products or update typed identity fields." : "Add or confirm CAS identity before relying on downstream Product relationships.",
        history: `Revision ${currentSubstance.revision}; actor ${currentSubstance.updatedBy}.`,
      };
    }

    if (entity === "chemical-products" && currentProduct && route.mode === "detail") {
      const currentSds = sdsRevisions.find((item) => item.productId === currentProduct.id && item.currentStatus === "Current");
      const inventoryCount = inventory.filter((item) => item.productId === currentProduct.id).length;
      const useCount = uses.filter((item) => item.productId === currentProduct.id).length;
      return {
        question: "Where and how is this Product used, and which SDS supports it?",
        answer: `${currentSds ? "Current SDS available" : "Missing current SDS"}; ${inventoryCount} inventory record${inventoryCount === 1 ? "" : "s"}; ${useCount} documented use${useCount === 1 ? "" : "s"}.`,
        nextAction: currentSds ? "Review composition, uses, and Site inventory context." : "Add or mark the current SDS before treating this Product as review-ready.",
        history: `Revision ${currentProduct.revision}; actor ${currentProduct.updatedBy}.`,
      };
    }

    if (route.mode === "sds-detail" && currentSds && currentProduct) {
      return {
        question: "Which Product and review state does this SDS revision support?",
        answer: `${currentProduct.productName}; ${currentSds.currentStatus}; ${currentSds.reviewStatus}.`,
        nextAction: currentSds.currentStatus === "Current" ? "Review Product use and inventory links." : "Mark current only after review confirms this SDS revision is the governing document.",
        history: `Revision ${currentSds.revision}; actor ${currentSds.updatedBy}.`,
      };
    }

    if (entity === "chemical-inventory" && currentInventory) {
      return {
        question: "Where is this Product present, and what was observed?",
        answer: `${productName(currentInventory.productId)} at ${locationName(currentInventory.siteId)}; ${currentInventory.inventoryStatus}.`,
        nextAction: "Use inventory as Product presence only; open Chemical Use to document operational use.",
        history: `Revision ${currentInventory.revision}; actor ${currentInventory.updatedBy}.`,
      };
    }

    if (entity === "chemical-uses" && currentUse) {
      return {
        question: "Where and how is this Product used, and what exposure context is still outside this record?",
        answer: `${productName(currentUse.productId)} in ${processName(currentUse.processId)}; ${currentUse.operatingCondition}; ${currentUse.frequency}.`,
        nextAction: "Review Site, Location, Process, Task, SDS, controls, and later exposure-scenario links.",
        history: `Revision ${currentUse.revision}; actor ${currentUse.updatedBy}.`,
      };
    }

    return null;
  }
</script>

<section class="chemical-page" aria-labelledby="chemical-title">
  <header class="chemical-header">
    <div><p class="eyebrow">Chemicals</p><h1 id="chemical-title">{route.title}</h1><p>{route.summary}</p></div>
    {#if route.mode === "list"}<a class="primary-action" href={`${basePath}/new`}>Create {entity === "chemical-substances" ? "Substance" : entity === "chemical-products" ? "Product" : entity === "chemical-inventory" ? "Inventory Record" : "Chemical Use"}</a>{/if}
  </header>
  <div class="state-line" role="status">{stateMessage}</div>
  {#if error}<div class="alert" role="alert">{error}</div>{/if}

  {#if !loading && workspaceSummary}
    <section class="chemical-workspace-summary" aria-label="Connected chemical workspace summary">
      <div><span>First question</span><strong>{workspaceSummary.question}</strong></div>
      <div><span>Answer</span><strong>{workspaceSummary.answer}</strong></div>
      <div><span>Next action</span><strong>{workspaceSummary.nextAction}</strong></div>
      <div><span>History source</span><strong>{workspaceSummary.history}</strong></div>
    </section>
  {/if}

  {#if loading}
    <div class="panel empty">Loading…</div>
  {:else if route.mode === "list"}
    <section class="filters" aria-label="Chemical list filters"><label>Search <input bind:value={query} placeholder="Search this register" /></label><label>Lifecycle <select bind:value={lifecycleFilter}><option value="active">Active</option><option value="archived">Archived</option><option value="all">All</option></select></label>
      {#if entity === "chemical-substances"}<label>CAS status <select bind:value={secondaryFilter}><option value="all">All</option><option value="has-cas">Has CAS number</option><option value="missing-cas">Missing CAS number</option></select></label>
      {:else if entity === "chemical-products"}<label>Data quality <select bind:value={secondaryFilter}><option value="all">All</option><option value="missing-sds">Missing current SDS</option></select></label>
      {:else if entity === "chemical-inventory"}<label>Inventory status <select bind:value={secondaryFilter}><option value="all">All</option>{#each INVENTORY_STATUSES as value}<option>{value}</option>{/each}</select></label>
      {:else}<label>Operating condition <select bind:value={secondaryFilter}><option value="all">All</option>{#each CHEMICAL_OPERATING_CONDITIONS as value}<option>{value}</option>{/each}</select></label>{/if}
    </section>
    <div class="panel table-wrap">
      {#if entity === "chemical-substances"}
        {#if filteredSubstances.length === 0}<p class="empty">No canonical Substances match these filters.</p>{:else}<table><thead><tr><th>Canonical Name</th><th>CAS Number</th><th>Classifications</th><th>Linked Products</th><th>Status</th><th>Last Updated</th></tr></thead><tbody>{#each filteredSubstances as record}<tr><td><a href={`${basePath}/${record.id}`}>{record.canonicalName}</a></td><td>{record.casNumber ?? "Missing CAS"}</td><td>{record.substanceClassifications.join(", ")}</td><td>{compositions.filter((item) => item.substanceId === record.id).length}</td><td>{record.lifecycleStatus}</td><td>{new Date(record.updatedAt).toLocaleDateString()}</td></tr>{/each}</tbody></table>{/if}
      {:else if entity === "chemical-products"}
        {#if filteredProducts.length === 0}<p class="empty">No canonical Products match these filters.</p>{:else}<table><thead><tr><th>Product Name</th><th>Manufacturer</th><th>Product Code</th><th>Formulation</th><th>Current SDS</th><th>Sites</th><th>Status</th></tr></thead><tbody>{#each filteredProducts as record}<tr><td><a href={`${basePath}/${record.id}`}>{record.productName}</a></td><td>{organizationName(record.manufacturerOrganizationId)}</td><td>{record.productCode ?? "—"}</td><td>{record.formulationType}</td><td>{sdsRevisions.some((sds) => sds.productId === record.id && sds.currentStatus === "Current") ? "Current SDS" : "Missing SDS"}</td><td>{new Set(inventory.filter((item) => item.productId === record.id).map((item) => item.siteId)).size}</td><td>{record.lifecycleStatus}</td></tr>{/each}</tbody></table>{/if}
      {:else if entity === "chemical-inventory"}
        {#if filteredInventory.length === 0}<p class="empty">No Site inventory observations match these filters.</p>{:else}<table><thead><tr><th>Product</th><th>Site</th><th>Storage Location</th><th>Observed Quantity</th><th>Maximum Inventory</th><th>Container</th><th>Observation Date</th><th>Status</th></tr></thead><tbody>{#each filteredInventory as record}<tr><td><a href={`${basePath}/${record.id}`}>{productName(record.productId)}</a></td><td>{locationName(record.siteId)}</td><td>{locationName(record.storageLocationId)}</td><td>{record.observedQuantity ?? "Unknown"} {record.quantityUnit ?? ""}</td><td>{record.maximumInventory ?? "Unknown"} {record.maximumInventoryUnit ?? ""}</td><td>{record.containerType}</td><td>{record.observationDate ?? "Not observed"}</td><td>{record.inventoryStatus}</td></tr>{/each}</tbody></table>{/if}
      {:else}
        {#if filteredUses.length === 0}<p class="empty">No documented Chemical Uses match these filters. Inventory does not imply use.</p>{:else}<table><thead><tr><th>Product</th><th>Site</th><th>Location</th><th>Process</th><th>Task</th><th>Operating Condition</th><th>Frequency</th><th>Status</th></tr></thead><tbody>{#each filteredUses as record}<tr><td><a href={`${basePath}/${record.id}`}>{productName(record.productId)}</a></td><td>{locationName(record.siteId)}</td><td>{locationName(record.locationId)}</td><td>{processName(record.processId)}</td><td>{taskName(record.taskId)}</td><td>{record.operatingCondition}</td><td>{record.frequency}</td><td>{record.lifecycleStatus}</td></tr>{/each}</tbody></table>{/if}
      {/if}
    </div>
  {:else if route.mode === "new" || route.mode === "edit" || route.mode === "sds-new" || route.mode === "sds-edit"}
    <form class="panel form" onsubmit={save}>
      {#if entity === "chemical-substances"}
        <label>Canonical name <input required bind:value={substanceForm.canonicalName} /></label><label>CAS number <input bind:value={substanceForm.casNumber} placeholder="1918-02-1" /></label>
        <label>Classification <select bind:value={substanceForm.classification}>{#each SUBSTANCE_CLASSIFICATIONS as value}<option>{value}</option>{/each}</select></label><label>Physical form <select bind:value={substanceForm.physicalForm}>{#each SUBSTANCE_PHYSICAL_FORMS as value}<option>{value}</option>{/each}</select></label>
        <label class="wide">Synonyms (comma separated) <input bind:value={substanceForm.synonyms} /></label><label class="wide">Description <textarea bind:value={substanceForm.description}></textarea></label>
      {:else if entity === "chemical-products" && !route.mode.startsWith("sds")}
        <label>Product name <input required bind:value={productForm.productName} /></label><label>Manufacturer <select bind:value={productForm.manufacturerOrganizationId} disabled={productForm.manufacturerUnknown}><option value="">Select Organization</option>{#each organizations.filter((r) => r.lifecycleStatus === "active") as record}<option value={record.id}>{label(record)}</option>{/each}</select></label>
        <label class="checkbox"><input type="checkbox" bind:checked={productForm.manufacturerUnknown} /> Manufacturer explicitly unknown</label><label>Product code <input bind:value={productForm.productCode} /></label>
        <label>Formulation <select bind:value={productForm.formulationType}>{#each PRODUCT_FORMULATION_TYPES as value}<option>{value}</option>{/each}</select></label><label>Physical state <select bind:value={productForm.physicalState}>{#each PRODUCT_PHYSICAL_STATES as value}<option>{value}</option>{/each}</select></label><label class="wide">Description <textarea bind:value={productForm.description}></textarea></label>
      {:else if entity === "chemical-inventory"}
        <div class="wide guided-inventory"><GuidedForm title={route.mode === "edit" ? "Update Site Inventory" : "Record Site Inventory"} steps={inventorySteps} activeIndex={inventoryStep} onStepSelect={(index) => (inventoryStep = index)}>
          {#if inventoryStep === 0}<FormStep title="What Product is present, and where?" prompt="Inventory documents presence at a specific storage Location. It does not imply use or exposure."><label>Product <select required bind:value={inventoryForm.productId}><option value="">Select Product</option>{#each products.filter((r) => r.lifecycleStatus === "active") as record}<option value={record.id}>{record.productName}</option>{/each}</select></label><label>Site <select required bind:value={inventoryForm.siteId} onchange={clearInventoryRelationships}><option value="">Select Site</option>{#each sites as site}<option value={site.id}>{site.name}</option>{/each}</select></label><label>Storage Location <select required bind:value={inventoryForm.storageLocationId}><option value="">Select Location</option>{#each storageOptions as location}<option value={location.id}>{location.name}</option>{/each}</select></label></FormStep>
          {:else if inventoryStep === 1}<FormStep title="What quantity and container were observed?" prompt="Use the best available information; unknown values can remain explicit."><div class="inventory-fields"><label>Observed quantity <input type="number" min="0" step="any" bind:value={inventoryForm.observedQuantity} /></label><label>Quantity unit <select bind:value={inventoryForm.quantityUnit}>{#each QUANTITY_UNITS as value}<option>{value}</option>{/each}</select></label><label>Maximum inventory <input type="number" min="0" step="any" bind:value={inventoryForm.maximumInventory} /></label><label>Maximum unit <select bind:value={inventoryForm.maximumInventoryUnit}>{#each QUANTITY_UNITS as value}<option>{value}</option>{/each}</select></label><label>Container type <select bind:value={inventoryForm.containerType}>{#each CONTAINER_TYPES as value}<option>{value}</option>{/each}</select></label><label>Container count <input type="number" min="0" bind:value={inventoryForm.containerCount} /></label></div></FormStep>
          {:else if inventoryStep === 2}<FormStep title="How was this inventory verified?" prompt="Document when the observation was made and the source used."><div class="inventory-fields"><label>Inventory status <select bind:value={inventoryForm.inventoryStatus}>{#each INVENTORY_STATUSES as value}<option>{value}</option>{/each}</select></label><label>Observation date <input type="date" bind:value={inventoryForm.observationDate} /></label><label>Information source <select bind:value={inventoryForm.informationSource}>{#each INVENTORY_INFORMATION_SOURCES as value}<option>{value}</option>{/each}</select></label><label>Verifier <select bind:value={inventoryForm.verifiedByPersonId}><option value="">Not verified</option>{#each people as person}<option value={person.id}>{label(person)}</option>{/each}</select></label></div></FormStep>
          {:else}<FormStep title="Review the inventory observation" prompt="Confirm the relationship before saving."><div class="inventory-review"><strong>{productName(inventoryForm.productId)}</strong><span>is present at {locationName(inventoryForm.storageLocationId)}, within {locationName(inventoryForm.siteId)}.</span><span>Observed: {inventoryForm.observedQuantity || "Unknown"} {inventoryForm.observedQuantity ? inventoryForm.quantityUnit : "quantity"} · {inventoryForm.containerCount || "Unknown"} {inventoryForm.containerType} containers</span><span>Status: {inventoryForm.inventoryStatus} · Source: {inventoryForm.informationSource}</span></div></FormStep>{/if}
          <div class="guided-actions"><a class="secondary-action" href={basePath}>Cancel</a>{#if inventoryStep > 0}<button type="button" class="secondary-action" onclick={() => (inventoryStep -= 1)}>Back</button>{/if}{#if inventoryStep < inventorySteps.length - 1}<button type="button" class="primary-action" disabled={inventoryStep === 0 && !(inventoryForm.productId && inventoryForm.siteId && inventoryForm.storageLocationId)} onclick={() => (inventoryStep += 1)}>Continue</button>{:else}<button class="primary-action" disabled={saving}>{saving ? "Saving…" : "Save inventory"}</button>{/if}</div>
        </GuidedForm></div>
      {:else if entity === "chemical-uses"}
        <label>Product <select required bind:value={useForm.productId}><option value="">Select Product</option>{#each products.filter((r) => r.lifecycleStatus === "active") as record}<option value={record.id}>{record.productName}</option>{/each}</select></label>
        <label>Site <select required bind:value={useForm.siteId} onchange={clearUseSiteRelationships}><option value="">Select Site</option>{#each sites as site}<option value={site.id}>{site.name}</option>{/each}</select></label>
        <label>Location <select required bind:value={useForm.locationId}><option value="">Select Location</option>{#each useLocationOptions as location}<option value={location.id}>{location.name}</option>{/each}</select></label>
        <label>Process <select required bind:value={useForm.processId} onchange={clearUseTask}><option value="">Select Process</option>{#each useProcessOptions as process}<option value={process.id}>{label(process)}</option>{/each}</select></label>
        <label>Task <select bind:value={useForm.taskId}><option value="">Not assigned</option>{#each useTaskOptions as task}<option value={task.id}>{label(task)}</option>{/each}</select></label>
        <label>Operating condition <select bind:value={useForm.operatingCondition}>{#each CHEMICAL_OPERATING_CONDITIONS as value}<option>{value}</option>{/each}</select></label><label>Frequency <select bind:value={useForm.frequency}>{#each CHEMICAL_USE_FREQUENCIES as value}<option>{value}</option>{/each}</select></label>
        <label>Duration <input type="number" min="0" step="any" bind:value={useForm.duration} /></label><label>Duration unit <select bind:value={useForm.durationUnit}>{#each DURATION_UNITS as value}<option>{value}</option>{/each}</select></label>
        <label>Quantity scale <select bind:value={useForm.quantityScale}>{#each QUANTITY_SCALES as value}<option>{value}</option>{/each}</select></label><label>Application method <select bind:value={useForm.applicationMethod}>{#each APPLICATION_METHODS as value}<option>{value}</option>{/each}</select></label>
        <label class="wide">Deferred control notes <textarea bind:value={useForm.deferredControlNotes}></textarea></label>
      {:else}
        <p class="wide context">Product: <strong>{currentProduct?.productName}</strong></p><label>Revision date <input type="date" bind:value={sdsForm.revisionDate} disabled={sdsForm.revisionDateUnknown} /></label><label class="checkbox"><input type="checkbox" bind:checked={sdsForm.revisionDateUnknown} /> Revision date explicitly unknown</label>
        <label>Effective date <input type="date" bind:value={sdsForm.effectiveDate} /></label><label>Received date <input type="date" bind:value={sdsForm.receivedDate} /></label><label>Language <input required bind:value={sdsForm.language} /></label><label>Jurisdiction <input required bind:value={sdsForm.jurisdiction} /></label>
        <label>Current status <select bind:value={sdsForm.currentStatus}><option>Pending Review</option><option>Current</option><option>Rejected</option><option>Unavailable</option></select></label><label>Review status <select bind:value={sdsForm.reviewStatus}>{#each SDS_REVIEW_STATUSES as value}<option>{value}</option>{/each}</select></label>
        <label>Reviewer <select bind:value={sdsForm.reviewedByPersonId}><option value="">Not assigned</option>{#each people as person}<option value={person.id}>{label(person)}</option>{/each}</select></label><label>Reviewed date <input type="date" bind:value={sdsForm.reviewedAt} /></label>
        <fieldset class="wide"><legend>External SDS document reference (optional)</legend><label>Document title <input bind:value={sdsForm.documentTitle} /></label><label>External path <input bind:value={sdsForm.externalPath} /></label></fieldset>
      {/if}
      {#if entity !== "chemical-inventory"}<div class="form-actions wide"><a class="secondary-action" href={route.mode.startsWith("sds") ? `/master/products/${currentProduct?.id}` : basePath}>Cancel</a><button class="primary-action" disabled={saving}>{saving ? "Saving…" : "Save"}</button></div>{/if}
    </form>
  {:else if entity === "chemical-substances" && currentSubstance}
    <div class="detail-grid"><section class="panel"><h2>{currentSubstance.canonicalName}</h2><dl><div><dt>CAS Number</dt><dd>{currentSubstance.casNumber ?? "Missing"}</dd></div><div><dt>Business ID</dt><dd>{currentSubstance.businessId}</dd></div><div><dt>Synonyms</dt><dd>{currentSubstance.synonyms.join(", ") || "None"}</dd></div><div><dt>Classifications</dt><dd>{currentSubstance.substanceClassifications.join(", ")}</dd></div><div><dt>Status</dt><dd>{currentSubstance.lifecycleStatus}</dd></div><div><dt>Actor / Origin installation</dt><dd>{currentSubstance.updatedBy} / {currentSubstance.originInstallationId}</dd></div></dl><div class="form-actions"><a class="secondary-action" href={`${basePath}/${currentSubstance.id}/edit`}>Edit</a><button class="secondary-action" onclick={() => archiveOrRestore(currentSubstance, "substance")}>{currentSubstance.lifecycleStatus === "archived" ? "Restore" : "Archive"}</button></div></section><section class="panel"><h2>Linked Products</h2>{#each compositions.filter((item) => item.substanceId === currentSubstance.id) as item}<a href={`/master/products/${item.productId}`}>{productName(item.productId)} — {item.componentRole}</a>{:else}<p>No linked Products.</p>{/each}<h2>Exposure Agents</h2><p>Typed boundary reserved for the next campaign. No exposure limit is stored here.</p><h2>Record History</h2>{#each history("ChemicalSubstance", currentSubstance.id) as item}<p class="history">Revision {item.revision} · {item.operation} · actor {item.changedBy} · installation {item.changedInstallationId ?? "legacy unknown"}</p>{/each}</section></div>
  {:else if entity === "chemical-products" && currentProduct && route.mode === "detail"}
    <div class="detail-grid"><section class="panel"><div class="detail-title"><div><h2>{currentProduct.productName}</h2><p>{organizationName(currentProduct.manufacturerOrganizationId)} · {currentProduct.formulationType}</p></div><span class="pill">{currentProduct.lifecycleStatus}</span></div><dl><div><dt>Product code</dt><dd>{currentProduct.productCode ?? "—"}</dd></div><div><dt>Physical state</dt><dd>{currentProduct.physicalState}</dd></div><div><dt>Business ID</dt><dd>{currentProduct.businessId}</dd></div><div><dt>Updated attribution</dt><dd>{currentProduct.updatedBy} / {currentProduct.originInstallationId}</dd></div></dl><div class="form-actions"><a class="secondary-action" href={`${basePath}/${currentProduct.id}/edit`}>Edit</a><button class="secondary-action" onclick={() => archiveOrRestore(currentProduct, "product")}>{currentProduct.lifecycleStatus === "archived" ? "Restore" : "Archive"}</button></div></section>
    <section class="panel wide-panel"><div class="section-heading"><h2>Composition</h2></div>{#each compositions.filter((item) => item.productId === currentProduct.id) as item}<div class="related-row"><a href={`/master/substances/${item.substanceId}`}>{substanceName(item.substanceId)}</a><span>{item.componentRole} · {item.minimumConcentration ?? "?"}–{item.maximumConcentration ?? "?"} {item.concentrationUnit}</span></div>{:else}<p>No composition documented.</p>{/each}<form class="inline-form" onsubmit={linkComposition}><select required bind:value={compositionForm.substanceId}><option value="">Link Substance…</option>{#each substances.filter((r) => r.lifecycleStatus === "active") as record}<option value={record.id}>{record.canonicalName}</option>{/each}</select><select bind:value={compositionForm.componentRole}>{#each COMPONENT_ROLES as value}<option>{value}</option>{/each}</select><select bind:value={compositionForm.compositionSource}>{#each COMPOSITION_SOURCES as value}<option>{value}</option>{/each}</select><button class="secondary-action">Link Substance</button></form></section>
    <section class="panel wide-panel"><div class="section-heading"><h2>SDS History</h2><a class="secondary-action" href={`/master/products/${currentProduct.id}/sds/new`}>Add SDS Revision</a></div>{#each sdsRevisions.filter((item) => item.productId === currentProduct.id) as item}<div class="related-row"><a href={`/master/products/${currentProduct.id}/sds/${item.id}`}>{item.revisionDate ?? "Date unknown"} · {item.language} / {item.jurisdiction}</a><span>{item.currentStatus} · {item.reviewStatus}</span>{#if item.currentStatus !== "Current"}<button class="text-action" onclick={() => markCurrent(item)}>Mark Current</button>{/if}</div>{:else}<p>Missing SDS — data-quality review required.</p>{/each}</section>
    <section class="panel"><h2>Site Inventory</h2>{#each inventory.filter((item) => item.productId === currentProduct.id) as item}<a href={`/master/inventory/${item.id}`}>{locationName(item.siteId)} / {locationName(item.storageLocationId)} — {item.observedQuantity ?? "Unknown"} {item.quantityUnit ?? ""}</a>{:else}<p>No Site inventory.</p>{/each}</section><section class="panel"><h2>Chemical Uses</h2>{#each uses.filter((item) => item.productId === currentProduct.id) as item}<a href={`/master/chemical-uses/${item.id}`}>{processName(item.processId)} / {taskName(item.taskId)} — {item.operatingCondition}</a>{:else}<p>No documented Chemical Use.</p>{/each}</section><section class="panel wide-panel"><h2>Record History</h2>{#each history("ChemicalProduct", currentProduct.id) as item}<p class="history">Revision {item.revision} · {item.operation} · {new Date(item.changedAt).toLocaleString()} · actor {item.changedBy} · installation {item.changedInstallationId ?? "legacy unknown"}</p>{/each}</section></div>
  {:else if route.mode === "sds-detail" && currentSds && currentProduct}
    <section class="panel detail-single"><div class="detail-title"><div><h2>SDS {currentSds.revisionDate ?? "date unknown"}</h2><p>{currentProduct.productName} · {currentSds.language} / {currentSds.jurisdiction}</p></div><span class="pill">{currentSds.currentStatus}</span></div><dl><div><dt>Review status</dt><dd>{currentSds.reviewStatus}</dd></div><div><dt>Effective date</dt><dd>{currentSds.effectiveDate ?? "Unknown"}</dd></div><div><dt>Received date</dt><dd>{currentSds.receivedDate ?? "Unknown"}</dd></div><div><dt>Document</dt><dd>{documents.find((doc) => doc.id === currentSds.documentReferenceId)?.title ?? "Missing document reference"}</dd></div><div><dt>History</dt><dd>Revision {currentSds.revision} · actor {currentSds.updatedBy} · installation {currentSds.originInstallationId}</dd></div></dl><div class="form-actions"><a class="secondary-action" href={`/master/products/${currentProduct.id}`}>Back to Product</a><a class="secondary-action" href={`/master/products/${currentProduct.id}/sds/${currentSds.id}/edit`}>Edit</a>{#if currentSds.currentStatus !== "Current"}<button class="primary-action" onclick={() => markCurrent(currentSds)}>Mark Current</button>{/if}</div></section>
  {:else if entity === "chemical-inventory" && currentInventory}
    <section class="panel detail-single"><div class="detail-title"><div><h2>{productName(currentInventory.productId)}</h2><p>{locationName(currentInventory.siteId)} / {locationName(currentInventory.storageLocationId)}</p></div><span class="pill">{currentInventory.inventoryStatus}</span></div><dl><div><dt>Observed</dt><dd>{currentInventory.observedQuantity ?? "Unknown"} {currentInventory.quantityUnit ?? ""}</dd></div><div><dt>Maximum</dt><dd>{currentInventory.maximumInventory ?? "Unknown"} {currentInventory.maximumInventoryUnit ?? ""}</dd></div><div><dt>Container</dt><dd>{currentInventory.containerCount ?? "?"} × {currentInventory.containerType}</dd></div><div><dt>Observation</dt><dd>{currentInventory.observationDate ?? "Not observed"} · {currentInventory.informationSource}</dd></div></dl><div class="form-actions"><a class="secondary-action" href={`${basePath}/${currentInventory.id}/edit`}>Edit</a><button class="secondary-action" onclick={() => archiveOrRestore(currentInventory, "inventory")}>{currentInventory.lifecycleStatus === "archived" ? "Restore" : "Archive"}</button></div><p class="boundary">Inventory records presence only. It is not evidence of operational use or exposure.</p>{#each history("SiteChemicalInventory", currentInventory.id) as item}<p class="history">Revision {item.revision} · {item.operation} · actor {item.changedBy} · installation {item.changedInstallationId ?? "legacy unknown"}</p>{/each}</section>
  {:else if entity === "chemical-uses" && currentUse}
    <section class="panel detail-single"><div class="detail-title"><div><h2>{productName(currentUse.productId)}</h2><p>{processName(currentUse.processId)} / {taskName(currentUse.taskId)}</p></div><span class="pill">{currentUse.operatingCondition}</span></div><dl><div><dt>Site / Location</dt><dd>{locationName(currentUse.siteId)} / {locationName(currentUse.locationId)}</dd></div><div><dt>Frequency</dt><dd>{currentUse.frequency}</dd></div><div><dt>Duration</dt><dd>{currentUse.duration ?? "Unknown"} {currentUse.durationUnit}</dd></div><div><dt>Quantity scale</dt><dd>{currentUse.quantityScale}</dd></div><div><dt>Application method</dt><dd>{currentUse.applicationMethod}</dd></div></dl><div class="form-actions"><a class="secondary-action" href={`${basePath}/${currentUse.id}/edit`}>Edit</a><button class="secondary-action" onclick={() => archiveOrRestore(currentUse, "use")}>{currentUse.lifecycleStatus === "archived" ? "Restore" : "Archive"}</button></div><p class="boundary">Chemical Use is scenario input only. It does not create SEG membership, sampling results, exposure limits, or a professional determination.</p>{#each history("ChemicalUse", currentUse.id) as item}<p class="history">Revision {item.revision} · {item.operation} · actor {item.changedBy} · installation {item.changedInstallationId ?? "legacy unknown"}</p>{/each}</section>
  {:else}
    <div class="panel empty" role="alert">Record not found or the relationship is missing.</div>
  {/if}
</section>

{#if pendingArchive}
  <ConfirmationDialog
    title="Archive this record?"
    consequence="The record will leave active workspaces. Existing relationships and revision history remain available."
    dependencyWarning="Review connected records before archiving; they are retained and may still require attention."
    confirmLabel="Archive record"
    reasonRequired
    destructive
    onConfirm={confirmArchive}
    onCancel={() => (pendingArchive = null)}
  />
{/if}

<style>
  .chemical-page { display: grid; gap: 16px; padding: 26px; }
  .chemical-header, .section-heading, .detail-title, .form-actions, .related-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
  .chemical-header h1, .chemical-header p, h2 { margin: 0; } .chemical-header > div > p:last-child { margin-top: 6px; color: var(--color-muted); }
  .eyebrow { color: var(--color-accent-strong) !important; font-size: .72rem; font-weight: 780; letter-spacing: .08em; text-transform: uppercase; }
  .state-line { color: var(--color-muted); font-size: .78rem; }
  .chemical-workspace-summary { display: grid; grid-template-columns: 1.2fr 1.2fr 1.4fr .9fr; gap: 1px; overflow: hidden; border: 1px solid var(--glass-border-subtle); border-radius: var(--radius-surface); background: var(--glass-border-subtle); }
  .chemical-workspace-summary div { display: grid; gap: 5px; min-width: 0; background: rgba(9,16,18,.76); padding: 12px; }
  .chemical-workspace-summary span { color: var(--color-accent-strong); font-size: .68rem; font-weight: 780; text-transform: uppercase; }
  .chemical-workspace-summary strong { color: var(--color-text); font-size: .82rem; line-height: 1.4; overflow-wrap: anywhere; }
  .filters { display: flex; gap: 12px; flex-wrap: wrap; align-items: end; } .filters label { min-width: 190px; }
  .panel { display: grid; gap: 16px; min-width: 0; border: 1px solid var(--color-border); border-radius: var(--radius-surface); background: var(--color-surface); padding: 20px; }
  .table-wrap { overflow-x: auto; } table { width: 100%; border-collapse: collapse; } th, td { border-bottom: 1px solid var(--glass-border-subtle); padding: 12px 10px; text-align: left; font-size: .84rem; white-space: nowrap; } th { color: var(--color-muted); font-size: .72rem; text-transform: uppercase; }
  a { color: var(--color-accent-strong); } .primary-action, .secondary-action { display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-control); padding: 9px 13px; font-size: .82rem; font-weight: 760; text-decoration: none; cursor: pointer; }
  .primary-action { border: 0; background: var(--color-action); color: #fff; } .secondary-action { border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text); }
  .form { grid-template-columns: repeat(2, minmax(0, 1fr)); max-width: 980px; } label, fieldset { display: grid; gap: 7px; color: var(--color-muted); font-size: .8rem; font-weight: 720; } .wide { grid-column: 1 / -1; }
  .guided-inventory { min-width: 0; } .inventory-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; } .inventory-review { display: grid; gap: 8px; border: 1px solid var(--color-border); border-radius: var(--radius-surface); background: var(--color-surface-subtle); padding: 16px; } .inventory-review span { color: var(--color-muted); font-size: .84rem; } .guided-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 22px; border-top: 1px solid var(--color-border); padding-top: 14px; }
  input, select, textarea { min-height: 40px; border: 1px solid var(--color-field-border); border-radius: var(--radius-control); background: var(--color-field-bg); color: var(--color-text); padding: 8px 10px; } textarea { min-height: 84px; resize: vertical; }
  .checkbox { display: flex; align-items: center; align-self: end; min-height: 40px; } .checkbox input { min-height: 0; }
  fieldset { grid-template-columns: 1fr 1fr; border: 1px solid var(--glass-border-subtle); border-radius: var(--radius-control); padding: 14px; } legend { padding: 0 6px; }
  .alert { border: 1px solid var(--color-danger-border); border-radius: var(--radius-control); background: var(--color-danger-soft); color: var(--color-danger-text); padding: 12px 14px; }
  .empty { color: var(--color-muted); } .detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; } .wide-panel { grid-column: 1 / -1; } .detail-single { max-width: 980px; }
  dl { display: grid; margin: 0; } dl div { display: grid; grid-template-columns: minmax(140px, .35fr) 1fr; gap: 15px; border-bottom: 1px solid var(--glass-border-subtle); padding: 10px 0; } dt { color: var(--color-muted); font-size: .78rem; font-weight: 740; } dd { margin: 0; }
  .pill { border: 1px solid var(--color-border); border-radius: 999px; color: var(--color-muted); padding: 6px 10px; font-size: .74rem; } .inline-form { display: grid; grid-template-columns: 1.2fr 1fr 1fr auto; gap: 8px; }
  .related-row { border-top: 1px solid var(--glass-border-subtle); padding-top: 12px; } .related-row span, .boundary, .context { color: var(--color-muted); font-size: .83rem; } .text-action { border: 0; background: none; color: var(--color-accent-strong); cursor: pointer; }
  .history { margin: 0; border-top: 1px solid var(--glass-border-subtle); color: var(--color-muted); font-size: .8rem; padding-top: 9px; }
  @media (max-width: 960px) { .chemical-workspace-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 760px) { .form, .detail-grid, .chemical-workspace-summary { grid-template-columns: 1fr; } .wide, .wide-panel { grid-column: auto; } .inline-form, fieldset, .inventory-fields { grid-template-columns: 1fr; } }
</style>
