<script lang="ts">
  export interface ScopeOption { value: string; label: string; context?: string; }
  interface Props { label: string; value?: string; options: ScopeOption[]; allLabel: string; disabled?: boolean; onChange: (value: string) => void; }
  let { label, value = "", options, allLabel, disabled = false, onChange }: Props = $props();
</script>

<label class="scope-picker"><span>{label}</span><select {disabled} value={value} onchange={(event) => onChange(event.currentTarget.value)} aria-label={`${label} scope`}><option value="">{allLabel}</option>{#each options as option}<option value={option.value}>{option.label}{option.context ? ` — ${option.context}` : ""}</option>{/each}</select></label>

<style>
  .scope-picker { display: grid; gap: 3px; min-width: 150px; }
  span { color: var(--color-muted); font-size: .625rem; font-weight: 750; letter-spacing: .055em; line-height: 1; text-transform: uppercase; }
  select { width: 100%; min-height: 30px; border: 0; border-radius: var(--radius-control); background: transparent; color: var(--color-text); font-size: .8125rem; font-weight: 650; padding: 2px 24px 2px 4px; }
  select:hover, select:focus { background: var(--color-surface); }
</style>
