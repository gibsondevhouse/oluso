<script lang="ts">
  import { onMount } from "svelte";
  import { foundationApplication } from "$lib/application/foundation";
  import { organizationAssignmentIsEffective, type Organization, type OrganizationLocationAssignment } from "$lib/domain/enterprise";
  import type { Location } from "$lib/domain/location";
  import { assignmentIsEffective, type LocationFunctionAssignment, type OperationalFunction } from "$lib/domain/operations";

  type NavigatorRow =
    | { kind: "organization"; id: string; title: string; meta: string; depth: number }
    | { kind: "geographic" | "physical"; id: string; title: string; meta: string; depth: number; functions: string[] };

  let organizations = $state<Organization[]>([]);
  let locations = $state<Location[]>([]);
  let organizationLocations = $state<OrganizationLocationAssignment[]>([]);
  let functions = $state<OperationalFunction[]>([]);
  let locationFunctions = $state<LocationFunctionAssignment[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  const rows = $derived(buildRows());

  onMount(() => { void load(); });

  async function load() {
    loading = true;
    error = null;
    try {
      const services = await foundationApplication.services();
      [organizations, locations, organizationLocations, functions, locationFunctions] = await Promise.all([
        services.organizations.list(true), services.locations.list(true),
        services.organizationLocationAssignments.list(true), services.operationalFunctions.list(true),
        services.locationFunctionAssignments.list(true),
      ]);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
    } finally {
      loading = false;
    }
  }

  function functionNames(locationId: string) {
    const ids = new Set(locationFunctions.filter((item) => item.locationId === locationId && assignmentIsEffective(item)).map((item) => item.operationalFunctionId));
    return functions.filter((item) => ids.has(item.id)).map((item) => item.name).sort();
  }

  function locationAncestry(location: Location) {
    const path = [location];
    const seen = new Set([location.id]);
    let parentId = location.parentId;
    while (parentId) {
      const parent = locations.find((item) => item.id === parentId);
      if (!parent || seen.has(parent.id)) break;
      seen.add(parent.id);
      path.unshift(parent);
      parentId = parent.parentId;
    }
    return path;
  }

  function buildRows() {
    const output: NavigatorRow[] = [];
    const visitedOrganizations = new Set<string>();
    const visitOrganization = (organization: Organization, depth: number) => {
      if (visitedOrganizations.has(organization.id)) return;
      visitedOrganizations.add(organization.id);
      output.push({ kind: "organization", id: organization.id, title: organization.name, meta: organization.organizationType, depth });
      for (const child of organizations.filter((item) => item.parentOrganizationId === organization.id).sort((a, b) => a.name.localeCompare(b.name))) {
        visitOrganization(child, depth + 1);
      }
      const relationships = organizationLocations.filter((item) => item.organizationId === organization.id && organizationAssignmentIsEffective(item));
      const includedLocations = new Map<string, Location>();
      for (const relationship of relationships) {
        const target = locations.find((item) => item.id === relationship.locationId);
        if (!target) continue;
        for (const location of locationAncestry(target)) includedLocations.set(location.id, location);
      }
      const visitLocation = (location: Location, locationDepth: number) => {
        const targetRelationships = relationships.filter((item) => item.locationId === location.id);
        output.push({
          kind: ["Country", "StateOrProvince", "CountyOrDistrict", "CityOrMunicipality"].includes(location.nodeType) ? "geographic" : "physical",
          id: `${organization.id}:${location.id}`,
          title: location.name,
          meta: targetRelationships.length
            ? targetRelationships.map((item) => item.relationshipType).join(" · ")
            : location.nodeType,
          depth: locationDepth,
          functions: functionNames(location.id),
        });
        for (const child of [...includedLocations.values()]
          .filter((item) => item.parentId === location.id)
          .sort((left, right) => left.name.localeCompare(right.name))) {
          visitLocation(child, locationDepth + 1);
        }
      };
      for (const locationRoot of [...includedLocations.values()]
        .filter((item) => !item.parentId || !includedLocations.has(item.parentId))
        .sort((left, right) => left.name.localeCompare(right.name))) {
        visitLocation(locationRoot, depth + 1);
      }
    };
    for (const root of organizations.filter((item) => !item.parentOrganizationId).sort((a, b) => a.name.localeCompare(b.name))) visitOrganization(root, 0);
    for (const orphan of organizations.filter((item) => !visitedOrganizations.has(item.id))) visitOrganization(orphan, 0);
    return output;
  }
</script>

<section class="page" aria-labelledby="enterprise-navigator-title">
  <header class="navigator-header">
    <div>
      <span>Global enterprise model</span>
      <h1 id="enterprise-navigator-title">Enterprise Navigator</h1>
      <p>Organizations, geography, physical Locations, and operational Function assignments remain distinct while appearing in one governed view.</p>
    </div>
    <div class="legend" aria-label="Navigator legend">
      <span class="organization">Organization</span><span class="geographic">Geographic</span>
      <span class="physical">Physical Location</span><span class="function">Function</span>
    </div>
  </header>

  {#if loading}
    <p role="status">Loading enterprise hierarchy…</p>
  {:else if error}
    <p class="error" role="alert">{error}</p>
    <button type="button" onclick={() => void load()}>Retry</button>
  {:else if rows.length === 0}
    <p>No Organization hierarchy exists yet. Create the Corporate Group, then explicit Organization–Location assignments.</p>
  {:else}
    <ol class="navigator-tree">
      {#each rows as row (row.id)}
        <li class={row.kind} style:--depth={row.depth}>
          <span class="node-marker" aria-hidden="true"></span>
          <span class="node-copy"><strong>{row.title}</strong><small>{row.meta}</small></span>
          {#if row.kind !== "organization" && row.functions.length}
            <span class="function-list">
              {#each row.functions as functionName}<span>{functionName}</span>{/each}
            </span>
          {/if}
        </li>
      {/each}
    </ol>
  {/if}
</section>

<style>
  .navigator-header { display: grid; gap: 16px; margin-bottom: 18px; }
  .navigator-header > div:first-child { display: grid; gap: 6px; }
  .navigator-header > div:first-child > span { color: var(--color-accent-strong); font-size: .72rem; font-weight: 780; text-transform: uppercase; }
  h1, p { margin: 0; }
  .navigator-header p, small { color: var(--color-muted); }
  .legend { display: flex; flex-wrap: wrap; gap: 8px; }
  .legend span, .function-list span { border: 1px solid; border-radius: 999px; padding: 4px 8px; font-size: .7rem; font-weight: 720; }
  .legend .organization { border-color: #8aa7ff; color: #b9c8ff; }
  .legend .geographic { border-color: #63b4c5; color: #8fd8e5; }
  .legend .physical { border-color: #70bf90; color: #9bddb3; }
  .legend .function, .function-list span { border-color: #c3a766; color: #efd695; }
  .navigator-tree { display: grid; gap: 5px; margin: 0; padding: 18px; border: 1px solid var(--glass-border-subtle); border-radius: var(--radius-surface); background: rgba(9, 17, 19, .72); list-style: none; }
  .navigator-tree li { display: grid; grid-template-columns: 12px minmax(220px, 1fr) auto; align-items: center; gap: 10px; margin-left: calc(var(--depth) * 24px); padding: 10px 12px; border: 1px solid var(--glass-border-subtle); border-radius: var(--radius-control); }
  .node-marker { width: 9px; height: 9px; border-radius: 3px; background: #8aa7ff; }
  li.geographic .node-marker { border-radius: 50%; background: #63b4c5; }
  li.physical .node-marker { background: #70bf90; transform: rotate(45deg); }
  .node-copy { display: grid; gap: 2px; }
  .function-list { display: flex; flex-wrap: wrap; justify-content: end; gap: 5px; }
  .error { color: var(--color-danger-text); }
  @media (max-width: 720px) { .navigator-tree li { grid-template-columns: 12px 1fr; margin-left: calc(var(--depth) * 10px); } .function-list { grid-column: 2; justify-content: start; } }
</style>
