<script>
  // Svelte 5: export let plus the export { x as class } trick becomes a
  // single $props() destructure. "class" is a reserved word, so it is
  // renamed on the way in.
  let { svg, class: className } = $props()
</script>

<svg {...svg.attributes} class={className}>
  {@html svg.content}
</svg>

<style>
  svg {
    display: inline-block;
    fill: currentColor;
  }
</style>
