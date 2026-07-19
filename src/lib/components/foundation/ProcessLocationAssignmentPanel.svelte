<script lang="ts">
  import type { FoundationServices } from "$lib/application/foundation";
  import type { Location } from "$lib/domain/location";
  import {
    PROCESS_LOCATION_RELATIONSHIP_TYPES,
    type Process,
    type ProcessLocationAssignment,
    type ProcessLocationRelationshipType,
  } from "$lib/domain/operations";

  interface Props {
    process: Process;
    locations: Location[];
    assignments: ProcessLocationAssignment[];
    services: FoundationServices;
    onChanged: () => void | Promise<void>;
  }

  let { process, locations, assignments, services, onChanged }: Props = $props();
  let locationId = $state("");
  let relationshipType = $state<ProcessLocationRelationshipType>("Supporting");
  let sequence = $state("");
  let effectiveFrom = $state("");
  let effectiveTo = $state("");
  let notes = $state("");
  let pendingId = $state<string | null>(null);
  let saving = $state(false);
  let error = $state<string | null>(null);

  const relationshipOptions = PROCESS_LOCATION_RELATIONSHIP_TYPES.filter((item) => item !== "Primary");
  const eligibleLocations = $derived(locations
    .filter((item) => item.lifecycleStatus === "active" && item.resolvedSiteId === process.resolvedSiteId)
    .sort((left, right) => left.name.localeCompare(right.name)));
  const orderedAssignments = $derived([...assignments].sort((left, right) => {
    if (left.relationshipType === "Primary") return -1;
    if (right.relationshipType === "Primary") return 1;
    return left.relationshipType.localeCompare(right.relationshipType) || left.locationId.localeCompare(right.locationId);
  }));

  function locationName(id: string) {
    return locations.find((item) => item.id === id)?.name ?? `Missing Location ${id}`;
  }

  async function addAssignment() {
    saving = true;
    error = null;
    try {
      await services.processLocationAssignments.create({
        processId: process.id,
        locationId,
        relationshipType,
        sequence: sequence ? Number(sequence) : null,
        effectiveFrom: effectiveFrom || null,
        effectiveTo: effectiveTo || null,
        status: "Active",
        notes,
      });
      locationId = "";
      sequence = "";
      effectiveFrom = "";
      effectiveTo = "";
      notes = "";
      await onChanged();
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
    } finally {
      saving = false;
    }
  }

  async function endAssignment(assignment: ProcessLocationAssignment) {
    pendingId = assignment.id;
    error = null;
    try {
      const today = new Date().toISOString().slice(0, 10);
      await services.processLocationAssignments.update(assignment.id, {
        ...assignment,
        effectiveTo: assignment.effectiveFrom && assignment.effectiveFrom > today
          ? assignment.effectiveFrom
          : today,
        status: "Inactive",
      }, assignment.revision);
      await onChanged();
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
    } finally {
      pendingId = null;
    }
  }
</script>

