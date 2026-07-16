<script lang="ts">
  import { ArrowLeft, Plus } from "lucide-svelte";

  interface Props {
    registerName: string;
    recordId: string;
    listPath: string;
    createPath?: string;
  }

  let { registerName, recordId, listPath, createPath }: Props = $props();
</script>

<section class="empty-state">
  <h2>{registerName} record was not found</h2>
  <p>Attempted record ID: {recordId}</p>
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
