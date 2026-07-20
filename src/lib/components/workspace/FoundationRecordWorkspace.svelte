<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { ArrowRight, Building2, Factory, FlaskConical, MapPin, Network, PackagePlus, Plus, UsersRound } from "lucide-svelte";
  import type { FoundationServices } from "$lib/application/foundation";
  import type { FoundationContext, FoundationRecord } from "$lib/components/foundation/foundation-ui";
  import LocationFunctionAssignmentPanel from "$lib/components/foundation/LocationFunctionAssignmentPanel.svelte";
  import ProcessLocationAssignmentPanel from "$lib/components/foundation/ProcessLocationAssignmentPanel.svelte";
  import type { RecordRevision } from "$lib/data/database";
  import { getBrowserDatabase } from "$lib/data/database";
  import { ChemicalUseRepository, SiteChemicalInventoryRepository } from "$lib/data/repositories/chemical";
  import type { ChemicalUse, SiteChemicalInventory } from "$lib/domain/chemical";
  import type { Location } from "$lib/domain/location";
  import type { Organization } from "$lib/domain/enterprise";
  import type { Person } from "$lib/domain/foundation";
  import { assignmentIsEffective, type Process, type Task } from "$lib/domain/operations";
  import { setWorkspaceScope } from "$lib/workspace/scope";
  import { rememberRecentRecord } from "$lib/workspace/recent-records";
  import CompletenessPanel, { type CompletenessRule } from "./CompletenessPanel.svelte";
  import ConnectedRecords, { type ConnectedRecord } from "./ConnectedRecords.svelte";
  import RecordWorkspace from "./RecordWorkspace.svelte";
  import RelationshipList, { type RelationshipItem } from "./RelationshipList.svelte";
  import ReviewPanel from "./ReviewPanel.svelte";
  import RevisionTimeline from "./RevisionTimeline.svelte";
  import SummaryCard from "./SummaryCard.svelte";
  import DataQualityBanner from "$lib/components/feedback/DataQualityBanner.svelte";

  interface Props {
    record: FoundationRecord;
    context: FoundationContext;
    revisions: RecordRevision<FoundationRecord>[];
    services: FoundationServices;
    onEdit: () => void;
    onArchive: () => void;
    onRestore: () => void;
    onChanged: () => void | Promise<void>;
  }
  let { record, context, revisions, services, onEdit, onArchive, onRestore, onChanged }: Props = $props();
  let activeTab = $state("overview");
  let inventory = $state<SiteChemicalInventory[]>([]);
  let chemicalUses = $state<ChemicalUse[]>([]);
  const location = $derived(isLocation(record) ? record : undefined);
  const process = $derived(isProcess(record) ? record : undefined);
  const task = $derived(isTask(record) ? record : undefined);
  const organization = $derived(isOrganization(record) ? record : undefined);
  const person = $derived(isPerson(record) ? record : undefined);
  const site = $derived(location?.nodeType === "Site" ? location : undefined);
  const resolvedSiteId = $derived(location ? (location.nodeType === "Site" ? location.id : location.resolvedSiteId) : process?.resolvedSiteId ?? task?.resolvedSiteId);
  const scopeLocationIds = $derived(location ? context.locations.filter((item) => item.id === location.id || (site && item.resolvedSiteId === site.id)).map((item) => item.id) : process ? context.processLocationAssignments.filter((item) => item.processId === process.id).map((item) => item.locationId) : task ? [task.locationId] : []);
  const scopedProcesses = $derived(location ? context.processes.filter((item) => scopeLocationIds.includes(item.primaryLocationId)) : process ? [process] : task ? context.processes.filter((item) => item.id === task.processId) : []);
  const scopedTasks = $derived(process ? context.tasks.filter((item) => item.processId === process.id) : location ? context.tasks.filter((item) => scopedProcesses.some((processItem) => processItem.id === item.processId)) : task ? [task] : []);
  const assignedFunctions = $derived(location ? context.operationalFunctions.filter((item) => context.locationFunctionAssignments.some((assignment) => scopeLocationIds.includes(assignment.locationId) && assignment.operationalFunctionId === item.id && assignmentIsEffective(assignment))) : process ? context.operationalFunctions.filter((item) => item.id === process.operationalFunctionId) : []);
  const siteInventory = $derived(inventory.filter((item) => (resolvedSiteId && item.siteId === resolvedSiteId) || scopeLocationIds.includes(item.storageLocationId)));
  const scopedUses = $derived(chemicalUses.filter((item) => process ? item.processId === process.id : task ? item.taskId === task.id : (resolvedSiteId && site ? item.siteId === resolvedSiteId : scopeLocationIds.includes(item.locationId))));
  const tabs = $derived(buildTabs());
  const title = $derived(recordTitle(record));
  const recordType = $derived(recordTypeLabel(record));
  const contextPath = $derived(buildContextPath());
  const completenessRules = $derived(buildCompleteness());
  const connectedRecords = $derived(buildConnectedRecords());

  $effect(() => { record.id; activeTab = "overview"; rememberRecentRecord({ path: recordHref(record), title, context: recordType }); });
  onMount(() => {
    let cancelled = false;
    void (async () => {
      try {
        const adapter = await getBrowserDatabase();
        const [nextInventory, nextUses] = await Promise.all([new SiteChemicalInventoryRepository(adapter.database).list({ includeArchived: true }), new ChemicalUseRepository(adapter.database).list({ includeArchived: true })]);
        if (!cancelled) [inventory, chemicalUses] = [nextInventory, nextUses];
      } catch {
        // Related chemical context is supplementary; the record workspace remains usable.
      }
    })();
    return () => { cancelled = true; };
  });
  function isLocation(value: FoundationRecord): value is Location { return "nodeType" in value; }
  function isProcess(value: FoundationRecord): value is Process { return "processType" in value; }
  function isTask(value: FoundationRecord): value is Task { return "taskType" in value; }
  function isOrganization(value: FoundationRecord): value is Organization { return "organizationType" in value; }
  function isPerson(value: FoundationRecord): value is Person { return "personType" in value; }
  function recordTitle(value: FoundationRecord) { return "displayName" in value ? value.displayName : value.name; }
  function recordTypeLabel(value: FoundationRecord) { if (isLocation(value)) return value.nodeType; if (isProcess(value)) return "Process"; if (isTask(value)) return "Task"; if (isOrganization(value)) return value.organizationType; return value.personType; }
  function recordHref(value: FoundationRecord) { if (isLocation(value)) return `/operations/locations/${value.id}`; if (isProcess(value)) return `/operations/processes/${value.id}`; if (isTask(value)) return `/operations/tasks/${value.id}`; if (isOrganization(value)) return `/people/organizations/${value.id}`; return `/people/workers/${value.id}`; }
  function locationPath(value: Location) { const path = [value]; const seen = new Set([value.id]); let parentId = value.parentId; while (parentId) { const parent = context.locations.find((item) => item.id === parentId); if (!parent || seen.has(parent.id)) break; path.unshift(parent); seen.add(parent.id); parentId = parent.parentId; } return path; }
  function buildContextPath() {
    if (location) return locationPath(location).map((item) => ({ label: item.name, href: item.id === location.id ? undefined : `/operations/locations/${item.id}` }));
    if (process) { const primary = context.locations.find((item) => item.id === process.primaryLocationId); const fn = context.operationalFunctions.find((item) => item.id === process.operationalFunctionId); return [{ label: primary ? context.locations.find((item) => item.id === primary.resolvedSiteId)?.name ?? primary.name : "Site", href: primary?.resolvedSiteId ? `/operations/locations/${primary.resolvedSiteId}` : undefined }, { label: fn?.name ?? "Function", href: fn ? `/enterprise/functions/${fn.id}` : undefined }, { label: process.name }]; }
    if (task) { const parent = context.processes.find((item) => item.id === task.processId); return [{ label: parent?.name ?? "Process", href: parent ? `/operations/processes/${parent.id}` : undefined }, { label: task.name }]; }
    if (organization) { const path = [organization]; let parentId = organization.parentOrganizationId; while (parentId) { const parent = context.organizations.find((item) => item.id === parentId); if (!parent) break; path.unshift(parent); parentId = parent.parentOrganizationId; } return path.map((item) => ({ label: item.name, href: item.id === organization.id ? undefined : `/people/organizations/${item.id}` })); }
    if (person) { const employer = context.organizations.find((item) => item.id === person.organizationId); return [{ label: employer?.name ?? "People", href: employer ? `/people/organizations/${employer.id}` : "/people/workers" }, { label: person.displayName }]; }
    return [];
  }
  function buildTabs() {
    if (site) return ["Overview", "Physical Layout", "Functions", "Processes & Tasks", "People & SEGs", "Chemicals", "Exposure", "Field Activity", "Actions", "History"].map(tab);
    if (location) return ["Overview", "Physical Layout", "Functions", "Processes", "Chemicals", "Exposure", "Field Activity", "Actions", "History"].map(tab);
    if (process) return ["Overview", "Locations", "Tasks", "Equipment", "Chemicals", "SEGs", "Exposure Scenarios", "Controls", "History"].map(tab);
    return ["Overview", "Connected Records", "History"].map(tab);
  }
  function tab(label: string) { return { id: label.toLowerCase().replaceAll(" & ", "-").replaceAll(" ", "-"), label }; }
  function buildCompleteness(): CompletenessRule[] {
    const common = [{ label: "Plain-language name", complete: Boolean(title) }, { label: "Business code", complete: Boolean(record.businessId) }, { label: "Current status", complete: Boolean(record.status) }];
    if (location) return [...common, { label: "Parent and ancestry", complete: location.nodeType === "Country" || Boolean(location.parentId) }, { label: "Resolved geographic context", complete: location.nodeType === "Country" || Boolean(location.resolvedCountryId) }, { label: "Operating Function assignment", complete: ["Country", "StateOrProvince", "CountyOrDistrict", "CityOrMunicipality"].includes(location.nodeType) || assignedFunctions.length > 0, guidance: "Assign at least one Function if work occurs at this Location." }];
    if (process) return [...common, { label: "Operational Function", complete: Boolean(process.operationalFunctionId) }, { label: "Primary Location", complete: Boolean(process.primaryLocationId) }, { label: "At least one Task", complete: scopedTasks.length > 0, guidance: "Document the work steps that make up this Process." }];
    if (task) return [...common, { label: "Parent Process", complete: Boolean(task.processId) }, { label: "Work Location", complete: Boolean(task.locationId) }, { label: "Routine classification", complete: task.routineClassification !== "Unknown", guidance: "Classify whether this work is normally routine or non-routine." }];
    if (organization) return [...common, { label: "Organization type", complete: Boolean(organization.organizationType) }, { label: "Operating Location", complete: context.organizationLocationAssignments.some((item) => item.organizationId === organization.id), guidance: "Connect this Organization to the places it operates or supports." }];
    if (person) return [...common, { label: "Person type", complete: Boolean(person.personType) }, { label: "Organization", complete: Boolean(person.organizationId) }, { label: "Primary Site", complete: Boolean(person.primarySiteId), guidance: "Select a primary Site when this person is site-based." }];
    return common;
  }
  function buildConnectedRecords(): ConnectedRecord[] {
    if (location) return [{ label: "Parent Location", value: context.locations.find((item) => item.id === location.parentId)?.name ?? "None", href: location.parentId ? `/operations/locations/${location.parentId}` : undefined }, { label: "Operational Functions", value: assignedFunctions.length, href: "#functions" }, { label: "Processes", value: scopedProcesses.length, href: "/operations/processes" }, { label: "Tasks", value: scopedTasks.length, href: "/operations/tasks" }, { label: "Chemical Inventory", value: siteInventory.length, href: "/master/inventory" }, { label: "Chemical Uses", value: scopedUses.length, href: "/master/chemical-uses" }, { label: "People / SEGs", value: context.people.filter((item) => item.primarySiteId === resolvedSiteId).length, href: "/people/workers" }, { label: "Exposure Scenarios", value: 0, href: "/exposure/scenarios" }, { label: "Findings", value: 0, href: "/field/findings", state: "No open findings" }, { label: "Corrective Actions", value: 0, href: "/actions/corrective-actions", state: "No overdue actions" }];
    if (process) return [{ label: "Operational Function", value: context.operationalFunctions.find((item) => item.id === process.operationalFunctionId)?.name ?? "Unknown", href: `/enterprise/functions/${process.operationalFunctionId}` }, { label: "Process Locations", value: context.processLocationAssignments.filter((item) => item.processId === process.id).length, href: "#locations" }, { label: "Tasks", value: scopedTasks.length, href: "#tasks" }, { label: "Chemical Uses", value: scopedUses.length, href: "/master/chemical-uses" }, { label: "SEGs", value: 0, href: "/hse/segs" }, { label: "Exposure Scenarios", value: 0, href: "/exposure/scenarios" }, { label: "Open Findings", value: 0, href: "/field/findings" }];
    if (organization) return [{ label: "Locations", value: context.organizationLocationAssignments.filter((item) => item.organizationId === organization.id).length, href: "/operations/locations" }, { label: "Function responsibilities", value: context.organizationFunctionResponsibilities.filter((item) => item.organizationId === organization.id).length, href: "/enterprise/functions" }, { label: "People", value: context.people.filter((item) => item.organizationId === organization.id).length, href: "/people/workers" }];
    return [];
  }
  function locationRelationships(): RelationshipItem[] { return context.locations.filter((item) => item.parentId === location?.id).map((item) => ({ id: item.id, name: item.name, type: item.nodeType, status: item.status, href: `/operations/locations/${item.id}` })); }
  function processRelationships(): RelationshipItem[] { return scopedProcesses.map((item) => ({ id: item.id, name: item.name, type: context.operationalFunctions.find((fn) => fn.id === item.operationalFunctionId)?.name, status: item.status, href: `/operations/processes/${item.id}` })); }
  function taskRelationships(): RelationshipItem[] { return scopedTasks.map((item) => ({ id: item.id, name: item.name, type: item.taskType, detail: item.routineClassification, status: item.status, href: `/operations/tasks/${item.id}` })); }
  function activateScope() { if (location) setWorkspaceScope({ countryId: location.resolvedCountryId ?? (location.nodeType === "Country" ? location.id : undefined), siteId: location.nodeType === "Site" ? location.id : location.resolvedSiteId ?? undefined, locationId: ["Site", "Country", "StateOrProvince", "CountyOrDistrict", "CityOrMunicipality"].includes(location.nodeType) ? undefined : location.id }); else if (process) setWorkspaceScope({ siteId: process.resolvedSiteId, locationId: process.primaryLocationId, operationalFunctionId: process.operationalFunctionId }); }
  async function scopedNavigate(path: string) { activateScope(); await goto(path); }
  function taskGroup(item: Task) { return item.routineClassification === "Normally Routine" ? "Routine Work" : item.routineClassification === "Emergency Only" ? "Emergency Work" : "Non-Routine Work"; }
