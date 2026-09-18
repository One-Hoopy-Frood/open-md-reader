[![Build](https://github.com/One-Hoopy-Frood/open-md-reader/actions/workflows/build.yml/badge.svg)](https://github.com/One-Hoopy-Frood/open-md-reader/actions/workflows/build.yml)

# Open Markdown Reader

## A browser plugin to read .md and some other formats

This repository is a **FORK of the last published source code of Markdown Reader (2.x version)**. I created this merely because I believe projects should remain FOSS and community maintained and I detest horizontal rules. Because HRs were in the default theme, and access to those theme options are/were paywalled 3.x branch .... here we are.

If you WANT the paywalled 3.x version, you are welcome to get that here https://md-reader.github.io .

<img alt="Open Markdown Reader Logo" src="./src/images/logo-stroke.svg" align="right" width="120">

Open Markdown Reader is a browser extension that lets you preview Markdown documents in your browser.

- **Document Formats**: Preview links in `file://`, `http://`, `https://` and files with `.md`, `.mkd`, `.mdx`, `.markdown` extensions:
  - `https://example.com/example.md` (online Markdown URL)
  - `file:///Users/my-project/readme.markdown` (local Markdown file, \*[requires specific permissions](#allowing-file-access-permission))
- **Custom CSS**: Restyle any document from the extension popup, applied live. See [Custom CSS](#custom-css).
- **Copy and Print**: Copy the rendered document as rich text for pasting into a word processor, or print it with a clean layout.
- **Syntax Plugins**: Emoji, superscripts/subscripts, checkboxes, math, flowcharts, Gantt charts, TOC, insertions, abbreviations, annotations, alerts.
- **Themes**: Light and dark themes with code highlighting.
- **Hot Reloading**: Live document changes and centered display for better reading.
- **Document Organization**: Sidebar directory, original content preview, and image media support.
- **Shortcuts**: Quick function invocation with web extension shortcuts.

![banner](./example/example-1.png)

## What this fork changes

- The bottom border on `h2` headings is gone, and horizontal rules are hidden by default
- A **Custom CSS** panel in the popup, with a **Force Custom CSS** toggle that raises every rule you write to important priority, so simple selectors work without fighting the bundled theme
- **Copy formatted** and **Print** buttons in the document toolbar
- Print fixes: heading anchor links no longer print as stray blue hashes, the sidebar gutter is reclaimed, and content uses the full page width
- English only. Upstream shipped seven locales; translations cannot be verified here, so `en` is the only one kept
- Upstream-specific material removed: funding links, the uninstall-survey redirect, and unused marketing images that were being copied into every build

See [ATTRIBUTION.md](./ATTRIBUTION.md) for the full list and the licensing details.

## Installation

### Requirements

- Node.js 16 or newer
- [pnpm](https://pnpm.io) (the `preinstall` script rejects npm and yarn)

### Build

```bash
# Clone this repository
git clone https://github.com/One-Hoopy-Frood/open-md-reader.git && cd open-md-reader

# Install dependencies
pnpm install

# Build the loadable extension
pnpm build:extension
```

If pnpm reports `ERR_PNPM_IGNORED_BUILDS` for `esbuild` and `svelte-preprocess`, approve them once and reinstall:

```bash
pnpm approve-builds
pnpm install
```

`pnpm build:extension` writes the unpacked extension to the `extension/` folder. That is the folder you load into the browser.

Use `pnpm build` instead if you want a distributable zip; it runs the same build and then packages `dist/open-md-reader-x.x.x.zip`.

For development, `pnpm dev` runs webpack in watch mode and reloads the extension automatically on save.

### Load it in Chrome

1. Go to `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked** and select the `extension/` folder
4. Click **Details** on the newly loaded extension and turn on **Allow access to file URLs**

Step 4 is required for local `.md` files to render. The manifest declares the `file://` patterns, but the browser gates file access separately per extension.

### Allowing file access permission

Without **Allow access to file URLs**, the extension can preview Markdown over `http://` and `https://` but not from your disk. The popup shows a warning when the permission is missing.

## Usage

Open any Markdown file or URL. The document renders with a sidebar table of contents and a toolbar in the top right.

Toolbar buttons, right to left:

- `</>` toggles between the rendered view and the raw source
- **Copy** copies the rendered document as rich text, so pasting into Google Docs or Word keeps headings, bold, lists, and tables
- **Print** opens the print dialog with a layout tuned for paper

### Custom CSS

Click the extension icon and type CSS into the **Custom CSS** box. It applies live to any open document and persists across sessions.

**Force Custom CSS** is on by default. It raises every declaration you write to important priority, which means plain selectors like `h2 { color: teal; }` work as expected. Without it, the bundled theme's deeply nested selectors outrank most simple rules and your CSS appears to do nothing.

Turn the toggle off if you want normal cascade behaviour.

Useful selectors:

- `.md-reader__markdown-content` wraps the rendered document
- `.md-reader__markdown-content.centered` is the centered text column, where `max-width` lives
- `.md-reader__side` is the sidebar
- `.md-reader__head-anchor` is the `#` link that appears on heading hover

### Theme styles

The bundled theme comes from the npm package `@md-reader/theme`, pinned at `1.0.23-patch.1`. It is consumed as a dependency, not vendored here.

Do not upgrade it casually. The current published version, 2.0.5, renames nearly every CSS custom property and is not compatible with this codebase; 30 of the 31 properties it references have different names here. For everyday restyling, use the Custom CSS panel instead.

## License

[MIT](./LICENSE)

Original work © 2018-present [Bener](https://github.com/Heroor), from [md-reader/md-reader](https://github.com/md-reader/md-reader) at version 2.12.12, the last release published under MIT.

Fork modifications © 2026 Chris Chirdon.

This is an independent fork. It is not endorsed by, supported by, or affiliated with the original author. Please do not file issues about this fork on the upstream repository.
