<script lang="ts">
  import { ArrowLeft, Plus } from "lucide-svelte";

  interface Props {
    registerName: string;
    listPath: string;
    createPath?: string;
  }

  let { registerName, listPath, createPath }: Props = $props();
</script>

<section class="empty-state">
  <h2>{registerName} record was not found</h2>
  <p>The record may have been archived, removed, or is not available in this workspace.</p>
  <div class="action-row">
    <a class="button-link" href={listPath}>
      <ArrowLeft size={16} aria-hidden="true" />
      Back to register list
    </a>
    {#if createPath}
      <a class="secondary-button" href={createPath}>
        <Plus size={16} aria-hidden="true" />
        Create new record
      </a>
    {/if}
  </div>
</section>
