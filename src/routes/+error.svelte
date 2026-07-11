<script lang="ts">
  import { page } from "$app/state";
  import ErrorPage from "$lib/pages/ErrorPage.svelte";

  const details = $derived({
    message: page.error?.message,
    stack: page.error instanceof Error ? page.error.stack : undefined,
  });
</script>

<ErrorPage {details} />
