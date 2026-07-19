<script lang="ts">
  import type { FoundationServices } from "$lib/application/foundation";
  import { assignmentIsEffective, type LocationFunctionAssignment, type OperationalFunction } from "$lib/domain/operations";
  import type { Location } from "$lib/domain/location";

  interface Props {
    location: Location;
    functions: OperationalFunction[];
    assignments: LocationFunctionAssignment[];
    services: FoundationServices;
    onChanged: () => void | Promise<void>;
  }

  let { location, functions, assignments, services, onChanged }: Props = $props();
  let query = $state("");
  let pendingId = $state<string | null>(null);
  let error = $state<string | null>(null);

  const activeByFunction = $derived(new Map(
    assignments.filter((assignment) => assignmentIsEffective(assignment)).map((assignment) => [assignment.operationalFunctionId, assignment]),
  ));
  const visibleFunctions = $derived(functions
    .filter((item) => item.lifecycleStatus === "active" && item.status === "Active")
    .filter((item) => !query.trim() || `${item.name} ${item.functionCategory}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    .sort((left, right) => left.name.localeCompare(right.name)));

  async function toggle(item: OperationalFunction, checked: boolean) {
    pendingId = item.id;
    error = null;
    try {
      const current = activeByFunction.get(item.id);
      if (checked && !current) {
        await services.locationFunctionAssignments.create({
          locationId: location.id,
          operationalFunctionId: item.id,
          assignmentType: "Supporting Function",
          isPrimary: false,
          status: "Active",
        });
      } else if (!checked && current) {
        await services.locationFunctionAssignments.update(current.id, {
          ...current,
          effectiveTo: new Date().toISOString().slice(0, 10),
          status: "Inactive",
        }, current.revision);
      }
      await onChanged();
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
    } finally {
      pendingId = null;
    }
  }
</script>

<section class="function-panel" aria-labelledby="assigned-functions-title">
  <div class="panel-heading">
    <div>
      <span>Many-to-many capability</span>
      <h2 id="assigned-functions-title">Assigned Functions</h2>
      <p>One physical Location may support several operational Functions. Primary does not mean exclusive.</p>
    </div>
    <label>
      <span>Filter Functions</span>
      <input bind:value={query} type="search" placeholder="Packaging, Laboratory, Warehousing…" />
    </label>
  </div>

  {#if error}<p class="error" role="alert">{error}</p>{/if}
  <div class="function-grid">
    {#each visibleFunctions as item (item.id)}
      <label class:assigned={activeByFunction.has(item.id)}>
        <input
          type="checkbox"
          checked={activeByFunction.has(item.id)}
          disabled={pendingId !== null || location.lifecycleStatus === "archived"}
          onchange={(event) => void toggle(item, event.currentTarget.checked)}
        />
        <span>
          <strong>{item.name}</strong>
          <small>{activeByFunction.get(item.id)?.assignmentType ?? item.functionCategory}</small>
        </span>
      </label>
    {/each}
  </div>
  <p class="history-note">Ended assignments remain in Record History and are never deleted by this panel.</p>
</section>

<style>
  .function-panel { display: grid; gap: 14px; margin-bottom: 16px; padding: 18px; border: 1px solid var(--glass-border-subtle); border-radius: var(--radius-surface); background: rgba(12, 23, 26, .78); }
  .panel-heading { display: flex; align-items: end; justify-content: space-between; gap: 18px; }
  .panel-heading > div { display: grid; gap: 4px; }
  .panel-heading > div > span { color: var(--color-accent-strong); font-size: .7rem; font-weight: 760; text-transform: uppercase; }
  h2, p { margin: 0; }
  p, small, label > span { color: var(--color-muted); }
  .panel-heading label { display: grid; gap: 5px; min-width: min(320px, 100%); font-size: .75rem; font-weight: 700; }
  input[type="search"] { border: 1px solid var(--glass-border-subtle); border-radius: var(--radius-control); background: rgba(5, 12, 14, .68); color: inherit; padding: 9px 11px; }
  .function-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 8px; }
  .function-grid label { display: flex; align-items: center; gap: 10px; border: 1px solid var(--glass-border-subtle); border-radius: var(--radius-control); padding: 10px 12px; background: rgba(4, 10, 12, .3); }
  .function-grid label.assigned { border-color: var(--color-positive-border); background: var(--color-positive-soft); }
  .function-grid label span { display: grid; gap: 2px; }
  .function-grid strong { color: var(--color-text); }
  .history-note { font-size: .75rem; }
  .error { color: var(--color-danger-text); }
  @media (max-width: 720px) { .panel-heading { align-items: stretch; flex-direction: column; } }
</style>
