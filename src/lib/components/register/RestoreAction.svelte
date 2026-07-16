<script lang="ts">
  import { RotateCcw } from "lucide-svelte";

  interface Props {
    onRestore: () => void;
  }

  let { onRestore }: Props = $props();
</script>

<button class="secondary-button" type="button" onclick={onRestore}>
  <RotateCcw size={16} aria-hidden="true" />
  Restore
</button>
