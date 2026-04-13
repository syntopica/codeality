# @busirocket/prettier-config

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
pnpm add -D @busirocket/prettier-config@^0.1.0 prettier
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
import base from '@busirocket/prettier-config'

/** @type {import('prettier').Config} */
export default { ...base }
```

## Repository

Source and issues: [github.com/BusiRocket/prettier-config](https://github.com/BusiRocket/prettier-config).

Broader adoption docs: [engineering-baseline](https://github.com/BusiRocket/engineering-baseline).
