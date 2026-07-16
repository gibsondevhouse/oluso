<script lang="ts">
  import { ArrowLeft } from "lucide-svelte";

  interface Props {
    href: string;
    label?: string;
    onNavigate?: () => void;
  }

  let { href, label = "Back to list", onNavigate }: Props = $props();

  function handleClick(event: MouseEvent) {
    if (!onNavigate) {
      return;
    }

    event.preventDefault();
    onNavigate();
  }
</script>

<a class="secondary-button" {href} onclick={handleClick}>
  <ArrowLeft size={16} aria-hidden="true" />
  {label}
</a>
