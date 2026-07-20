<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { Building2, Factory, Map, Network, Pin, Search } from "lucide-svelte";
  import { foundationApplication } from "$lib/application/foundation";
  import EnterpriseTree from "$lib/components/navigation/EnterpriseTree.svelte";
  import type { EnterpriseTreeNode } from "$lib/components/navigation/enterprise-tree.types";
  import CompletenessPanel, { type CompletenessRule } from "$lib/components/workspace/CompletenessPanel.svelte";
  import ConnectedRecords, { type ConnectedRecord } from "$lib/components/workspace/ConnectedRecords.svelte";
  import DataQualityBanner from "$lib/components/feedback/DataQualityBanner.svelte";
  import EmptyState from "$lib/components/feedback/EmptyState.svelte";
  import ErrorState from "$lib/components/feedback/ErrorState.svelte";
  import type { Organization, OrganizationLocationAssignment, OrganizationFunctionResponsibility } from "$lib/domain/enterprise";
  import { organizationAssignmentIsEffective } from "$lib/domain/enterprise";
  import type { Location } from "$lib/domain/location";
  import type { LocationFunctionAssignment, OperationalFunction, Process, Task } from "$lib/domain/operations";
  import { assignmentIsEffective } from "$lib/domain/operations";
  import type { Person } from "$lib/domain/foundation";
  import type { ChemicalUse, SiteChemicalInventory } from "$lib/domain/chemical";
  import { ChemicalUseRepository, SiteChemicalInventoryRepository } from "$lib/data/repositories/chemical";
  import { getBrowserDatabase } from "$lib/data/database";
  import { pinCurrentScope, pinnedScopes, setWorkspaceScope } from "$lib/workspace/scope";
  import { rememberRecentRecord } from "$lib/workspace/recent-records";
  import { readWorkspaceStore } from "$lib/workspace/idb-read";

  type NavigatorView = "geography" | "organization" | "function";
  type ContextRecord = Record<string, unknown> & { id: string; siteId?: string; resolvedSiteId?: string; locationId?: string; primaryLocationId?: string; operationalFunctionId?: string; status?: string };
  let view = $state<NavigatorView>("geography");
  let organizations = $state<Organization[]>([]);
  let people = $state<Person[]>([]);
  let locations = $state<Location[]>([]);
  let organizationLocations = $state<OrganizationLocationAssignment[]>([]);
  let organizationFunctions = $state<OrganizationFunctionResponsibility[]>([]);
  let functions = $state<OperationalFunction[]>([]);
  let locationFunctions = $state<LocationFunctionAssignment[]>([]);
  let processes = $state<Process[]>([]);
  let tasks = $state<Task[]>([]);
  let inventory = $state<SiteChemicalInventory[]>([]);
  let chemicalUses = $state<ChemicalUse[]>([]);
  let segs = $state<ContextRecord[]>([]);
  let exposureScenarios = $state<ContextRecord[]>([]);
  let findings = $state<ContextRecord[]>([]);
  let correctiveActions = $state<ContextRecord[]>([]);
  let selectedId = $state<string>();
  let loading = $state(true);
  let error = $state<string | null>(null);

  const trees = $derived({ geography: geographyTree(), organization: organizationTree(), function: functionTree() });
  const selectedNode = $derived(findNode(trees[view], selectedId) ?? trees[view][0]);
  const selectedLocation = $derived(selectedNode && ["country", "geography", "site", "location"].includes(selectedNode.type) ? locations.find((item) => item.id === selectedNode.recordId) : undefined);
  const selectedOrganization = $derived(selectedNode?.type === "organization" ? organizations.find((item) => item.id === selectedNode.recordId) : undefined);
  const selectedFunction = $derived(selectedNode?.type === "function" ? functions.find((item) => item.id === selectedNode.recordId) : undefined);
  const scopedLocationIds = $derived(selectedNode ? locationIdsFor(selectedNode) : []);
  const scopedProcessIds = $derived(new Set(processes.filter((item) => recordInSelection(item.primaryLocationId, item.operationalFunctionId)).map((item) => item.id)));
  const completenessRules = $derived(buildCompletenessRules());
  const connectedRecords = $derived(buildConnectedRecords());
  const ancestry = $derived(selectedLocation ? locationPath(selectedLocation).map((item) => item.name).join(" › ") : "");
  const assignedFunctions = $derived(selectedLocation ? functions.filter((item) => locationFunctions.some((assignment) => assignment.locationId === selectedLocation.id && assignment.operationalFunctionId === item.id && assignmentIsEffective(assignment))) : []);
  const operatingOrganizations = $derived(selectedLocation ? organizations.filter((item) => organizationLocations.some((assignment) => assignment.locationId === selectedLocation.id && assignment.organizationId === item.id && organizationAssignmentIsEffective(assignment))) : []);

  onMount(() => { void load(); });

  async function load() {
    loading = true; error = null;
    try {
      const [services, adapter] = await Promise.all([foundationApplication.services(), getBrowserDatabase()]);
      const inventoryRepository = new SiteChemicalInventoryRepository(adapter.database);
      const useRepository = new ChemicalUseRepository(adapter.database);
      [organizations, people, locations, organizationLocations, organizationFunctions, functions, locationFunctions, processes, tasks, inventory, chemicalUses, segs, exposureScenarios, findings, correctiveActions] = await Promise.all([
        services.organizations.list(true), services.people.list(true), services.locations.list(true), services.organizationLocationAssignments.list(true), services.organizationFunctionResponsibilities.list(true), services.operationalFunctions.list(true), services.locationFunctionAssignments.list(true), services.processes.list(true), services.tasks.list(true), inventoryRepository.list({ includeArchived: true }), useRepository.list({ includeArchived: true }), readWorkspaceStore<ContextRecord>(adapter.database, "segs"), readWorkspaceStore<ContextRecord>(adapter.database, "exposure_scenarios"), readWorkspaceStore<ContextRecord>(adapter.database, "findings"), readWorkspaceStore<ContextRecord>(adapter.database, "corrective_actions"),
      ]);
      selectedId = geographyTree()[0]?.id;
    } catch (cause) { error = cause instanceof Error ? cause.message : String(cause); }
    finally { loading = false; }
  }

  function active(item: { lifecycleStatus: string }) { return item.lifecycleStatus === "active"; }
  function locationPath(location: Location) { const path = [location]; const seen = new Set([location.id]); let parentId = location.parentId; while (parentId) { const parent = locations.find((item) => item.id === parentId); if (!parent || seen.has(parent.id)) break; path.unshift(parent); seen.add(parent.id); parentId = parent.parentId; } return path; }
  function qualityForLocation(location: Location) { return (!location.businessId || (location.nodeType === "Site" && !location.resolvedCityOrMunicipalityId)) ? "needs-review" as const : "verified" as const; }
  function makeLocationNode(location: Location): EnterpriseTreeNode {
    const type = location.nodeType === "Country" ? "country" : ["StateOrProvince", "CountyOrDistrict", "CityOrMunicipality"].includes(location.nodeType) ? "geography" : location.nodeType === "Site" ? "site" : "location";
    return { id: `location:${location.id}`, recordId: location.id, type, name: location.name, subtitle: `${location.nodeType} · ${location.status}`, href: `/operations/locations/${encodeURIComponent(location.id)}`, dataQuality: qualityForLocation(location), pinned: $pinnedScopes.some((item) => item.scope.siteId === (location.nodeType === "Site" ? location.id : location.resolvedSiteId) && (!item.scope.locationId || item.scope.locationId === location.id)), children: locations.filter((item) => item.parentId === location.id && active(item)).sort(byName).map(makeLocationNode) };
  }
  function geographyTree() { return locations.filter((item) => item.nodeType === "Country" && active(item)).sort(byName).map(makeLocationNode); }
  function organizationTree(): EnterpriseTreeNode[] {
    const visit = (organization: Organization): EnterpriseTreeNode => ({ id: `organization:${organization.id}`, recordId: organization.id, type: "organization", name: organization.name, subtitle: `${organization.organizationType} · ${organization.status}`, href: `/people/organizations/${encodeURIComponent(organization.id)}`, dataQuality: organization.businessId ? "verified" : "needs-review", children: organizations.filter((item) => item.parentOrganizationId === organization.id && active(item)).sort(byName).map(visit) });
    return organizations.filter((item) => !item.parentOrganizationId && active(item)).sort(byName).map(visit);
  }
  function functionTree(): EnterpriseTreeNode[] {
    return functions.filter(active).sort(byName).map((operationalFunction) => {
      const assignments = locationFunctions.filter((item) => item.operationalFunctionId === operationalFunction.id && assignmentIsEffective(item));
      const assigned = assignments.map((item) => locations.find((location) => location.id === item.locationId)).filter((item): item is Location => Boolean(item));
      const siteIds = [...new Set(assigned.map((location) => location.nodeType === "Site" ? location.id : location.resolvedSiteId).filter((id): id is string => Boolean(id)))];
      return { id: `function:${operationalFunction.id}`, recordId: operationalFunction.id, type: "function", name: operationalFunction.name, subtitle: operationalFunction.functionCategory, href: `/enterprise/functions/${encodeURIComponent(operationalFunction.id)}`, dataQuality: assignments.length ? "verified" : "needs-review", children: siteIds.map((siteId) => locations.find((item) => item.id === siteId)).filter((item): item is Location => Boolean(item)).sort(byName).map((site) => ({ ...makeLocationNode(site), id: `function:${operationalFunction.id}:site:${site.id}`, children: assigned.filter((item) => item.id !== site.id && item.resolvedSiteId === site.id).sort(byName).map((item) => ({ ...makeLocationNode(item), id: `function:${operationalFunction.id}:location:${item.id}`, children: [] })) })) };
    });
  }
  function byName(left: { name: string }, right: { name: string }) { return left.name.localeCompare(right.name); }
  function findNode(nodes: EnterpriseTreeNode[], id?: string): EnterpriseTreeNode | undefined { for (const node of nodes) { if (node.id === id) return node; const found = findNode(node.children, id); if (found) return found; } }
  function locationIdsFor(node: EnterpriseTreeNode) {
    if (node.type === "function") return locationFunctions.filter((item) => item.operationalFunctionId === node.recordId && assignmentIsEffective(item)).map((item) => item.locationId);
    if (node.type === "organization") return organizationLocations.filter((item) => item.organizationId === node.recordId && organizationAssignmentIsEffective(item)).map((item) => item.locationId);
    const location = locations.find((item) => item.id === node.recordId); if (!location) return [];
    if (location.nodeType === "Site") return locations.filter((item) => item.id === location.id || item.resolvedSiteId === location.id).map((item) => item.id);
    if (["Country", "StateOrProvince", "CountyOrDistrict", "CityOrMunicipality"].includes(location.nodeType)) return locations.filter((item) => item.id === location.id || item.resolvedCountryId === location.id || item.resolvedStateOrProvinceId === location.id || item.resolvedCountyOrDistrictId === location.id || item.resolvedCityOrMunicipalityId === location.id).map((item) => item.id);
    return [location.id];
  }
  function recordInSelection(locationId: string, functionId?: string) { if (!selectedNode) return false; if (selectedNode.type === "function") return functionId === selectedNode.recordId; return scopedLocationIds.includes(locationId) || scopedLocationIds.includes(locations.find((item) => item.id === locationId)?.resolvedSiteId ?? ""); }
  function buildCompletenessRules(): CompletenessRule[] {
    if (selectedLocation) return [{ label: "Plain-language name", complete: Boolean(selectedLocation.name) }, { label: "Business code", complete: Boolean(selectedLocation.businessId) }, { label: "Parent and ancestry", complete: selectedLocation.nodeType === "Country" || Boolean(selectedLocation.parentId) }, { label: "Resolved Site", complete: ["Country", "StateOrProvince", "CountyOrDistrict", "CityOrMunicipality"].includes(selectedLocation.nodeType) || Boolean(selectedLocation.resolvedSiteId) || selectedLocation.nodeType === "Site" }, { label: "Operating Function assigned", complete: ["Country", "StateOrProvince", "CountyOrDistrict", "CityOrMunicipality"].includes(selectedLocation.nodeType) || assignedFunctions.length > 0, guidance: "Assign at least one Function when work occurs here." }];
    if (selectedOrganization) return [{ label: "Plain-language name", complete: Boolean(selectedOrganization.name) }, { label: "Business code", complete: Boolean(selectedOrganization.businessId) }, { label: "Organization type", complete: Boolean(selectedOrganization.organizationType) }, { label: "Location relationship", complete: organizationLocations.some((item) => item.organizationId === selectedOrganization.id && organizationAssignmentIsEffective(item)), guidance: "Connect the Organization to a geography or physical Location." }];
    if (selectedFunction) return [{ label: "Plain-language name", complete: Boolean(selectedFunction.name) }, { label: "Function category", complete: Boolean(selectedFunction.functionCategory) }, { label: "Assigned Location", complete: locationFunctions.some((item) => item.operationalFunctionId === selectedFunction.id && assignmentIsEffective(item)), guidance: "Assign the Function where the work happens." }, { label: "Documented Process", complete: processes.some((item) => item.operationalFunctionId === selectedFunction.id), guidance: "Add the first Process for this Function." }];
    return [];
  }
  function buildConnectedRecords(): ConnectedRecord[] {
    if (!selectedNode) return [];
    const processCount = processes.filter((item) => selectedNode.type === "function" ? item.operationalFunctionId === selectedNode.recordId : scopedLocationIds.includes(item.primaryLocationId)).length;
    const taskCount = tasks.filter((item) => scopedProcessIds.has(item.processId)).length;
    const siteIds = new Set(scopedLocationIds.map((id) => locations.find((item) => item.id === id)?.resolvedSiteId ?? (locations.find((item) => item.id === id)?.nodeType === "Site" ? id : "")));
    const inventoryCount = inventory.filter((item) => scopedLocationIds.includes(item.storageLocationId) || siteIds.has(item.siteId)).length;
    const useCount = chemicalUses.filter((item) => selectedNode.type === "function" ? item.operationalFunctionId === selectedNode.recordId : scopedLocationIds.includes(item.locationId) || siteIds.has(item.siteId)).length;
    const functionCount = selectedNode.type === "function" ? 1 : new Set(locationFunctions.filter((item) => scopedLocationIds.includes(item.locationId) && assignmentIsEffective(item)).map((item) => item.operationalFunctionId)).size;
    const peopleCount = people.filter((item) => item.primarySiteId && siteIds.has(item.primarySiteId)).length;
    const inContext = (item: ContextRecord) => selectedNode?.type === "function"
      ? item.operationalFunctionId === selectedNode.recordId
      : Boolean((item.locationId && scopedLocationIds.includes(item.locationId)) || (item.primaryLocationId && scopedLocationIds.includes(item.primaryLocationId)) || (item.siteId && siteIds.has(item.siteId)) || (item.resolvedSiteId && siteIds.has(item.resolvedSiteId)));
    const segCount = segs.filter(inContext).length;
    const scenarioCount = exposureScenarios.filter(inContext).length;
    const findingCount = findings.filter((item) => inContext(item) && !["Resolved", "Closed", "Accepted"].includes(String(item.status ?? ""))).length;
    const actionCount = correctiveActions.filter((item) => inContext(item) && !["Verified", "Closed", "Canceled", "Complete"].includes(String(item.status ?? ""))).length;
    return [{ label: "Operational Functions", value: functionCount, href: selectedNode.type === "function" ? selectedNode.href : "/enterprise/functions" }, { label: "Processes", value: processCount, href: "/operations/processes" }, { label: "Tasks", value: taskCount, href: "/operations/tasks" }, { label: "People", value: peopleCount, href: "/people/workers" }, { label: "Chemical Inventory", value: inventoryCount, href: "/master/inventory" }, { label: "Chemical Uses", value: useCount, href: "/master/chemical-uses" }, { label: "SEGs", value: segCount, href: "/hse/segs", state: segCount ? undefined : "No scoped SEG records" }, { label: "Exposure Scenarios", value: scenarioCount, href: "/exposure/scenarios", state: scenarioCount ? undefined : "No scoped scenarios" }, { label: "Open Findings", value: findingCount, href: "/field/findings", state: findingCount ? undefined : "No open findings" }, { label: "Open Corrective Actions", value: actionCount, href: "/actions/corrective-actions", state: actionCount ? undefined : "No open actions" }];
  }
  function select(node: EnterpriseTreeNode) { selectedId = node.id; rememberRecentRecord({ path: node.href ?? "/enterprise/navigator", title: node.name, context: node.subtitle }); }
  function switchView(next: NavigatorView) { view = next; selectedId = trees[next][0]?.id; }
  function useAsScope(node: EnterpriseTreeNode) {
    if (node.type === "organization") setWorkspaceScope({ organizationId: node.recordId });
    else if (node.type === "function") setWorkspaceScope({ operationalFunctionId: node.recordId });
    else { const location = locations.find((item) => item.id === node.recordId); if (location) setWorkspaceScope({ countryId: location.resolvedCountryId ?? (location.nodeType === "Country" ? location.id : undefined), siteId: location.nodeType === "Site" ? location.id : location.resolvedSiteId ?? undefined, locationId: ["Site", "Country", "StateOrProvince", "CountyOrDistrict", "CityOrMunicipality"].includes(location.nodeType) ? undefined : location.id }); }
  }
  function pin(node: EnterpriseTreeNode) { useAsScope(node); pinCurrentScope(node.name); }