</script>

<RecordWorkspace
  {title}
  {recordType}
  summary={record.description || `${recordType} operating context and connected HSE records.`}
  updatedAt={record.updatedAt}
  {contextPath}
  statuses={[
    { label: "Lifecycle", value: record.lifecycleStatus === "archived" ? "Archived" : record.status, tone: record.lifecycleStatus === "archived" || record.status === "Inactive" ? "neutral" : "positive" },
    { label: "Review", value: "Draft", tone: "warning" },
    { label: "Data quality", value: completenessRules.every((item) => item.complete) ? "Verified" : "Needs verification", tone: completenessRules.every((item) => item.complete) ? "positive" : "warning" },
    { label: "Sync / exchange", value: record.lastExchangePackageId ? "Exchanged" : "Local changes", tone: "information" },
  ]}
  actions={[{ label: "Edit", onSelect: onEdit, primary: true }, { label: "Add related record", onSelect: () => void scopedNavigate(location ? "/operations/processes/new" : process ? "/operations/tasks/new" : "/enterprise/navigator") }]}
  moreActions={record.lifecycleStatus === "archived" ? [{ label: "Restore", onSelect: onRestore }] : [{ label: "Archive…", onSelect: onArchive }]}
  {tabs}
  {activeTab}
  onTabChange={(id) => (activeTab = id)}
