<script lang="ts">
  import { goto } from "$app/navigation";
  import { tick } from "svelte";
  import { ArrowRight, FileSearch, Search } from "lucide-svelte";
  import { corporateFade, corporateSlideFly } from "$lib/transitions";
  import {
    filterCommandIntents,
    getCommandIntents,
    type CommandGroup,
    type CommandIntent,
  } from "$lib/navigation/command-intents";
  import { readRecentNavigation } from "$lib/navigation/recent-navigation";
  import { olusoApplication } from "../../../application/oluso-application";
  import { searchAllRegisters, sortGlobalSearchResults } from "$lib/search/global-search";

  interface Props {
    open: boolean;
    onClose: () => void;
  }

  let { open, onClose }: Props = $props();
  let query = $state("");
  let selectedIndex = $state(0);
  let inputElement = $state<HTMLInputElement | null>(null);
  let recentCommands = $state<CommandIntent[]>([]);

  const groups: CommandGroup[] = [
    "Navigate",
    "Recent",
    "Search records",
    "Create / start",
    "Current context",
    "Help / shortcuts",
  ];
  const baseCommands = getCommandIntents();
  const normalizedQuery = $derived(query.trim());
  const recordCommands = $derived(buildRecordCommands(normalizedQuery));
  const filteredRecentCommands = $derived(filterCommandIntents(recentCommands, normalizedQuery));
  const commands = $derived([
    ...filteredRecentCommands,
    ...filterCommandIntents(baseCommands, normalizedQuery),
    ...recordCommands,
  ].slice(0, 12));

  $effect(() => {
    if (!open) {
      query = "";
      selectedIndex = 0;
      return;
    }

    void tick().then(() => inputElement?.focus());
    recentCommands = readRecentNavigation().map((item) => ({
      id: `recent-${item.path}`,
      title: item.title,
      description: `Recently opened; ${item.summary}`,
      group: "Recent" as const,
      href: item.path,
      keywords: [item.path, item.summary, "recent"],
    }));
  });

  $effect(() => {
    query;
    selectedIndex = 0;
  });

  function buildRecordCommands(value: string): CommandIntent[] {
    if (value.length < 2) return [];

    try {
      return sortGlobalSearchResults(searchAllRegisters(olusoApplication, value))
        .slice(0, 5)
        .map((result) => ({
          id: `record-${result.id}`,
          title: result.recordTitle,
          description: `${result.registerTitle}; ${result.sourceLabel}; ${result.matchedField}`,
          group: "Search records" as const,
          href: result.href,
          keywords: [result.registerTitle, result.statusLabel, result.matchedText],
        }));
    } catch {
      return [];
    }
  }

  function commandsFor(group: CommandGroup) {
    return commands.filter((command) => command.group === group);
  }

  async function runCommand(command: CommandIntent) {
    onClose();

    try {
      await goto(command.href);
    } catch {
      if (typeof window !== "undefined") {
        window.location.href = command.href;
      }
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      selectedIndex = commands.length ? (selectedIndex + 1) % commands.length : 0;
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      selectedIndex = commands.length
        ? (selectedIndex - 1 + commands.length) % commands.length
        : 0;
      return;
    }

    if (event.key === "Enter" && commands[selectedIndex]) {
      event.preventDefault();
      void runCommand(commands[selectedIndex]);
    }
  }
</script>

{#if open}
  <div class="command-scrim corporate-dialog-backdrop backdrop-blur-xs" role="presentation" onclick={onClose} transition:corporateFade={{ duration: 100 }}></div>
  <div
    class="command-palette corporate-dialog-surface backdrop-blur-corporate"
    role="dialog"
    aria-modal="true"
    aria-labelledby="command-palette-title"
    tabindex="-1"
    onkeydown={handleKeydown}
    transition:corporateSlideFly={{ duration: 160, y: -4 }}
  >
    <div class="command-search">
      <Search size={18} aria-hidden="true" />
      <label class="sr-only" for="command-palette-input">Search commands and records</label>
      <input
        id="command-palette-input"
        bind:this={inputElement}
        bind:value={query}
        placeholder="Search commands and records"
        autocomplete="off"
      />
    </div>

    <h2 id="command-palette-title">Command Palette</h2>

    {#if commands.length}
      <div class="command-groups">
        {#each groups as group}
          {@const groupCommands = commandsFor(group)}
          {#if groupCommands.length}
            <section aria-labelledby={`command-group-${group.replace(/\W+/g, "-").toLowerCase()}`}>
              <h3 id={`command-group-${group.replace(/\W+/g, "-").toLowerCase()}`}>{group}</h3>
              <div class="command-list">
                {#each groupCommands as command}
                  {@const commandIndex = commands.indexOf(command)}
                  <button
                    type="button"
                    class:active={commandIndex === selectedIndex}
                    onclick={() => void runCommand(command)}
                  >
                    <FileSearch size={16} aria-hidden="true" />
                    <span>
                      <strong>{command.title}</strong>
                      <small>{command.description}</small>
                    </span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                {/each}
              </div>
            </section>
          {/if}
        {/each}
      </div>
    {:else}
      <p class="no-command">No command or record matches the current search.</p>
    {/if}
  </div>
{/if}

<style>
  .command-scrim {
    position: fixed;
    inset: 0;
    z-index: var(--z-depth-modal);
  }

  .command-palette {
    position: fixed;
    z-index: calc(var(--z-depth-modal) + 1);
    top: 68px;
    left: 50%;
    display: grid;
    width: min(680px, calc(100vw - 32px));
    max-height: min(720px, calc(100vh - 96px));
    gap: 12px;
    overflow: auto;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-surface);
    padding: 14px;
    transform: translateX(-50%);
  }

  .command-search {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 10px;
    border: 1px solid var(--color-field-border);
    border-radius: var(--radius-control);
    background: var(--color-field-bg);
    padding: 10px 12px;
  }

  .command-search input {
    width: 100%;
    border: 0;
    background: transparent;
    color: var(--color-text);
    outline: 0;
  }

  .command-palette h2 {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
  }

  .command-groups {
    display: grid;
    gap: 14px;
  }

  .command-groups h3 {
    margin: 0 0 6px;
    color: var(--color-muted);
    font-size: 0.75rem;
    font-weight: 780;
    text-transform: uppercase;
  }

  .command-list {
    display: grid;
    gap: 6px;
  }

  .command-list button {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    min-height: 52px;
    border: 1px solid transparent;
    border-radius: var(--radius-control);
    background: var(--color-surface-subtle);
    color: var(--color-text);
    padding: 9px 10px;
    text-align: left;
  }

  .command-list button:hover,
  .command-list button.active {
    border-color: var(--color-border-strong);
    background: var(--color-nav-active-bg);
  }

  .command-list strong,
  .command-list small {
    display: block;
    overflow-wrap: anywhere;
  }

  .command-list strong {
    font-size: 0.875rem;
    font-weight: 760;
  }

  .command-list small {
    color: var(--color-muted);
    font-size: 0.75rem;
    line-height: 1.35;
  }

  .no-command {
    margin: 0;
    color: var(--color-muted);
    font-size: 0.875rem;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
  }

  @media (max-width: 720px) {
    .command-palette {
      top: 56px;
      width: calc(100vw - 20px);
    }
  }
</style>
