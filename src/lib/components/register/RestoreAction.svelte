<script lang="ts">
  interface Props {
    onRestore: () => void;
  }

  let { onRestore }: Props = $props();
</script>

<button class="secondary-button" type="button" onclick={onRestore}>Restore</button>
