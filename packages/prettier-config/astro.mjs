/**
 * @busirocket/prettier-config — Astro
 *
 * Base plugins + Astro + Tailwind. prettier-plugin-tailwindcss must load last.
 * Use in Astro projects with Tailwind.
 */

import base from './base.mjs'

/** @type {import('prettier').Config} */
export default {
  ...base,
  plugins: [
    ...(base.plugins ?? []),
    'prettier-plugin-astro',
    'prettier-plugin-tailwindcss',
  ],
  overrides: [
    ...(base.overrides ?? []),
    {
      files: '*.astro',
      options: { parser: 'astro' },
    },
  ],
}
