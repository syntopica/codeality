# @syntopica/prettier-config

Shared Prettier configuration presets for JavaScript, TypeScript, Markdown, and
optional Tailwind and Astro plugins.

## Requirements

- Node.js 20+
- Prettier 3+

Peer plugins are listed in `package.json` (`prettier-plugin-organize-imports`,
`prettier-plugin-css-order`, and optionally `prettier-plugin-astro`,
`prettier-plugin-tailwindcss`).

## Install

```bash
pnpm add -D @syntopica/prettier-config@^0.1.0 prettier
```

Add optional peers for Astro or Tailwind when you use those stacks.

## Exports

| Subpath      | Use case                                      |
| ------------ | --------------------------------------------- |
| `.`          | Base config (organize-imports, css-order, MD) |
| `./frontend` | Tailwind class sorting                        |
| `./astro`    | Astro + Tailwind                              |

Example `prettier.config.mjs`:

```js
import base from '@syntopica/prettier-config'

/** @type {import('prettier').Config} */
export default { ...base }
```

## Managed Markdown blocks

Markdown wraps at 80 columns (`proseWrap: always`), except between
`<!-- BEGIN:name -->` and `<!-- END:name -->`, which is kept byte for byte.
Tools such as `turbo` and `next dev` write their agent-rules blocks into
`AGENTS.md` or `CLAUDE.md` that way and rewrite them whenever they differ, so
wrapping them would start a loop.

## Repository

Source and issues:
[github.com/syntopica/codeality](https://github.com/syntopica/codeality/tree/main/packages/prettier-config).

Broader adoption docs:
[engineering-baseline](https://github.com/syntopica/codeality).
