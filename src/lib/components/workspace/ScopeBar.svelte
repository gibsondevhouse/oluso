<script lang="ts">
  import { onMount } from "svelte";
  import { MapPin, Pin, RotateCcw } from "lucide-svelte";
  import { foundationApplication } from "$lib/application/foundation";
  import ScopePicker, { type ScopeOption } from "$lib/components/navigation/ScopePicker.svelte";
  import { assignmentIsEffective, type LocationFunctionAssignment, type OperationalFunction } from "$lib/domain/operations";
  import type { Organization } from "$lib/domain/enterprise";
  import type { Location } from "$lib/domain/location";
  import { clearWorkspaceScope, pinCurrentScope, updateWorkspaceScope, workspaceScope, workspaceScopeLabels } from "$lib/workspace/scope";

  let organizations = $state<Organization[]>([]);
  let locations = $state<Location[]>([]);
  let functions = $state<OperationalFunction[]>([]);
  let assignments = $state<LocationFunctionAssignment[]>([]);
  let loading = $state(true);

  const organizationOptions = $derived(options(organizations.filter(active), (item) => item.name));
  const countryOptions = $derived(options(locations.filter((item) => active(item) && item.nodeType === "Country"), (item) => item.name));
  const siteOptions = $derived(options(locations.filter((item) => active(item) && item.nodeType === "Site" && (!$workspaceScope.countryId || item.resolvedCountryId === $workspaceScope.countryId)), (item) => item.name));
  const locationOptions = $derived(options(locations.filter((item) => active(item) && !["Country", "StateOrProvince", "CountyOrDistrict", "CityOrMunicipality", "Site"].includes(item.nodeType) && (!$workspaceScope.siteId || item.resolvedSiteId === $workspaceScope.siteId)), (item) => item.name, (item) => item.nodeType));
  const functionOptions = $derived(options(functions.filter((item) => active(item) && functionIsInScope(item.id)), (item) => item.name, (item) => item.functionCategory));
  const scopeSummary = $derived([
    $workspaceScopeLabels.organization,
    $workspaceScopeLabels.country,
    $workspaceScopeLabels.site,
    $workspaceScopeLabels.location,
    $workspaceScopeLabels.operationalFunction ?? "All Functions",
  ].filter(Boolean).join(" › ") || "All enterprise records");

  onMount(() => { void loadOptions(); });

  function active(item: { lifecycleStatus: string }) { return item.lifecycleStatus === "active"; }
  function options<T extends { id: string }>(items: T[], label: (item: T) => string, context?: (item: T) => string): ScopeOption[] {
    return [...items].sort((a, b) => label(a).localeCompare(label(b))).map((item) => ({ value: item.id, label: label(item), context: context?.(item) }));
  }
  function functionIsInScope(functionId: string) {
    const locationId = $workspaceScope.locationId ?? $workspaceScope.siteId;
    if (!locationId) return true;
    return assignments.some((item) => item.operationalFunctionId === functionId && assignmentIsEffective(item) && (item.locationId === locationId || (!$workspaceScope.locationId && locations.find((location) => location.id === item.locationId)?.resolvedSiteId === locationId)));
  }
  async function loadOptions() {
    try {
      const services = await foundationApplication.services();
      [organizations, locations, functions, assignments] = await Promise.all([services.organizations.list(true), services.locations.list(true), services.operationalFunctions.list(true), services.locationFunctionAssignments.list(true)]);
      syncLabels();
    } finally { loading = false; }
  }
  function syncLabels() {
    workspaceScopeLabels.set({
      organization: organizations.find((item) => item.id === $workspaceScope.organizationId)?.name,
      country: locations.find((item) => item.id === $workspaceScope.countryId)?.name,
      site: locations.find((item) => item.id === $workspaceScope.siteId)?.name,
      location: locations.find((item) => item.id === $workspaceScope.locationId)?.name,
      operationalFunction: functions.find((item) => item.id === $workspaceScope.operationalFunctionId)?.name,
    });
  }
  function changeOrganization(value: string) { updateWorkspaceScope({ organizationId: value || undefined }); queueMicrotask(syncLabels); }
  function changeCountry(value: string) { updateWorkspaceScope({ countryId: value || undefined, siteId: undefined, locationId: undefined, operationalFunctionId: undefined }); queueMicrotask(syncLabels); }
  function changeSite(value: string) {
    const site = locations.find((item) => item.id === value);
    updateWorkspaceScope({ siteId: value || undefined, countryId: site?.resolvedCountryId ?? $workspaceScope.countryId, locationId: undefined, operationalFunctionId: undefined }); queueMicrotask(syncLabels);
  }
  function changeLocation(value: string) { updateWorkspaceScope({ locationId: value || undefined, operationalFunctionId: undefined }); queueMicrotask(syncLabels); }
  function changeFunction(value: string) { updateWorkspaceScope({ operationalFunctionId: value || undefined }); queueMicrotask(syncLabels); }
  function clear() { clearWorkspaceScope(); }
  function pin() { pinCurrentScope(scopeSummary); }
