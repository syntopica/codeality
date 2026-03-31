/**
 * @repo/prettier-config — Astro
 *
 * Extends frontend (Tailwind) with prettier-plugin-astro.
 * Use in Astro projects. Includes Tailwind class sorting and .astro parser.
 */

import frontend from './frontend.mjs'

/** @type {import('prettier').Config} */
export default {
  ...frontend,
  plugins: [...(frontend.plugins ?? []), 'prettier-plugin-astro'],
  overrides: [
    {
      files: '*.astro',
      options: { parser: 'astro' },
    },
  ],
}
