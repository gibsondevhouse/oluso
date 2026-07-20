<script lang="ts">
  import { onMount } from "svelte";
  import { ArrowRight, BadgeAlert, ClipboardCheck, FileInput } from "lucide-svelte";
  import EmptyState from "$lib/components/feedback/EmptyState.svelte";
  import ErrorState from "$lib/components/feedback/ErrorState.svelte";
  import SummaryCard from "$lib/components/workspace/SummaryCard.svelte";
  import { getBrowserDatabase } from "$lib/data/database";
  import { readWorkspaceStore } from "$lib/workspace/idb-read";
  type QueueRecord = Record<string,unknown> & { id:string; title?:string; name?:string; businessId?:string; status?:string; reviewStatus?:string; severity?:string; message?:string; description?:string; recordType?:string; targetRecordType?:string; createdAt?:string; updatedAt?:string; };
  let reviews=$state<QueueRecord[]>([]);let findings=$state<QueueRecord[]>([]);let imports=$state<QueueRecord[]>([]);let loading=$state(true);let error=$state<string|null>(null);
  const openReviews=$derived(reviews.filter((item)=>!["Approved","Rejected","Closed","Complete"].includes(String(item.status??item.reviewStatus??"")))); const openFindings=$derived(findings.filter((item)=>!["Resolved","Closed","Accepted"].includes(String(item.status??"")))); const pendingImports=$derived(imports.filter((item)=>!["Complete","Completed","Rejected"].includes(String(item.status??""))));
  onMount(()=>{void load();}); async function load(){loading=true;error=null;try{const adapter=await getBrowserDatabase();[reviews,findings,imports]=await Promise.all([readWorkspaceStore<QueueRecord>(adapter.database,"reviews"),readWorkspaceStore<QueueRecord>(adapter.database,"data_quality_findings"),readWorkspaceStore<QueueRecord>(adapter.database,"import_runs")]);}catch(cause){error=cause instanceof Error?cause.message:String(cause);}finally{loading=false;}}
  function label(item:QueueRecord){return String(item.title??item.name??item.message??item.description??item.businessId??"Review item");}
</script>
<section class="review-page" aria-labelledby="review-title">
  <header><div><span>Review</span><h1 id="review-title">Review Queue</h1><p>One place for decisions, data-quality attention, and import follow-up across the current workspace.</p></div></header>
  {#if loading}
    <p role="status">Loading review queue…</p>
  {:else if error}
    <ErrorState message={error} onRetry={() => void load()}/>
  {:else}
    <div class="summary"><SummaryCard label="Awaiting review" value={openReviews.length} href="#reviews" tone={openReviews.length ? "attention" : "default"}/><SummaryCard label="Data-quality items" value={openFindings.length} href="/reports/data-quality" tone={openFindings.length ? "attention" : "default"}/><SummaryCard label="Imports needing review" value={pendingImports.length} href="/reports/import-runs" tone={pendingImports.length ? "attention" : "default"}/></div>
    <div class="queues">
      <section id="reviews"><h2><ClipboardCheck size={17}/>Awaiting review <span>{openReviews.length}</span></h2>{#if openReviews.length}<ul>{#each openReviews as item}<li><div><strong>{label(item)}</strong><small>{item.recordType ?? item.targetRecordType ?? "Record"} · {item.status ?? item.reviewStatus ?? "Pending"}</small></div><a href="/search">Open <ArrowRight size={14}/></a></li>{/each}</ul>{:else}<EmptyState title="Review queue is clear" message="No records are currently awaiting a review decision."/>{/if}</section>
      <section><h2><BadgeAlert size={17}/>Data Quality <span>{openFindings.length}</span></h2>{#if openFindings.length}<ul>{#each openFindings.slice(0,8) as item}<li><div><strong>{label(item)}</strong><small>{item.severity ?? "Needs review"} · {item.status ?? "Open"}</small></div><a href="/reports/data-quality">Review <ArrowRight size={14}/></a></li>{/each}</ul>{:else}<EmptyState title="No open data-quality findings" message="Explicit data-quality findings will appear here."/>{/if}</section>
      <section><h2><FileInput size={17}/>Imports <span>{pendingImports.length}</span></h2>{#if pendingImports.length}<ul>{#each pendingImports.slice(0,8) as item}<li><div><strong>{label(item)}</strong><small>{item.status ?? "Needs review"}</small></div><a href="/reports/import-runs">Review <ArrowRight size={14}/></a></li>{/each}</ul>{:else}<EmptyState title="No imports need review" message="Import runs that need mapping or acceptance will appear here."/>{/if}</section>
    </div>
  {/if}
</section>
<style>.review-page{width:min(100%,1440px);min-height:100%;margin:0 auto;padding:28px 30px 40px}header{margin-bottom:18px}header div{display:grid;gap:5px}header span{color:var(--color-action);font-size:.7rem;font-weight:750;text-transform:uppercase}h1,p{margin:0}h1{font-size:1.8rem}header p{max-width:720px;color:var(--color-muted);font-size:.875rem}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}.queues{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.queues>section{align-self:start;overflow:hidden;border:1px solid var(--color-border);border-radius:var(--radius-surface);background:var(--color-surface)}h2{display:flex;align-items:center;gap:7px;margin:0;border-bottom:1px solid var(--color-border);font-size:.88rem;padding:12px 14px}h2>span{margin-left:auto;border-radius:999px;background:var(--color-surface-muted);color:var(--color-muted);font-size:.68rem;padding:2px 6px}ul{margin:0;padding:0;list-style:none}li{display:grid;grid-template-columns:1fr auto;align-items:center;gap:9px;border-bottom:1px solid var(--color-border);padding:10px 13px}li:last-child{border-bottom:0}li div{display:grid;gap:2px}li strong{font-size:.78rem}li small{color:var(--color-muted);font-size:.68rem}li a{display:inline-flex;align-items:center;gap:4px;color:var(--color-action);font-size:.7rem;font-weight:750;text-decoration:none}@media(max-width:980px){.queues{grid-template-columns:1fr}}@media(max-width:680px){.review-page{padding:20px 15px 30px}.summary{grid-template-columns:1fr}}</style>