</script>

<section class="scope-bar" aria-label="Global workspace scope">
  <div class="scope-identity"><MapPin size={17} aria-hidden="true" /><div><span>Current scope</span><strong>{loading ? "Loading scope…" : scopeSummary}</strong></div></div>
  <div class="scope-controls">
    <ScopePicker label="Organization" value={$workspaceScope.organizationId} options={organizationOptions} allLabel="All organizations" onChange={changeOrganization} />
    <ScopePicker label="Country" value={$workspaceScope.countryId} options={countryOptions} allLabel="All countries" onChange={changeCountry} />
    <ScopePicker label="Site" value={$workspaceScope.siteId} options={siteOptions} allLabel="All sites" onChange={changeSite} />
    <ScopePicker label="Physical Location" value={$workspaceScope.locationId} options={locationOptions} allLabel="All locations" disabled={!$workspaceScope.siteId && locationOptions.length > 30} onChange={changeLocation} />
    <ScopePicker label="Function" value={$workspaceScope.operationalFunctionId} options={functionOptions} allLabel="All functions" onChange={changeFunction} />
  </div>
  <div class="scope-actions"><button type="button" onclick={pin} disabled={!Object.values($workspaceScope).some(Boolean)} title="Pin this scope"><Pin size={15} /><span>Pin</span></button><button type="button" onclick={clear} disabled={!Object.values($workspaceScope).some(Boolean)} title="Clear scope"><RotateCcw size={15} /><span>Clear</span></button></div>
</section>

<style>
  .scope-bar { display: flex; align-items: stretch; gap: 12px; min-height: 58px; border-bottom: 1px solid var(--color-border); background: var(--color-surface); padding: 8px 18px; }
  .scope-identity { display: flex; align-items: center; gap: 9px; min-width: 210px; border-right: 1px solid var(--color-border); padding-right: 14px; color: var(--color-action); }
  .scope-identity div { display: grid; gap: 2px; } .scope-identity span { color: var(--color-muted); font-size: .625rem; font-weight: 750; text-transform: uppercase; } .scope-identity strong { max-width: 260px; overflow: hidden; color: var(--color-text); font-size: .8125rem; text-overflow: ellipsis; white-space: nowrap; }
  .scope-controls { display: flex; flex: 1; align-items: center; gap: 10px; overflow-x: auto; }
  .scope-actions { display: flex; align-items: center; gap: 3px; }
  .scope-actions button { display: grid; place-items: center; gap: 2px; min-width: 38px; height: 38px; border: 1px solid transparent; border-radius: var(--radius-control); background: transparent; color: var(--color-muted); font-size: .625rem; }
  .scope-actions button:hover:not(:disabled) { border-color: var(--color-border); color: var(--color-action); }
  @media (max-width: 1100px) { .scope-identity { min-width: 170px; } .scope-identity strong { max-width: 180px; } }
  @media (max-width: 720px) { .scope-bar { display: grid; grid-template-columns: 1fr auto; } .scope-identity { min-width: 0; border-right: 0; } .scope-controls { grid-column: 1 / -1; grid-row: 2; } .scope-actions { grid-column: 2; grid-row: 1; } }
</style>
