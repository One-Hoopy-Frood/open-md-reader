# Attribution and licensing

Open Markdown Reader is a fork of [Markdown Reader](https://github.com/md-reader/md-reader) by Bener, taken from version 2.12.12, the last release published under the MIT license.

The original project is MIT licensed, which permits use, modification, and redistribution provided the copyright notice and permission notice are retained. Both are kept in full in `LICENSE`, which now carries two copyright lines: Bener's for the original work, and one for the modifications in this fork.

## What this fork changes

- Removes the bottom border on h2 headings and hides horizontal rules by default
- Adds a Custom CSS panel to the extension popup, with a Force Custom CSS option that raises every user declaration to important priority
- Adds a copy-as-rich-text button and a print button to the document toolbar
- Fixes print output: heading anchor links no longer print, the sidebar gutter is reclaimed, and content uses the full page width
- English only. The upstream project shipped seven locales; this fork keeps `en` because the maintainer cannot verify translations
- Drops upstream-specific material: funding links, the uninstall-survey redirect, the WeChat donation QR code, and unused browser and web-store marketing images

## Theme

The bundled theme comes from the npm package `@md-reader/theme`, pinned at `1.0.23-patch.1`, also by Bener and also MIT licensed. It is consumed as a dependency and is not vendored into this repository.

Note that the current published version of that package, 2.0.5, renames nearly every CSS custom property and is **not** compatible with this codebase. Of the 31 custom properties 2.0.5 references, 30 have different names here. Do not upgrade it without renaming the variables in `src/style/variable.less`.

## Relationship to the upstream project

This is an independent fork. It is not endorsed by, supported by, or affiliated with the original author. Do not file issues about this fork on the upstream repository.

Versions after 2.x of the original project are no longer published under an open source license. If you want the current upstream release, get it from the original author.

## Remaining upstream asset

The logo files (`src/images/logo.svg`, `logo.png`, `logo-stroke.svg`, `logo-stroke.png`) are still the original project's mark. They are covered by the MIT license along with the rest of the repository, so redistribution is permitted, but a fork carrying the original's logo can confuse users about which project they are running. Replacing them is worth considering. They are referenced in `src/manifest.json` (extension icons) and `src/popup/components/header.svelte`.
