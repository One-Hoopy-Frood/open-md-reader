<script lang="ts">
  import debounce from 'lodash.debounce'
  import storage from '@/core/storage'
  import Warning from './warning.svelte'
  import Header from './header.svelte'
  import Radio from '@smui/radio'
  import Switch from '@smui/switch'
  import FormField from '@smui/form-field'
  import Chip, { ChipSet, Text } from '@smui/chips'
  import MD_PLUGINS from '@/config/md-plugins'
  import PAGE_THEMES from '@/config/page-themes'
  import { getDefaultData, type Data } from '@/core/data'
  import i18n from '@/config/i18n'

  const localize = i18n()

  let isAllowViewFile = $state(true)
  let data = $state(getDefaultData())
  let ready = $state(false)

  /* Serialised copy of what storage already holds, so the effect below can
     tell a real user change from a reactive re-read. Not $state on purpose;
     mutating it must not retrigger the effect that writes to it. */
  const lastSaved: Record<string, string> = {}

  chrome.extension.isAllowedFileSchemeAccess(
    (isAllow: boolean) => (isAllowViewFile = !!isAllow),
  )

  storage.get().then((stored: Data) => {
    Object.assign(data, stored)
    /* Seed the baseline before the effect goes live. Without this the first
       run would re-save every key, and saving 'enable' maps to the 'reload'
       action in background.ts, so merely opening the popup would reload the
       document tab. */
    for (const [key, value] of Object.entries($state.snapshot(data))) {
      lastSaved[key] = JSON.stringify(value)
    }
    ready = true
  })

  function updateConfig(key: string, value: unknown) {
    setTimeout(() => {
      chrome.runtime.sendMessage({ action: 'storage', data: { key, value } })
    }, 0)
  }

  const saveCustomCss = debounce((value: string) => {
    updateConfig('customCss', value)
  }, 400)

  /* Persistence is driven from state rather than from component events.
     SMUI 9 renamed every event (SMUISwitch:change became SMUISwitchChange,
     used as an onSMUISwitchChange prop), and the names differ per
     component. Watching the bound values instead means this keeps working
     regardless of what SMUI calls its events, and bind: is the part of the
     API that did survive the migration unchanged. */
  $effect(() => {
    /* Read every key first, so this effect depends on all of them. The
       early return must come after the reads or the dependencies are never
       registered. */
    const current = $state.snapshot(data) as Record<string, unknown>

    if (!ready) {
      return
    }

    for (const [key, value] of Object.entries(current)) {
      const serialised = JSON.stringify(value)
      if (lastSaved[key] === serialised) {
        continue
      }
      lastSaved[key] = serialised
      if (key === 'customCss') {
        /* Debounced so typing does not message the tab on every keystroke.
           lodash.debounce calls with the last arguments it received, so the
           final value is the one that lands. */
        saveCustomCss(value as string)
      } else {
        updateConfig(key, value)
      }
    }
  })

  function resetCustomCss() {
    saveCustomCss.cancel()
    data.customCss = ''
    updateConfig('customCss', '')
    lastSaved.customCss = JSON.stringify('')
  }
</script>

<main>
  <Header />

  {#if !isAllowViewFile}
    <Warning {localize} />
  {/if}

  <!-- A class, not a disabled attribute. Svelte 4 rendered
       disabled={false} on a div as disabled="false", which index.css
       matched with .form[disabled='false']. Svelte 5 treats disabled as a
       boolean attribute and drops it when false, so that selector stopped
       matching and every chip stayed dimmed at opacity 0.54. disabled was
       never valid on a div anyway. -->
  <div class="form" class:form--disabled={!data.enable}>
    <div class="form-item inline">
      <span class="label-item">{localize('label_enable')}:</span>
      <FormField align="end">
        <Switch bind:checked={data.enable} color="primary" />
      </FormField>
    </div>

    <div class="form-item inline">
      <span class="label-item">{localize('label_centered')}:</span>
      <FormField align="end">
        <Switch
          disabled={!data.enable}
          bind:checked={data.centered}
          color="primary"
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
        />
      </FormField>
    </div>

    <div class="form-item">
      <div class="label-item">{localize('label_md-plugins')}:</div>
      <!-- SMUI 9 renamed this component from Set to ChipSet, and replaced
           let:chip with a chip snippet. The legacy Set export still renders
           chips, which is why they appeared, but it does not wire up the
           selected binding.

           filter is a mode, not a state, so it is set unconditionally.
           Making it conditional on enable stripped the selection styling
           whenever the extension was switched off. Interactivity is
           controlled by nonInteractive instead. -->
      <ChipSet
        chips={MD_PLUGINS}
        filter
        bind:selected={data.mdPlugins}
        nonInteractive={!data.enable}
      >
        {#snippet chip(chip)}
          <Chip {chip} title={chip}>
            <Text>{localize(chip)}</Text>
          </Chip>
        {/snippet}
      </ChipSet>
    </div>

    <div class="form-item">
      <div class="label-item css-head">
        <span>{localize('label_custom-css')}:</span>
        {#if data.customCss}
          <button
            class="reset-btn"
            type="button"
            disabled={!data.enable}
            onclick={resetCustomCss}>reset</button
          >
        {/if}
      </div>
      <!-- Not self-closing. Svelte 5 warns on self-closing non-void HTML
           elements, and textarea is not void. -->
      <textarea
        class="css-input"
        spellcheck="false"
        disabled={!data.enable}
        placeholder={'h2 { color: teal; }\ntable { font-size: 13px; }'}
        bind:value={data.customCss}
      ></textarea>
      <div class="css-force">
        <FormField>
          <Switch
            disabled={!data.enable}
            bind:checked={data.forceCustomCss}
            color="primary"
          />
          {#snippet label()}
            <span class="css-force-label">
              {localize('label_force-custom-css')}
            </span>
          {/snippet}
        </FormField>
      </div>
    </div>

    <div class="form-item">
      <div class="label-item">{localize('label_theme')}:</div>
      {#each PAGE_THEMES as mode}
        <FormField>
          <Radio
            disabled={!data.enable}
            bind:group={data.pageTheme}
            value={mode}
          />
          {#snippet label()}{localize(mode)}{/snippet}
        </FormField>
      {/each}
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
  .css-force {
    margin-top: 2px;
  }
  .css-force-label {
    font-weight: normal;
    font-size: 11.5px;
    color: #243158b0;
  }
</style>
