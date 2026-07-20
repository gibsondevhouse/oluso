<script lang="ts">
  import RecordNotFoundState from "$lib/components/register/RecordNotFoundState.svelte";

  interface Props {
    registerName: string;
    listPath: string;
    createPath?: string;
  }

  let { registerName, listPath, createPath }: Props = $props();
</script>

<section class="page" aria-labelledby="record-not-found-title">
  <header class="page-header">
    <div class="breadcrumbs">{registerName}</div>
    <h1 class="page-title" id="record-not-found-title">Record not found</h1>
    <p class="page-summary">
      The requested {registerName.toLowerCase()} record could not be found.
    </p>
  </header>

  <RecordNotFoundState {registerName} {listPath} {createPath} />
</section>
