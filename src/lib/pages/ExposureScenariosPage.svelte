<script lang="ts">
  import { onMount } from "svelte";
  import { ArrowRight, Search, Waypoints } from "lucide-svelte";
  import { foundationApplication } from "$lib/application/foundation";
  import EmptyState from "$lib/components/feedback/EmptyState.svelte";
  import ErrorState from "$lib/components/feedback/ErrorState.svelte";
  import { getBrowserDatabase } from "$lib/data/database";
  import type { Location } from "$lib/domain/location";
  import type { OperationalFunction, Process, Task } from "$lib/domain/operations";
  import { workspaceScope } from "$lib/workspace/scope";
  import { readWorkspaceStore } from "$lib/workspace/idb-read";

  type Scenario = Record<string, unknown> & { id: string; businessId?: string; name?: string; title?: string; siteId?: string; locationId?: string; operationalFunctionId?: string; processId?: string; taskId?: string; segId?: string; operatingCondition?: string; status?: string; lifecycleStatus?: string; description?: string; };
  let scenarios = $state<Scenario[]>([]); let locations = $state<Location[]>([]); let functions = $state<OperationalFunction[]>([]); let processes = $state<Process[]>([]); let tasks = $state<Task[]>([]); let query = $state(""); let loading = $state(true); let error = $state<string|null>(null);
  const filtered = $derived(scenarios.filter((item) => item.lifecycleStatus !== "archived" && (!$workspaceScope.siteId || item.siteId === $workspaceScope.siteId || locations.find((location) => location.id === item.locationId)?.resolvedSiteId === $workspaceScope.siteId) && (!$workspaceScope.locationId || item.locationId === $workspaceScope.locationId) && (!$workspaceScope.operationalFunctionId || item.operationalFunctionId === $workspaceScope.operationalFunctionId) && `${label(item)} ${item.businessId ?? ""} ${item.operatingCondition ?? ""}`.toLowerCase().includes(query.toLowerCase())));
  onMount(() => { void load(); });
  async function load() { loading=true;error=null;try { const [services,adapter]=await Promise.all([foundationApplication.services(),getBrowserDatabase()]); [scenarios,locations,functions,processes,tasks]=await Promise.all([readWorkspaceStore<Scenario>(adapter.database,"exposure_scenarios"),services.locations.list(true),services.operationalFunctions.list(true),services.processes.list(true),services.tasks.list(true)]); } catch(cause){error=cause instanceof Error?cause.message:String(cause);}finally{loading=false;} }
  function label(item: Scenario){return String(item.name??item.title??item.businessId??"Exposure scenario");} function locationName(id?:string){return locations.find((item)=>item.id===id)?.name??"Location not documented";} function functionName(id?:string){return functions.find((item)=>item.id===id)?.name??"Function not documented";} function processName(id?:string){return processes.find((item)=>item.id===id)?.name??"Process not documented";} function taskName(id?:string){return tasks.find((item)=>item.id===id)?.name??"Task not documented";}
</script>

<section class="scenario-page" aria-labelledby="scenarios-title">
  <header>
    <div><span>Exposure</span><h1 id="scenarios-title">Exposure Scenarios</h1><p>See exposure conditions as a connected chain of place, Function, Process, Task, and work condition.</p></div>
    <a href="/ih/exposure-assessments">Open Assessments</a>
  </header>
  {#if loading}
    <p role="status">Loading exposure scenarios…</p>
  {:else if error}
    <ErrorState message={error} onRetry={() => void load()}/>
  {:else}
    <label class="search"><Search size={16}/><span class="visually-hidden">Search scenarios</span><input bind:value={query} placeholder="Search scenario or operating condition"/></label>
    {#if filtered.length}
      <div class="scenario-list">
        {#each filtered as scenario}
          <article>
            <div class="scenario-title"><span class="icon"><Waypoints size={18}/></span><div><h2>{label(scenario)}</h2><p>{scenario.description ?? scenario.operatingCondition ?? "Exposure context"}</p></div><span class="state">{scenario.status ?? "Draft"}</span></div>
            <div class="chain"><div><small>Location</small><strong>{locationName(scenario.locationId)}</strong></div><ArrowRight size={16}/><div><small>Function</small><strong>{functionName(scenario.operationalFunctionId)}</strong></div><ArrowRight size={16}/><div><small>Process</small><strong>{processName(scenario.processId)}</strong></div><ArrowRight size={16}/><div><small>Task</small><strong>{taskName(scenario.taskId)}</strong></div><ArrowRight size={16}/><div><small>Condition</small><strong>{scenario.operatingCondition ?? "Not documented"}</strong></div></div>
          </article>
        {/each}
      </div>
    {:else}
      <EmptyState title="No exposure scenarios match this scope" message="Exposure Scenarios will appear here with their complete operating chain once documented."/>
    {/if}
  {/if}
</section>

<style>.scenario-page{width:min(100%,1440px);min-height:100%;margin:0 auto;padding:28px 30px 40px}header{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:18px}header div{display:grid;gap:5px}header span{color:var(--color-action);font-size:.7rem;font-weight:750;text-transform:uppercase}h1,h2,p{margin:0}h1{font-size:1.8rem}header p{max-width:720px;color:var(--color-muted);font-size:.875rem}header>a{border:1px solid var(--color-border-strong);border-radius:var(--radius-control);color:var(--color-text);font-size:.8rem;font-weight:700;padding:8px 11px;text-decoration:none}.search{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:7px;max-width:480px;margin-bottom:14px;border:1px solid var(--color-border);border-radius:var(--radius-control);background:var(--color-surface);color:var(--color-muted);padding:0 9px}.search input{min-height:40px;border:0;background:transparent;outline:0}.scenario-list{display:grid;gap:10px}article{display:grid;gap:13px;border:1px solid var(--color-border);border-radius:var(--radius-surface);background:var(--color-surface);padding:14px}.scenario-title{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px}.scenario-title .icon{display:grid;place-items:center;width:36px;height:36px;border-radius:8px;background:var(--color-info-soft);color:var(--color-info-text)}.scenario-title h2{font-size:.95rem}.scenario-title p{color:var(--color-muted);font-size:.75rem}.state{border:1px solid var(--color-warning-border);border-radius:999px;background:var(--color-warning-soft);color:var(--color-warning-text);font-size:.68rem;font-weight:750;padding:4px 8px}.chain{display:grid;grid-template-columns:repeat(4,minmax(110px,1fr) auto) minmax(110px,1fr);align-items:center;gap:7px;border-top:1px solid var(--color-border);padding-top:11px}.chain div{display:grid;gap:2px}.chain small{color:var(--color-muted);font-size:.62rem;font-weight:750;text-transform:uppercase}.chain strong{overflow:hidden;font-size:.75rem;text-overflow:ellipsis;white-space:nowrap}.chain :global(svg){color:var(--color-action)}.visually-hidden{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}@media(max-width:950px){.chain{display:flex;align-items:stretch;overflow-x:auto}.chain div{min-width:140px}.chain :global(svg){flex:0 0 auto;margin:auto}}@media(max-width:680px){.scenario-page{padding:20px 15px 30px}header{align-items:stretch;flex-direction:column}}</style>
