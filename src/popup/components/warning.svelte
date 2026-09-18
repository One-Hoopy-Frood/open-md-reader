<script lang="ts">
  // Svelte 5: export let becomes $props(). This component still compiled
  // under legacy mode, but converting it means no component in the project
  // relies on the old API.
  let { localize }: { localize: (field: string) => string } = $props()
</script>

<div class="warning">
  <p>{localize('warning_message')}</p>
</div>

<style>
  .warning {
    font-size: 12px;
    padding: 8px 10px;
    border: 1px solid currentColor;
    border-radius: 4px;
    margin: -10px 0px 15px;
    background: #fff1f0;
    color: #ff493c;
  }
  .warning p {
    margin: 0;
  }
</style>
