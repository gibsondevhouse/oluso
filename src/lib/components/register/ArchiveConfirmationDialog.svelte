<script lang="ts">
  import ConfirmDialog from "$lib/components/ui/ConfirmDialog.svelte";

  interface Props {
    action: "archive" | "restore";
    recordTitle: string;
    onConfirm: () => void;
    onCancel: () => void;
  }

  let { action, recordTitle, onConfirm, onCancel }: Props = $props();

  const isArchive = $derived(action === "archive");
  const title = $derived(isArchive ? "Archive record?" : "Restore record?");
  const message = $derived(
    isArchive
      ? `Archive ${recordTitle}? It will be hidden from default register lists.`
      : `Restore ${recordTitle} to default register lists?`,
  );
  const confirmLabel = $derived(isArchive ? "Archive" : "Restore");
</script>

<ConfirmDialog
  {title}
  {message}
  {confirmLabel}
  danger={isArchive}
  {onConfirm}
  {onCancel}
/>
