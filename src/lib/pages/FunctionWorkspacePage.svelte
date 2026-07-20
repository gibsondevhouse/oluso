<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { Factory, MapPin, Network, Search, Workflow } from "lucide-svelte";
  import { foundationApplication } from "$lib/application/foundation";
  import EmptyState from "$lib/components/feedback/EmptyState.svelte";
  import ErrorState from "$lib/components/feedback/ErrorState.svelte";
  import CompletenessPanel from "$lib/components/workspace/CompletenessPanel.svelte";
  import ConnectedRecords from "$lib/components/workspace/ConnectedRecords.svelte";
  import RecordWorkspace from "$lib/components/workspace/RecordWorkspace.svelte";
  import RelationshipList from "$lib/components/workspace/RelationshipList.svelte";
  import RevisionTimeline from "$lib/components/workspace/RevisionTimeline.svelte";
  import SummaryCard from "$lib/components/workspace/SummaryCard.svelte";
  import type { RecordRevision } from "$lib/data/database";
  import { getBrowserDatabase } from "$lib/data/database";
  import { ChemicalUseRepository } from "$lib/data/repositories/chemical";
  import type { ChemicalUse } from "$lib/domain/chemical";
  import type { OrganizationFunctionResponsibility } from "$lib/domain/enterprise";
  import { organizationAssignmentIsEffective } from "$lib/domain/enterprise";
  import type { Location } from "$lib/domain/location";
  import { assignmentIsEffective, type LocationFunctionAssignment, type OperationalFunction, type Process, type Task } from "$lib/domain/operations";
  import type { AppRoute } from "$lib/navigation/route-registry";
  import { workspaceScope, setWorkspaceScope } from "$lib/workspace/scope";
  import { rememberRecentRecord } from "$lib/workspace/recent-records";

  interface Props { route: AppRoute; }
  let { route }: Props = $props();
  let functions = $state<OperationalFunction[]>([]);
  let locations = $state<Location[]>([]);
  let assignments = $state<LocationFunctionAssignment[]>([]);
  let responsibilities = $state<OrganizationFunctionResponsibility[]>([]);
  let processes = $state<Process[]>([]);
  let tasks = $state<Task[]>([]);
  let chemicalUses = $state<ChemicalUse[]>([]);
  let revisions = $state<RecordRevision<OperationalFunction>[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let query = $state("");
  let activeTab = $state("overview");
  const selected = $derived(route.recordId ? functions.find((item) => item.id === route.recordId) : undefined);
  const filteredFunctions = $derived(functions.filter((item) => item.lifecycleStatus === "active" && (!$workspaceScope.operationalFunctionId || item.id === $workspaceScope.operationalFunctionId) && `${item.name} ${item.functionCategory} ${item.businessId}`.toLowerCase().includes(query.toLowerCase())));
  const selectedAssignments = $derived(selected ? assignments.filter((item) => item.operationalFunctionId === selected.id && assignmentIsEffective(item)) : []);
  const selectedProcesses = $derived(selected ? processes.filter((item) => item.operationalFunctionId === selected.id) : []);
  const selectedTasks = $derived(tasks.filter((item) => selectedProcesses.some((process) => process.id === item.processId)));
  const selectedUses = $derived(selected ? chemicalUses.filter((item) => item.operationalFunctionId === selected.id) : []);
  const selectedLocations = $derived(selectedAssignments.map((item) => locations.find((location) => location.id === item.locationId)).filter((item): item is Location => Boolean(item)));
  const sites = $derived([...new Set(selectedLocations.map((item) => item.nodeType === "Site" ? item.id : item.resolvedSiteId).filter((item): item is string => Boolean(item)))].map((id) => locations.find((item) => item.id === id)).filter((item): item is Location => Boolean(item)));

  onMount(() => { void load(); });
  $effect(() => { if (selected) { rememberRecentRecord({ path: `/enterprise/functions/${selected.id}`, title: selected.name, context: "Operational Function" }); void loadRevisions(selected); } });

  async function load() {
    loading = true; error = null;
    try {
      const [services, adapter] = await Promise.all([foundationApplication.services(), getBrowserDatabase()]);
      [functions, locations, assignments, responsibilities, processes, tasks, chemicalUses] = await Promise.all([services.operationalFunctions.list(true), services.locations.list(true), services.locationFunctionAssignments.list(true), services.organizationFunctionResponsibilities.list(true), services.processes.list(true), services.tasks.list(true), new ChemicalUseRepository(adapter.database).list({ includeArchived: true })]);
    } catch (cause) { error = cause instanceof Error ? cause.message : String(cause); }
    finally { loading = false; }
  }
  async function loadRevisions(value: OperationalFunction) { revisions = await foundationApplication.revisionHistory<OperationalFunction>("OperationalFunction", value.id); }
  function useAsScope(value: OperationalFunction) { setWorkspaceScope({ operationalFunctionId: value.id }); }
  async function addProcess(value: OperationalFunction) { useAsScope(value); await goto("/operations/processes/new"); }
  function locationLabel(location: Location) { const site = locations.find((item) => item.id === (location.nodeType === "Site" ? location.id : location.resolvedSiteId)); return site && site.id !== location.id ? `${site.name} › ${location.name}` : location.name; }
  function locationCount(value: OperationalFunction) { return assignments.filter((item) => item.operationalFunctionId === value.id && assignmentIsEffective(item)).length; }
  function processCount(value: OperationalFunction) { return processes.filter((item) => item.operationalFunctionId === value.id).length; }
</script>

{#if loading}<section class="workspace-list" role="status">Loading Functions and operational context…</section>
{:else if error}<section class="workspace-list"><ErrorState message={error} onRetry={() => void load()}/></section>
{:else if route.mode === "detail" && !selected}<section class="workspace-list"><EmptyState title="Function not found" message="This Function may have been archived or removed from the local dataset." actionLabel="Return to Functions" onAction={() => void goto("/enterprise/functions")}/></section>
{:else if selected}
  <RecordWorkspace
    title={selected.name}
    recordType="Operational Function"
    summary={selected.description || "A reusable type of work connected to Locations, Processes, Tasks, materials, and exposure context."}
    updatedAt={selected.updatedAt}
    contextPath={[{ label: "Functions & Processes", href: "/enterprise/functions" }, { label: selected.name }]}
    statuses={[{ label: "Lifecycle", value: selected.lifecycleStatus === "archived" ? "Archived" : selected.status, tone: selected.status === "Active" ? "positive" : "neutral" }, { label: "Review", value: "Draft", tone: "warning" }, { label: "Data quality", value: selectedAssignments.length && selectedProcesses.length ? "Verified" : "Needs verification", tone: selectedAssignments.length && selectedProcesses.length ? "positive" : "warning" }, { label: "Sync / exchange", value: selected.lastExchangePackageId ? "Exchanged" : "Local changes", tone: "information" }]}
    actions={[{ label: "Add Process", onSelect: () => void addProcess(selected), primary: true }, { label: "Use as scope", onSelect: () => useAsScope(selected) }]}
    moreActions={[{ label: "Manage Function", onSelect: () => void goto("/enterprise/navigator") }]}
    tabs={["Overview", "Locations", "Processes", "Tasks", "People", "Chemical Uses", "SEGs", "Exposure Scenarios", "Open Findings", "History"].map((label) => ({ id: label.toLowerCase().replaceAll(" ", "-"), label }))}
    {activeTab}
    onTabChange={(id) => (activeTab = id)}
  >
    {#if activeTab === "overview"}
      <div class="summary-grid"><SummaryCard label="Locations" value={selectedLocations.length} href="#locations"/><SummaryCard label="Sites" value={sites.length} href="#locations"/><SummaryCard label="Processes" value={selectedProcesses.length} href="#processes"/><SummaryCard label="Tasks" value={selectedTasks.length} href="#tasks"/><SummaryCard label="Chemical Uses" value={selectedUses.length} href="#chemical-uses"/><SummaryCard label="Open Findings" value={0} href="/field/findings"/></div>
      <section class="function-map"><h2>Where this work happens</h2>{#if sites.length}{#each sites as site}<div class="site-group"><div class="site"><Factory size={17}/><a href={`/operations/locations/${site.id}`}>{site.name}</a></div><div class="site-locations">{#each selectedLocations.filter((item) => item.id === site.id || item.resolvedSiteId === site.id) as location}<a href={`/operations/locations/${location.id}`}><MapPin size={14}/>{location.name}<small>{selectedAssignments.find((item) => item.locationId === location.id)?.assignmentType}</small></a>{/each}</div></div>{/each}{:else}<p>No active Location assignments.</p>{/if}</section>
      <div class="overview-grid"><CompletenessPanel rules={[{ label: "Function identity", complete: Boolean(selected.businessId && selected.name) }, { label: "Function category", complete: Boolean(selected.functionCategory) }, { label: "Active Location assignment", complete: selectedAssignments.length > 0, guidance: "Assign the Function at one or more Locations." }, { label: "Documented Process", complete: selectedProcesses.length > 0, guidance: "Add the first Process for this Function." }]}/><ConnectedRecords records={[{ label: "Locations", value: selectedLocations.length, href: "#locations" }, { label: "Processes", value: selectedProcesses.length, href: "#processes" }, { label: "Tasks", value: selectedTasks.length, href: "#tasks" }, { label: "People", value: new Set(selectedAssignments.map((item) => item.responsiblePersonId).filter(Boolean)).size, href: "/people/workers" }, { label: "Chemical Uses", value: selectedUses.length, href: "/master/chemical-uses" }, { label: "SEGs", value: 0, href: "/hse/segs" }, { label: "Exposure Scenarios", value: 0, href: "/exposure/scenarios" }, { label: "Open Findings", value: 0, href: "/field/findings" }]}/></div>
    {:else if activeTab === "locations"}
      <RelationshipList title="Assigned Locations" items={selectedLocations.map((item) => ({ id: item.id, name: locationLabel(item), type: selectedAssignments.find((assignment) => assignment.locationId === item.id)?.assignmentType, detail: selectedAssignments.find((assignment) => assignment.locationId === item.id)?.scopeDescription, href: `/operations/locations/${item.id}`, status: item.status }))} emptyMessage="No active Location assignments."/>
    {:else if activeTab === "processes"}
      <RelationshipList title="Processes" items={selectedProcesses.map((item) => ({ id: item.id, name: item.name, type: item.processType, detail: locations.find((location) => location.id === item.primaryLocationId)?.name, href: `/operations/processes/${item.id}`, status: item.status }))} emptyMessage="No Processes are documented for this Function."/>
    {:else if activeTab === "tasks"}
      <RelationshipList title="Tasks" items={selectedTasks.map((item) => ({ id: item.id, name: item.name, type: item.routineClassification, detail: selectedProcesses.find((process) => process.id === item.processId)?.name, href: `/operations/tasks/${item.id}`, status: item.status }))} emptyMessage="No Tasks are documented for this Function."/>
    {:else if activeTab === "chemical-uses"}
      <RelationshipList title="Chemical Uses" items={selectedUses.map((item) => ({ id: item.id, name: item.businessId, type: item.operatingCondition, detail: `${item.applicationMethod} · ${locations.find((location) => location.id === item.locationId)?.name ?? "Unknown Location"}`, href: `/master/chemical-uses/${item.id}`, status: item.status }))} emptyMessage="No Chemical Uses are documented for this Function."/>
    {:else if activeTab === "people"}
      <RelationshipList title="Responsible people and groups" items={selectedAssignments.filter((item) => item.responsiblePersonId || item.responsibleOrganizationId).map((item) => ({ id: item.id, name: item.responsiblePersonId ?? item.responsibleOrganizationId ?? "Responsibility", type: item.assignmentType, detail: locations.find((location) => location.id === item.locationId)?.name }))} emptyMessage="No responsible person or group is recorded on current assignments."/>
    {:else if activeTab === "history"}
      <RevisionTimeline revisions={revisions.map((item) => ({ id: item.id, revision: item.revision, operation: item.operation, changedAt: item.changedAt, changedBy: item.changedBy }))}/>
    {:else}
      <EmptyState title={`No ${activeTab.replaceAll("-", " ")} connected yet`} message="This relationship remains visible so the missing work context is clear."/>
    {/if}
  </RecordWorkspace>
{:else}
  <section class="workspace-list" aria-labelledby="functions-title">
    <header><div><span>Enterprise</span><h1 id="functions-title">Functions & Processes</h1><p>Navigate by the work being done, then see where it happens and what records depend on it.</p></div><button type="button" onclick={() => void goto("/operations/processes/new")}><Workflow size={17}/>Add Process</button></header>
    <label class="search"><Search size={16}/><span class="visually-hidden">Search Functions</span><input bind:value={query} placeholder="Search Functions by name, category, or code"/></label>
    {#if filteredFunctions.length}<div class="function-grid">{#each filteredFunctions as item}<a href={`/enterprise/functions/${item.id}`}><span class="function-icon"><Network size={19}/></span><div><h2>{item.name}</h2><p>{item.functionCategory}</p></div><dl><div><dt>Locations</dt><dd>{locationCount(item)}</dd></div><div><dt>Processes</dt><dd>{processCount(item)}</dd></div></dl></a>{/each}</div>{:else}<EmptyState title="No Functions match this scope" message="Clear the Function scope or search term to see more operational work."/>{/if}
  </section>
{/if}

<style>
  .workspace-list { width: min(100%, 1460px); min-height: 100%; margin: 0 auto; padding: 28px 30px 40px; }
  .workspace-list > header { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; margin-bottom: 18px; } header > div { display: grid; gap: 5px; } header span { color: var(--color-action); font-size: .7rem; font-weight: 750; text-transform: uppercase; } h1,h2,p { margin: 0; } h1 { font-size: 1.8rem; } header p { max-width: 700px; color: var(--color-muted); font-size: .875rem; } header > button { display: inline-flex; align-items: center; gap: 7px; min-height: 38px; border: 1px solid var(--color-action); border-radius: var(--radius-control); background: var(--color-action); color: white; font-weight: 700; padding: 0 12px; }
  .search { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 7px; max-width: 520px; margin-bottom: 16px; border: 1px solid var(--color-border); border-radius: var(--radius-control); background: var(--color-surface); color: var(--color-muted); padding: 0 10px; } .search input { min-height: 40px; border: 0; background: transparent; outline: 0; }
  .function-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 11px; } .function-grid > a { display: grid; grid-template-columns: auto 1fr; gap: 10px; border: 1px solid var(--color-border); border-radius: var(--radius-surface); background: var(--color-surface); color: var(--color-text); padding: 14px; text-decoration: none; } .function-grid > a:hover { border-color: var(--color-action); box-shadow: var(--elevation-z1); } .function-icon { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 8px; background: var(--color-warning-soft); color: var(--color-warning-text); } .function-grid h2 { font-size: .95rem; } .function-grid p { color: var(--color-muted); font-size: .75rem; }
  .function-grid dl { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin: 4px 0 0; } .function-grid dl div { display: flex; justify-content: space-between; border-top: 1px solid var(--color-border); padding-top: 7px; } dt { color: var(--color-muted); font-size: .72rem; } dd { margin: 0; font-size: .75rem; font-weight: 750; }
  .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(145px, 1fr)); gap: 10px; margin-bottom: 15px; } .overview-grid { display: grid; grid-template-columns: minmax(260px, .8fr) minmax(300px, 1.2fr); gap: 14px; }
  .function-map { display: grid; gap: 11px; margin-bottom: 15px; border: 1px solid var(--color-border); border-radius: var(--radius-surface); background: var(--color-surface); padding: 15px; } .function-map h2 { font-size: 1rem; } .function-map > p { color: var(--color-muted); font-size: .8rem; } .site-group { display: grid; grid-template-columns: minmax(160px, .6fr) 1.4fr; gap: 12px; border-top: 1px solid var(--color-border); padding-top: 10px; } .site { display: flex; align-items: center; gap: 7px; color: var(--color-action); } .site a { color: var(--color-text); font-size: .82rem; font-weight: 750; text-decoration: none; } .site-locations { display: flex; flex-wrap: wrap; gap: 6px; } .site-locations a { display: inline-grid; grid-template-columns: auto auto; align-items: center; gap: 5px; border: 1px solid var(--color-border); border-radius: var(--radius-control); color: var(--color-text); font-size: .75rem; padding: 6px 8px; text-decoration: none; } .site-locations small { grid-column: 2; color: var(--color-muted); font-size: .65rem; }
  .visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  @media (max-width: 760px) { .workspace-list { padding: 20px 15px 30px; } .workspace-list > header { align-items: stretch; flex-direction: column; } .overview-grid, .site-group { grid-template-columns: 1fr; } }
</style>
