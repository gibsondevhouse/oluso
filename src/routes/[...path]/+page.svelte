<script lang="ts">
  import RouteOutlet from "$lib/pages/RouteOutlet.svelte";

  interface Props {
    data: import("./$types").PageData;
  }

  let { data }: Props = $props();
</script>

<RouteOutlet route={data.route} />