<section class="process-locations" aria-labelledby="process-locations-title">
  <div class="panel-heading">
    <div>
      <span>Same-Site workflow</span>
      <h2 id="process-locations-title">Process Locations</h2>
      <p>The Primary assignment follows the Process. Add Source, Destination, Transfer Path, Storage, or other supporting Locations at the same Site.</p>
    </div>
  </div>

  {#if error}<p class="error" role="alert">{error}</p>{/if}

  <ul class="assignment-list">
    {#each orderedAssignments as assignment (assignment.id)}
      <li class:inactive={assignment.status !== "Active" || assignment.lifecycleStatus === "archived"}>
        <div><strong>{locationName(assignment.locationId)}</strong><span>{assignment.relationshipType}</span></div>
        <small>
          {assignment.effectiveFrom ?? "Beginning unknown"} → {assignment.effectiveTo ?? "Current"}
          {assignment.sequence !== null ? ` · Sequence ${assignment.sequence}` : ""}
        </small>
        {#if assignment.relationshipType === "Primary"}
          <span class="primary-label">Managed by Process</span>
        {:else if assignment.lifecycleStatus === "active" && assignment.status === "Active"}
          <button type="button" disabled={pendingId !== null} onclick={() => void endAssignment(assignment)}>
            {pendingId === assignment.id ? "Ending…" : "End assignment"}
          </button>
        {:else}
          <span class="history-label">Historical</span>
        {/if}
      </li>
    {/each}
  </ul>

  <form class="assignment-form" aria-label="Add Process Location" onsubmit={(event) => { event.preventDefault(); void addAssignment(); }}>
    <label>Supporting Location
      <select bind:value={locationId} required disabled={saving || process.lifecycleStatus === "archived"}>
        <option value="">Select…</option>
        {#each eligibleLocations as location}<option value={location.id}>{location.name} · {location.nodeType}</option>{/each}
      </select>
    </label>
    <label>Relationship
      <select bind:value={relationshipType} disabled={saving || process.lifecycleStatus === "archived"}>
        {#each relationshipOptions as option}<option value={option}>{option}</option>{/each}
      </select>
    </label>
    <label>Sequence <input bind:value={sequence} type="number" min="0" inputmode="numeric" disabled={saving || process.lifecycleStatus === "archived"} /></label>
    <label>Effective from <input bind:value={effectiveFrom} type="date" disabled={saving || process.lifecycleStatus === "archived"} /></label>
    <label>Effective to <input bind:value={effectiveTo} type="date" disabled={saving || process.lifecycleStatus === "archived"} /></label>
    <label class="notes">Notes <input bind:value={notes} disabled={saving || process.lifecycleStatus === "archived"} /></label>
    <button type="submit" disabled={saving || process.lifecycleStatus === "archived"}>{saving ? "Adding…" : "Add supporting Location"}</button>
  </form>
  <p class="history-note">Ending an assignment retains its effective-dated history and does not delete Tasks, Chemical Uses, or Exposure Scenarios.</p>
</section>

<style>
  .process-locations { display: grid; gap: 14px; margin-bottom: 16px; padding: 18px; border: 1px solid var(--glass-border-subtle); border-radius: var(--radius-surface); background: rgba(12, 23, 26, .78); }
  .panel-heading > div { display: grid; gap: 4px; }
  .panel-heading span { color: var(--color-accent-strong); font-size: .7rem; font-weight: 760; text-transform: uppercase; }
  h2, p { margin: 0; }
  p, small, label { color: var(--color-muted); }
  .assignment-list { display: grid; gap: 7px; margin: 0; padding: 0; list-style: none; }
  .assignment-list li { display: grid; grid-template-columns: minmax(180px, 1fr) minmax(200px, auto) auto; align-items: center; gap: 12px; border: 1px solid var(--glass-border-subtle); border-radius: var(--radius-control); padding: 10px 12px; }
  .assignment-list li.inactive { opacity: .7; }
  .assignment-list li > div { display: flex; align-items: baseline; flex-wrap: wrap; gap: 8px; }
  .assignment-list li > div span { color: var(--color-accent-strong); font-size: .72rem; font-weight: 720; }
  .primary-label, .history-label { color: var(--color-muted); font-size: .72rem; font-weight: 720; }
  .assignment-form { display: grid; grid-template-columns: 2fr 1.4fr .7fr 1fr 1fr; gap: 10px; align-items: end; border-top: 1px solid var(--glass-border-subtle); padding-top: 14px; }
  .assignment-form label { display: grid; gap: 5px; font-size: .72rem; font-weight: 720; }
  .assignment-form .notes { grid-column: 1 / -2; }
  select, input { min-width: 0; border: 1px solid var(--glass-border-subtle); border-radius: var(--radius-control); background: rgba(5, 12, 14, .68); color: var(--color-text); padding: 8px 9px; }
  button { border: 1px solid var(--color-accent-border); border-radius: var(--radius-control); background: var(--color-accent-soft); color: var(--color-accent-strong); padding: 8px 10px; font-weight: 720; }
  .history-note { font-size: .75rem; }
  .error { color: var(--color-danger-text); }
  @media (max-width: 900px) { .assignment-list li, .assignment-form { grid-template-columns: 1fr; } .assignment-form .notes { grid-column: auto; } }
</style>
