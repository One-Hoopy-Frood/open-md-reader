# Contributing

Contributions are welcome. This is a small project with a narrow scope, so a note on what fits before you spend time on a change.

## Scope

This fork exists to keep a Markdown reader extension MIT licensed, buildable, and boring. Priorities, roughly in order:

1. It builds from a clean clone with no errors
2. It does not break
3. It stays readable enough for one person to maintain
4. New features, when they do not complicate the first three

Changes that make the build fragile, add heavy dependencies, or require ongoing upstream tracking are unlikely to be merged.

## English only

The upstream project shipped seven locales. This fork keeps English because translations cannot be reviewed here, and a wrong translation is worse than an absent one.

Adding a locale back is fine **if** you are willing to be the contact for it when strings change. Say so in the pull request. Otherwise please leave the i18n structure alone; it still works, it just has one locale in it.

## Development setup

Requires Node 18 or newer and [pnpm](https://pnpm.io). The `preinstall` script rejects npm and yarn on purpose, because the lockfile is pnpm's.

```bash
git clone https://github.com/One-Hoopy-Frood/open-md-reader.git
cd open-md-reader
pnpm install
pnpm build:extension
```

Load the `extension/` folder at `chrome://extensions` with Developer mode on, then turn on **Allow access to file URLs** in the extension's Details page so local `.md` files render.

For iterating:

```bash
pnpm dev
```

That rebuilds on save. It does not reload the extension for you; click the reload arrow on the extension card, then refresh the document tab.

## Before opening a pull request

```bash
pnpm format   # prettier across the repo
pnpm test     # needs Node 23.6 or newer, see below
pnpm build:extension
```

`pnpm test` runs `node --test tests/`. The test file imports TypeScript directly, which needs Node's native type stripping, enabled by default from Node 23.6. On older versions the tests will not run; that is expected and CI does not gate on them.

If you change dependencies, commit `package.json` and `pnpm-lock.yaml` **together**. CI installs with `--frozen-lockfile` and will fail if they disagree.

## Styling changes

Before adding CSS to `src/style/index.less`, check whether the Custom CSS panel in the popup already covers it. Anything a user can do for themselves in that box does not need to be baked into the build.

If you do touch `index.less`, read the comment block at the bottom of the file first. The bundled theme's rules land at specificity (0,3,2), so an override has to match that ancestor chain to win. Do not reach for a priority flag; that outranks the Custom CSS panel and takes the feature away from users.

## Relationship to upstream

This is an independent fork of [md-reader/md-reader](https://github.com/md-reader/md-reader) at version 2.12.12, the last release published under MIT. See [ATTRIBUTION.md](./ATTRIBUTION.md).

Please do not file issues about this fork on the upstream repository, and do not file issues about upstream's current releases here.
