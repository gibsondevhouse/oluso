<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { corporateFade } from "$lib/transitions";
  import { getBrowserDatabase, LOCAL_USER_ROLES, type LocalUserProfile } from "$lib/data/database";

  interface Props { mode: "profile" | "installation" }
  let { mode }: Props = $props();

  let loading = $state(true);
  let saving = $state(false);
  let error = $state<string | null>(null);
  let message = $state<string | null>(null);
  let displayName = $state("");
  let role = $state<LocalUserProfile["role"]>("HSE Coordinator");
  let initials = $state("");
  let employeeIdentifier = $state("");
  let email = $state("");
  let installationLabel = $state("");
  let hasProfile = $state(false);

  async function load() {
    loading = true;
    error = null;
    try {
      const adapter = await getBrowserDatabase();
      const [user, installation] = await Promise.all([
        adapter.localIdentity().getCurrentUser(),
        adapter.localIdentity().getInstallation(),
      ]);
      if (user) {
        hasProfile = true;
        displayName = user.displayName;
        role = user.role;
        initials = user.initials;
        employeeIdentifier = user.employeeIdentifier ?? "";
        email = user.email ?? "";
      }
      installationLabel = installation?.label ?? "";
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
    } finally {
      loading = false;
    }
  }

  async function saveProfile(event: SubmitEvent) {
    event.preventDefault();
    saving = true;
    error = null;
    message = null;
    try {
      const adapter = await getBrowserDatabase();
      const service = adapter.localIdentity();
      const input = { displayName, role, initials, employeeIdentifier, email };
      if (hasProfile) await service.updateUser(input);
      else await service.configureUser(input);
      hasProfile = true;
      window.dispatchEvent(new CustomEvent("adama-identity-ready"));
      message = "Local profile saved. Future changes will use this durable actor identity.";
      await goto("/home");
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
    } finally {
      saving = false;
    }
  }

  async function saveInstallation(event: SubmitEvent) {
    event.preventDefault();
    saving = true;
    error = null;
    message = null;
    try {
      const adapter = await getBrowserDatabase();
      await adapter.localIdentity().updateInstallationLabel(installationLabel);
      message = "Installation label saved.";
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
    } finally {
      saving = false;
    }
  }

  onMount(() => { void load(); });
</script>

<section class="page" aria-labelledby="identity-title">
  <header class="page-header">
    <div class="breadcrumbs">Settings / Local identity</div>
    <h1 class="page-title" id="identity-title">
      {mode === "profile" ? "Local user profile" : "Installation identity"}
    </h1>
    <p class="page-summary">
      {mode === "profile"
        ? "Name the person using this installation so every accepted mutation has durable attribution."
        : "Name this browser installation so exchanged records can be traced to their source device."}
    </p>
  </header>

  {#if loading}
    <div class="identity-card" role="status">Loading local identity…</div>
  {:else}
    <nav class="identity-tabs" aria-label="Identity settings">
      <a class:active={mode === "profile"} href="/settings/profile">Local profile</a>
      <a class:active={mode === "installation"} href="/settings/installation">Installation</a>
    </nav>

    {#if error}<p class="form-alert error" role="alert">{error}</p>{/if}
    {#if message}<p class="form-alert success" role="status">{message}</p>{/if}

    {#if mode === "profile"}
      <form class="identity-card" onsubmit={saveProfile} in:corporateFade={{ duration: 140 }}>
        <div class="field-grid">
          <label>Display name <input required bind:value={displayName} autocomplete="name" /></label>
          <label>Role
            <select bind:value={role}>
              {#each LOCAL_USER_ROLES as option}<option value={option}>{option}</option>{/each}
            </select>
          </label>
          <label>Initials <input required maxlength="8" bind:value={initials} /></label>
          <label>Employee identifier <input bind:value={employeeIdentifier} /></label>
          <label class="wide">Email <input type="email" bind:value={email} autocomplete="email" /></label>
        </div>
        <p class="identity-note">Changing a display name updates this profile only. Historical revisions retain the durable user ID that created them.</p>
        <button class="primary-button" type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</button>
      </form>
    {:else}
      <form class="identity-card" onsubmit={saveInstallation} in:corporateFade={{ duration: 140 }}>
        <label>Installation label <input required bind:value={installationLabel} /></label>
        <p class="identity-note">Examples: “HSE Coordinator laptop” or “Tifton HSE Manager workstation”.</p>
        <button class="primary-button" type="submit" disabled={saving}>{saving ? "Saving…" : "Save installation"}</button>
      </form>
    {/if}
  {/if}
</section>

<style>
  .page { display: grid; align-content: start; gap: 20px; max-width: 1040px; padding: 28px 32px 40px; }
  .identity-tabs { display: flex; gap: 24px; min-height: 41px; border-bottom: 1px solid var(--color-border); }
  .identity-tabs a { display: inline-flex; align-items: center; border: 0; border-bottom: 3px solid transparent; color: var(--color-muted); font-size: .875rem; font-weight: 680; padding: 0 2px 10px; text-decoration: none; }
  .identity-tabs a:hover { color: var(--color-text); }
  .identity-tabs a.active { border-bottom-color: var(--color-accent); color: var(--color-accent-strong); font-weight: 760; }
  .identity-card { display: grid; gap: 20px; border: 1px solid var(--color-border); border-radius: var(--radius-surface); background: var(--color-surface); box-shadow: var(--surface-shadow); padding: 24px; }
  .field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 20px; }
  label { display: grid; gap: 7px; color: var(--color-text); font-size: .8125rem; font-weight: 700; }
  label.wide { grid-column: 1 / -1; }
  input, select { min-height: 42px; border: 1px solid var(--color-field-border); border-radius: var(--radius-control); background: var(--color-field-bg); color: var(--color-text); padding: 8px 11px; transition: border-color var(--motion-duration-fast), box-shadow var(--motion-duration-fast); }
  input:hover, select:hover { border-color: var(--color-field-border-hover); }
  input:focus, select:focus { border-color: var(--color-focus); box-shadow: 0 0 0 3px var(--color-accent-soft); outline: 0; }
  .identity-note, .form-alert { margin: 0; color: var(--color-muted); font-size: .875rem; }
  .form-alert { border-radius: var(--radius-control); padding: 11px 13px; }
  .form-alert.error { color: var(--color-danger-text); background: var(--color-danger-soft); }
  .form-alert.success { color: var(--color-success-text); background: var(--color-success-soft); }
  .primary-button { justify-self: start; min-height: 40px; border: 1px solid var(--color-action); border-radius: var(--radius-control); background: var(--color-action); color: #fff; font-size: .875rem; font-weight: 760; padding: 0 16px; cursor: pointer; }
  .primary-button:hover:not(:disabled) { border-color: #005f34; background: #005f34; }
  @media (max-width: 640px) { .field-grid { grid-template-columns: 1fr; } label.wide { grid-column: auto; } }
</style>
