<script lang="ts">
  import { AlertTriangle, Check, CloudOff, LoaderCircle } from "lucide-svelte";
  export type SaveStateKind = "saved" | "saving" | "unsaved" | "offline" | "error" | "backup";
  interface Props { state: SaveStateKind; compact?: boolean; }
  let { state, compact = false }: Props = $props();
  const copy = { saved: "Saved locally", saving: "Saving…", unsaved: "Unsaved changes", offline: "Offline ready", error: "Save needs attention", backup: "Backup recommended" };
  const icons = { saved: Check, saving: LoaderCircle, unsaved: AlertTriangle, offline: CloudOff, error: AlertTriangle, backup: AlertTriangle };
  const Icon = $derived(icons[state]);
</script>

<span class="save-state" class:compact class:warning={state === "unsaved" || state === "backup"} class:error={state === "error"}><span class:spin={state === "saving"}><Icon size={14} /></span><span>{copy[state]}</span></span>

<style>
  .save-state { display: inline-flex; align-items: center; gap: 6px; min-height: 28px; border: 1px solid var(--color-positive-border); border-radius: 999px; background: var(--color-positive-soft); color: var(--color-positive-text); font-size: .75rem; font-weight: 700; padding: 3px 9px; white-space: nowrap; }
  .warning { border-color: var(--color-warning-border); background: var(--color-warning-soft); color: var(--color-warning-text); } .error { border-color: var(--color-danger-border); background: var(--color-danger-soft); color: var(--color-danger); }
  .compact { border: 0; background: transparent; padding-inline: 4px; } .spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }
</style>
