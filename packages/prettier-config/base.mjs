/**
 * @syntopica/prettier-config — Base
 *
 * Universal formatting defaults plus import ordering, shared by every project.
 * No CSS, Tailwind or Astro plugins here — use /frontend or /astro.
 */

import managedBlocksPlugin from './managedBlocksPlugin.mjs'

/** @type {import('prettier').Config} */
export default {
  trailingComma: 'all',
  tabWidth: 2,
  useTabs: false,
  semi: false,
  singleQuote: true,
  // Import ordering only. `prettier-plugin-css-order` used to load here too,
  // which pulled `postcss` into projects with no stylesheet at all: adopting
  // rocket-agents, a Node CLI, prettier refused to start with
  // "Cannot find package 'postcss'". A CSS plugin belongs with the frontend
  // variants, which is what the note above already claimed.
  // `managedBlocksPlugin` keeps the BEGIN/END blocks that `turbo` and
  // `next dev` own in AGENTS.md and CLAUDE.md verbatim; the rest of those
  // files wraps like any other Markdown.
  plugins: ['prettier-plugin-organize-imports', managedBlocksPlugin],
  overrides: [
    {
      files: '*.md',
      options: { proseWrap: 'always' },
    },
  ],
}
