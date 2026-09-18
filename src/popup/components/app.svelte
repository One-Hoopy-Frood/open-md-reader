<script lang="ts">
  import debounce from 'lodash.debounce'
  import storage from '@/core/storage'
  import Warning from './warning.svelte'
  import Header from './header.svelte'
  import Radio from '@smui/radio'
  import Switch from '@smui/switch'
  import FormField from '@smui/form-field'
  import Select, { Option } from '@smui/select'
  import Chip, { Set, Text } from '@smui/chips'
  import MD_PLUGINS from '@/config/md-plugins'
  import PAGE_THEMES from '@/config/page-themes'
  import { getDefaultData, type Data } from '@/core/data'
  import pkg from '../../../package.json'
  import i18n from '@/config/i18n'

  let localize = i18n()
  let homepage = pkg.homepage
  let isAllowViewFile = true
  let data = getDefaultData()

  // Get if file allowed access
  chrome.extension.isAllowedFileSchemeAccess(
    (isAllow: boolean) => (isAllowViewFile = !!isAllow),
  )

  storage.get().then((_data: Data) => {
    // need an assignment to updata UI
    data = { ...data, ..._data }
  })

  $: if (data.language) {
    updateConfig('language', data.language)
    changeLocale(data.language)
  }

  function updateConfig(key, value) {
    setTimeout(() => {
      chrome.runtime.sendMessage({ action: 'storage', data: { key, value } })
    }, 0)
  }

  const updateCustomCss = debounce((value: string) => {
    updateConfig('customCss', value)
  }, 400)

  function resetCustomCss() {
    data.customCss = ''
    updateCustomCss.cancel()
    updateConfig('customCss', '')
  }

  function changeLocale(language) {
    localize = i18n(language)
  }
</script>

<main>
  <Header {homepage} />

  {#if !isAllowViewFile}
    <Warning {localize} />
  {/if}

  <div class="form" disabled={!data.enable}>
    <div class="form-item inline">
      <span class="label-item">{localize('label_enable')}:</span>
      <FormField align="end">
        <Switch
          bind:checked={data.enable}
          color="primary"
          on:change={() => updateConfig('enable', data.enable)}
        />
      </FormField>
    </div>

    <div class="form-item inline">
      <span class="label-item">{localize('label_centered')}:</span>
      <FormField align="end">
        <Switch
          disabled={!data.enable}
          bind:checked={data.centered}
          color="primary"
          on:change={() => updateConfig('centered', data.centered)}
        />
      </FormField>
    </div>

    <div class="form-item inline">
      <span class="label-item">{localize('label_auto-refresh')}:</span>
      <FormField align="end">
        <Switch
          disabled={!data.enable}
          bind:checked={data.refresh}
          color="primary"
          on:change={() => updateConfig('refresh', data.refresh)}
        />
      </FormField>
    </div>

    <div class="form-item">
      <div class="label-item">{localize('label_md-plugins')}:</div>
      <Set
        let:chip
        bind:selected={data.mdPlugins}
        chips={MD_PLUGINS}
        nonInteractive={!data.enable}
        filter={data.enable}
      >
        <Chip
          {chip}
          title={chip}
          on:click={() =>
            data.enable && updateConfig('mdPlugins', data.mdPlugins)}
          ><Text>{localize(chip)}</Text></Chip
        >
      </Set>
    </div>

    <div class="form-item">
      <div class="label-item css-head">
        <span>{localize('label_custom-css')}:</span>
        {#if data.customCss}
          <button
            class="reset-btn"
            type="button"
            disabled={!data.enable}
            on:click={resetCustomCss}>reset</button
          >
        {/if}
      </div>
      <textarea
        class="css-input"
        spellcheck="false"
        disabled={!data.enable}
        placeholder={'h2 { border-bottom: none; }\nhr { display: none; }'}
        bind:value={data.customCss}
        on:input={() => data.enable && updateCustomCss(data.customCss)}
      />
    </div>

    <div class="form-item">
      <div class="label-item">{localize('label_theme')}:</div>
      {#each PAGE_THEMES as mode}
        <FormField>
          <span slot="label"> {localize(mode)} </span>
          <Radio
            disabled={!data.enable}
            bind:group={data.pageTheme}
            bind:value={mode}
            on:change={() => updateConfig('pageTheme', mode)}
          />
        </FormField>
      {/each}
    </div>

    <div class="form-item">
      <div class="label-item">{localize('label_language')}:</div>
      <FormField style="padding-left: 10px">
        <Select bind:value={data.language}>
          {#each i18n.locales as locale}
            <Option value={locale}>{localize(locale)}</Option>
          {/each}
        </Select>
      </FormField>
    </div>
  </div>
</main>

<style>
  main {
    overflow: auto;
    box-sizing: border-box;
    width: 330px;
    max-height: 599px;
    padding: 22px 24px 10px;
    border: 1px solid #24315870;
    border-radius: 1px;
  }
  .form-item {
    margin-bottom: 6px;
  }
  .form-item.inline {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
  }
  .label-item {
    font-weight: bolder;
    font-size: 13px;
    color: #243158e3;
  }
  .css-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }
  .reset-btn {
    font: inherit;
    font-weight: normal;
    font-size: 11px;
    padding: 1px 7px;
    color: #243158b0;
    background: #2431580d;
    border: 1px solid #24315826;
    border-radius: 3px;
    cursor: pointer;
  }
  .reset-btn:hover:not(:disabled) {
    color: #243158e3;
    background: #24315817;
  }
  .reset-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  .css-input {
    box-sizing: border-box;
    display: block;
    width: 100%;
    min-height: 84px;
    max-height: 260px;
    resize: vertical;
    padding: 7px 9px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 11.5px;
    line-height: 1.5;
    tab-size: 2;
    color: #243158e3;
    background: #fbfbfd;
    border: 1px solid #24315833;
    border-radius: 3px;
  }
  .css-input:focus {
    outline: none;
    border-color: #607cd2;
    background: #fff;
  }
  .css-input:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
  .css-input::placeholder {
    color: #24315870;
  }
</style>
