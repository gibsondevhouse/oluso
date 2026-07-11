<script lang="ts">
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
    <a class="button-link" href={listPath}>Back to register list</a>
    {#if createPath}
      <a class="secondary-button" href={createPath}>Create new record</a>
    {/if}
  </div>
</section>