</script>

<section class="navigator-page" aria-labelledby="enterprise-navigator-title">
  <header class="navigator-header"><div><span>Enterprise</span><h1 id="enterprise-navigator-title">Enterprise Navigator</h1><p>Start with place, organization, or work. Select a record to see its operating context and connected HSE records.</p></div><div class="view-selector" aria-label="Navigator view">{#each [{ id: "geography", label: "By Geography", icon: Map }, { id: "organization", label: "By Organization", icon: Building2 }, { id: "function", label: "By Function", icon: Network }] as option}{@const Icon = option.icon}<button type="button" class:active={view === option.id} aria-pressed={view === option.id} onclick={() => switchView(option.id as NavigatorView)}><Icon size={16}/>{option.label}</button>{/each}</div></header>

  {#if loading}<div class="loading" role="status"><Search size={20}/> Loading enterprise relationships…</div>
  {:else if error}<ErrorState message={error} onRetry={() => void load()} />
  {:else if trees[view].length === 0}<EmptyState title="No enterprise hierarchy yet" message="Create the first Organization or Country to begin building the connected workspace." actionLabel="Create a Location" onAction={() => void goto("/operations/locations/new")} />
  {:else}
    <div class="navigator-workspace">
      <aside class="tree-pane" aria-label="Hierarchy"><div class="pane-title"><div><strong>Hierarchy</strong><span>{view === "geography" ? "Places and physical layout" : view === "organization" ? "Operating structure" : "Work across Locations"}</span></div><small>{trees[view].length} root records</small></div><EnterpriseTree nodes={trees[view]} selectedId={selectedNode?.id} onSelect={select} onPin={pin} /></aside>
      <main class="record-pane">
        {#if selectedNode}
          <div class="selected-heading"><div class={`selected-icon ${selectedNode.type}`}>{#if selectedNode.type === "organization"}<Building2 size={22}/>{:else if selectedNode.type === "function"}<Network size={22}/>{:else}<Factory size={22}/>{/if}</div><div><span>{selectedNode.type === "function" ? "Operational Function" : selectedNode.type === "organization" ? "Organization" : selectedLocation?.nodeType ?? "Location"}</span><h2>{selectedNode.name}</h2><p>{selectedNode.subtitle}</p></div></div>
          {#if ancestry}<p class="ancestry">{ancestry}</p>{/if}
          <div class="primary-actions"><button class="primary" type="button" onclick={() => void goto(selectedNode.href ?? "/enterprise/navigator")}>Open workspace</button><button type="button" onclick={() => useAsScope(selectedNode)}>Use as scope</button>{#if selectedNode.type === "site" || selectedNode.type === "location"}<button type="button" onclick={() => pin(selectedNode)}><Pin size={14}/> Pin Location</button>{/if}</div>
          {#if selectedLocation}<section class="overview"><h3>Overview</h3><dl><div><dt>Status</dt><dd>{selectedLocation.status}</dd></div><div><dt>Code</dt><dd>{selectedLocation.businessId}</dd></div><div><dt>Address</dt><dd>{[selectedLocation.addressLine1, selectedLocation.addressLine2, selectedLocation.postalCode].filter(Boolean).join(", ") || "Not documented"}</dd></div><div><dt>Assigned Functions</dt><dd>{assignedFunctions.map((item) => item.name).join(", ") || "None assigned"}</dd></div><div><dt>Operating Organizations</dt><dd>{operatingOrganizations.map((item) => item.name).join(", ") || "None assigned"}</dd></div></dl></section>{/if}
          {#if selectedOrganization}<section class="overview"><h3>Overview</h3><dl><div><dt>Status</dt><dd>{selectedOrganization.status}</dd></div><div><dt>Code</dt><dd>{selectedOrganization.businessId}</dd></div><div><dt>Type</dt><dd>{selectedOrganization.organizationType}</dd></div><div><dt>Locations</dt><dd>{organizationLocations.filter((item) => item.organizationId === selectedOrganization.id && organizationAssignmentIsEffective(item)).length}</dd></div><div><dt>Function responsibilities</dt><dd>{organizationFunctions.filter((item) => item.organizationId === selectedOrganization.id).length}</dd></div></dl></section>{/if}
          {#if selectedFunction}<section class="overview"><h3>Overview</h3><dl><div><dt>Status</dt><dd>{selectedFunction.status}</dd></div><div><dt>Code</dt><dd>{selectedFunction.businessId}</dd></div><div><dt>Category</dt><dd>{selectedFunction.functionCategory}</dd></div><div><dt>Locations</dt><dd>{locationFunctions.filter((item) => item.operationalFunctionId === selectedFunction.id && assignmentIsEffective(item)).length}</dd></div><div><dt>Processes</dt><dd>{processes.filter((item) => item.operationalFunctionId === selectedFunction.id).length}</dd></div></dl></section>{/if}
          <DataQualityBanner state={selectedNode.dataQuality === "verified" ? "verified" : "needs-review"} message={selectedNode.dataQuality === "verified" ? "Required identity and relationship checks are complete." : "One or more relationship or context checks need attention."} />
          <CompletenessPanel rules={completenessRules} />
        {/if}
      </main>
      <aside class="context-pane"><div class="pane-title"><div><strong>Context</strong><span>Records connected to this selection</span></div></div><ConnectedRecords records={connectedRecords} /></aside>
    </div>
  {/if}
</section>

<style>
  .navigator-page { width: min(100%, 1660px); min-height: 100%; margin: 0 auto; padding: 26px 28px 38px; }
  .navigator-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 18px; }
  .navigator-header > div:first-child { display: grid; gap: 5px; } .navigator-header span { color: var(--color-action); font-size: .7rem; font-weight: 750; text-transform: uppercase; } h1,h2,h3,p { margin: 0; } h1 { font-size: 1.8rem; } .navigator-header p { max-width: 720px; color: var(--color-muted); font-size: .875rem; }
  .view-selector { display: flex; flex-wrap: wrap; gap: 4px; border: 1px solid var(--color-border); border-radius: var(--radius-surface); background: var(--color-surface); padding: 4px; }
  .view-selector button { display: inline-flex; align-items: center; gap: 6px; min-height: 34px; border: 0; border-radius: var(--radius-control); background: transparent; color: var(--color-muted); font-size: .75rem; font-weight: 700; padding: 0 9px; } .view-selector button.active { background: var(--color-accent-soft); color: var(--color-action); }
  .navigator-workspace { display: grid; grid-template-columns: minmax(260px, .8fr) minmax(400px, 1.35fr) minmax(250px, .8fr); min-height: 670px; overflow: hidden; border: 1px solid var(--color-border); border-radius: 10px; background: var(--color-surface); }
  .tree-pane, .context-pane { display: grid; grid-template-rows: auto minmax(0, 1fr); min-width: 0; background: var(--color-surface-subtle); } .tree-pane { border-right: 1px solid var(--color-border); } .context-pane { border-left: 1px solid var(--color-border); }
  .pane-title { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; min-height: 58px; border-bottom: 1px solid var(--color-border); padding: 11px 13px; } .pane-title div { display: grid; gap: 2px; } .pane-title strong { font-size: .8125rem; } .pane-title span, .pane-title small { color: var(--color-muted); font-size: .6875rem; }
  .tree-pane :global(.enterprise-tree) { padding: 10px 5px; }
  .record-pane { display: grid; align-content: start; gap: 16px; min-width: 0; overflow-y: auto; padding: 22px; }
  .selected-heading { display: grid; grid-template-columns: auto 1fr; gap: 11px; align-items: center; } .selected-heading > div:last-child { display: grid; gap: 2px; min-width: 0; } .selected-heading span { color: var(--color-muted); font-size: .6875rem; font-weight: 750; text-transform: uppercase; } .selected-heading h2 { overflow: hidden; font-size: 1.35rem; text-overflow: ellipsis; white-space: nowrap; } .selected-heading p { color: var(--color-muted); font-size: .8rem; }
  .selected-icon { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 9px; background: var(--color-positive-soft); color: var(--color-positive-text); } .selected-icon.organization { background: #eef0fb; color: #4858a8; } .selected-icon.function { background: var(--color-warning-soft); color: var(--color-warning-text); }
  .ancestry { border-left: 2px solid var(--color-action); color: var(--color-muted); font-size: .8rem; padding-left: 9px; }
  .primary-actions { display: flex; flex-wrap: wrap; gap: 7px; } .primary-actions button { display: inline-flex; align-items: center; gap: 6px; min-height: 36px; border: 1px solid var(--color-border-strong); border-radius: var(--radius-control); background: var(--color-surface); color: var(--color-text); font-size: .78rem; font-weight: 700; padding: 0 11px; } .primary-actions .primary { border-color: var(--color-action); background: var(--color-action); color: white; }
  .overview { border: 1px solid var(--color-border); border-radius: var(--radius-surface); } .overview h3 { border-bottom: 1px solid var(--color-border); font-size: .875rem; padding: 11px 13px; } .overview dl { display: grid; margin: 0; } .overview dl div { display: grid; grid-template-columns: minmax(120px, .7fr) 1.3fr; gap: 10px; border-bottom: 1px solid var(--color-border); padding: 8px 13px; } .overview dl div:last-child { border-bottom: 0; } dt { color: var(--color-muted); font-size: .75rem; } dd { margin: 0; font-size: .75rem; font-weight: 650; }
  .context-pane :global(.connected-records) { margin: 12px; } .loading { display: flex; align-items: center; gap: 9px; min-height: 260px; color: var(--color-muted); }
  @media (max-width: 1180px) { .navigator-workspace { grid-template-columns: minmax(250px, .75fr) minmax(380px, 1.25fr); } .context-pane { grid-column: 1 / -1; border-top: 1px solid var(--color-border); border-left: 0; } }
  @media (max-width: 760px) { .navigator-page { padding: 18px 14px 28px; } .navigator-header { align-items: stretch; flex-direction: column; } .view-selector { overflow-x: auto; flex-wrap: nowrap; } .navigator-workspace { display: block; } .tree-pane { min-height: 360px; border-right: 0; border-bottom: 1px solid var(--color-border); } .record-pane { padding: 17px; } }
</style>