>
  {#if activeTab === "overview"}
    {#if site}
      <section class="site-actions" aria-label="Site actions"><button type="button" onclick={() => void scopedNavigate("/operations/locations/new")}><Plus size={17}/>Add Location</button><button type="button" onclick={() => (activeTab = "functions")}><Network size={17}/>Assign Function</button><button type="button" onclick={() => void scopedNavigate("/operations/processes/new")}><Factory size={17}/>Add Process</button><button type="button" onclick={() => void scopedNavigate("/master/inventory/new")}><PackagePlus size={17}/>Record Inventory</button><button type="button" onclick={() => void scopedNavigate("/master/chemical-uses/new")}><FlaskConical size={17}/>Document Chemical Use</button><button type="button" onclick={() => void scopedNavigate("/review/queue")}><ArrowRight size={17}/>Start Baseline</button></section>
      <div class="summary-grid"><SummaryCard label="Physical Locations" value={scopeLocationIds.length - 1} href="#physical-layout"/><SummaryCard label="Operational Functions" value={assignedFunctions.length} href="#functions"/><SummaryCard label="Processes" value={scopedProcesses.length} href="#processes-tasks"/><SummaryCard label="Chemical Products" value={new Set(siteInventory.map((item) => item.productId)).size} href="/master/inventory"/><SummaryCard label="SEGs" value={0} href="/hse/segs"/><SummaryCard label="Open Data Gaps" value={completenessRules.filter((item) => !item.complete).length} href="/reports/data-quality" tone="attention"/><SummaryCard label="Open Actions" value={0} href="/actions/corrective-actions"/></div>
    {:else if process}
      <section class="relationship-map"><h2>Operational chain</h2><div class="map-line"><div><span>Function</span><strong>{context.operationalFunctions.find((item) => item.id === process.operationalFunctionId)?.name ?? "Unknown"}</strong></div><ArrowRight size={18}/><div><span>Primary Location</span><strong>{context.locations.find((item) => item.id === process.primaryLocationId)?.name ?? "Unknown"}</strong></div></div>{#if context.processLocationAssignments.filter((item) => item.processId === process.id).length}<div class="process-path">{#each [...context.processLocationAssignments.filter((item) => item.processId === process.id)].sort((a,b) => (a.sequence ?? 999) - (b.sequence ?? 999)) as assignment}<span><small>{assignment.relationshipType}</small><strong>{context.locations.find((item) => item.id === assignment.locationId)?.name ?? "Unknown"}</strong></span>{/each}</div>{/if}</section>
    {/if}
    <DataQualityBanner state={completenessRules.every((item) => item.complete) ? "verified" : "needs-review"} message={completenessRules.every((item) => item.complete) ? "All explicit completeness checks pass." : `${completenessRules.filter((item) => !item.complete).length} explicit completeness check(s) need attention.`}/>
    <div class="overview-grid"><CompletenessPanel rules={completenessRules}/><ConnectedRecords records={connectedRecords}/></div>
    <ReviewPanel state="Draft" onSubmit={() => {}}/>
  {:else if (activeTab === "physical-layout" || activeTab === "connected-records") && location}
    <RelationshipList title="Child Locations" items={locationRelationships()} emptyMessage="This Location has no child Locations."/>
  {:else if activeTab === "functions" && location}
    <section id="functions"><h2 class="section-title">Functions at this Location</h2><RelationshipList title="Current assignments" items={context.locationFunctionAssignments.filter((item) => item.locationId === location.id).map((item) => ({ id: item.id, name: context.operationalFunctions.find((fn) => fn.id === item.operationalFunctionId)?.name ?? "Unknown Function", type: item.assignmentType, detail: item.scopeDescription || undefined, status: assignmentIsEffective(item) ? "Current" : "Ended", href: `/enterprise/functions/${item.operationalFunctionId}` }))} emptyMessage="No Functions are assigned here."/><LocationFunctionAssignmentPanel {location} functions={context.operationalFunctions} assignments={context.locationFunctionAssignments.filter((item) => item.locationId === location.id)} {services} onChanged={onChanged}/></section>
  {:else if (activeTab === "processes" || activeTab === "processes-tasks") && location}
    <RelationshipList title="Processes" items={processRelationships()} emptyMessage="No Processes are documented in this workspace."/>{#if activeTab === "processes-tasks"}<RelationshipList title="Tasks" items={taskRelationships()} emptyMessage="No Tasks are documented in this workspace."/>{/if}
  {:else if activeTab === "locations" && process}
    <ProcessLocationAssignmentPanel {process} locations={context.locations} assignments={context.processLocationAssignments.filter((item) => item.processId === process.id)} {services} onChanged={onChanged}/>
  {:else if activeTab === "tasks" && process}
    {#each ["Routine Work", "Non-Routine Work", "Emergency Work"] as group}<RelationshipList title={group} items={scopedTasks.filter((item) => taskGroup(item) === group).map((item) => ({ id: item.id, name: item.name, type: item.taskType, detail: item.routineClassification, href: `/operations/tasks/${item.id}` }))} emptyMessage={`No ${group.toLowerCase()} Tasks documented.`}/>{/each}
  {:else if activeTab === "chemicals"}
    <div class="split-lists"><RelationshipList title="Site Inventory" items={siteInventory.map((item) => ({ id: item.id, name: item.businessId, type: item.inventoryStatus, detail: `${item.observedQuantity ?? "Unknown"} ${item.quantityUnit ?? ""}`, href: `/master/inventory/${item.id}` }))} emptyMessage="No inventory records connect to this workspace."/><RelationshipList title="Chemical Uses" items={scopedUses.map((item) => ({ id: item.id, name: item.businessId, type: item.operatingCondition, detail: item.applicationMethod, href: `/master/chemical-uses/${item.id}` }))} emptyMessage="No Chemical Uses connect to this workspace."/></div>
  {:else if activeTab === "history"}
    <RevisionTimeline revisions={revisions.map((item) => ({ id: item.id, revision: item.revision, operation: item.operation, changedAt: item.changedAt, changedBy: item.changedBy }))}/>
  {:else}
    <section class="coming-context"><h2>{tabs.find((item) => item.id === activeTab)?.label}</h2><p>No connected records are currently documented for this section. The workspace keeps the relationship visible so missing context can be addressed.</p></section>
  {/if}
</RecordWorkspace>

<style>
  .site-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; margin-bottom: 16px; } .site-actions button { display: inline-flex; align-items: center; gap: 7px; min-height: 42px; border: 1px solid var(--color-border); border-radius: var(--radius-control); background: var(--color-surface); color: var(--color-text); font-size: .78rem; font-weight: 700; padding: 0 11px; } .site-actions button:first-child { border-color: var(--color-action); background: var(--color-action); color: white; } .site-actions button:hover { border-color: var(--color-action); }
  .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(145px, 1fr)); gap: 10px; margin-bottom: 16px; }
  .overview-grid { display: grid; grid-template-columns: minmax(260px, .8fr) minmax(300px, 1.2fr); gap: 14px; margin: 14px 0; }
  .relationship-map { display: grid; gap: 14px; margin-bottom: 15px; border: 1px solid var(--color-border); border-radius: var(--radius-surface); background: var(--color-surface); padding: 16px; } .relationship-map h2 { margin: 0; font-size: 1rem; } .map-line { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px; } .map-line div { display: grid; gap: 3px; border: 1px solid var(--color-border); border-radius: var(--radius-control); background: var(--color-surface-subtle); padding: 11px; } .map-line span, .process-path small { color: var(--color-muted); font-size: .6875rem; font-weight: 700; text-transform: uppercase; } .map-line strong, .process-path strong { font-size: .8125rem; } .map-line :global(svg) { color: var(--color-action); }
  .process-path { display: flex; align-items: stretch; gap: 20px; overflow-x: auto; } .process-path span { position: relative; display: grid; align-content: center; gap: 2px; min-width: 140px; border-left: 3px solid var(--color-action); background: var(--color-accent-soft); padding: 8px 10px; } .process-path span:not(:last-child)::after { position: absolute; top: 50%; left: calc(100% + 4px); width: 12px; color: var(--color-action); content: "→"; }
  .section-title { margin: 0 0 12px; font-size: 1.1rem; } #functions { display: grid; gap: 14px; } .split-lists { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
  .coming-context { border: 1px dashed var(--color-border-strong); border-radius: var(--radius-surface); background: var(--color-surface); padding: 24px; } .coming-context h2, .coming-context p { margin: 0; } .coming-context h2 { font-size: 1rem; } .coming-context p { margin-top: 6px; color: var(--color-muted); font-size: .875rem; }
  @media (max-width: 760px) { .overview-grid, .split-lists { grid-template-columns: 1fr; } .map-line { grid-template-columns: 1fr; } .map-line :global(svg) { transform: rotate(90deg); } }
</style>
