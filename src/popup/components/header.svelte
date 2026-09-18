<script>
  import Icon from './icon.svelte'
  import logoIcon from '@/images/logo-stroke.svg'
</script>

<h1>
  <Icon class="icon-logo" svg={logoIcon} />
  <span>OPEN MD READER</span>
</h1>

<style>
  h1 {
    display: flex;
    align-items: center;
    padding: 0 0 22px;
    margin: 0;
    font-size: 18px;
    color: #35363a;
  }
  h1 span {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  h1 :global(.icon-logo) {
    width: 22px;
    height: 22px;
    margin-right: 6px;
  }
</style>
