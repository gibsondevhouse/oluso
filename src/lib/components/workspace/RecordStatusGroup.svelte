<script lang="ts">
  import { CheckCircle2, CircleDashed, Cloud, Info, TriangleAlert } from "lucide-svelte";
  export type StatusTone = "positive" | "warning" | "critical" | "information" | "neutral";
  export interface RecordStatus { label: string; value: string; tone?: StatusTone; }
  interface Props { statuses: RecordStatus[]; }
  let { statuses }: Props = $props();
  const icons = { positive: CheckCircle2, warning: TriangleAlert, critical: TriangleAlert, information: Info, neutral: CircleDashed };
</script>

<dl class="status-group" aria-label="Record states">
  {#each statuses as status}
    {@const tone = status.tone ?? "neutral"}
    {@const Icon = status.label.toLowerCase().includes("sync") ? Cloud : icons[tone]}
    <div class:positive={tone === "positive"} class:warning={tone === "warning"} class:critical={tone === "critical"} class:information={tone === "information"}>
      <Icon size={14} aria-hidden="true" />
      <dt>{status.label}</dt><dd>{status.value}</dd>
    </div>
  {/each}
</dl>

<style>
  .status-group { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; }
  .status-group div { display: inline-grid; grid-template-columns: auto auto auto; align-items: center; gap: 5px; min-height: 28px; border: 1px solid var(--color-border); border-radius: 999px; background: var(--color-surface); color: var(--color-muted); padding: 3px 9px; }
  dt { font-size: .6875rem; font-weight: 700; text-transform: uppercase; }
  dd { margin: 0; color: var(--color-text); font-size: .75rem; font-weight: 700; }
  .positive { color: var(--color-positive-text) !important; border-color: var(--color-positive-border) !important; }
  .warning { color: var(--color-warning-text) !important; border-color: var(--color-warning-border) !important; }
  .critical { color: var(--color-danger) !important; border-color: var(--color-danger-border) !important; }
  .information { color: var(--color-info-text) !important; border-color: var(--color-info-border) !important; }
</style>
