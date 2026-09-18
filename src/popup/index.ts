import { mount } from 'svelte'
import App from './components/app.svelte'
import './index.css'
// SMUI 9 no longer exports per-package bare.css. The svelte-material-ui
// package ships one prebuilt bare.css covering every component, plus
// fourteen full themes under svelte-material-ui/themes/ if you ever want
// one instead. Staying on bare.css keeps this project's own accent colour,
// set as --mdc-theme-primary in index.css.
import 'svelte-material-ui/bare.css'

// Svelte 5 replaced `new App({ target })` with the mount() function.
const app = mount(App, {
  target: document.body,
})

export default app
