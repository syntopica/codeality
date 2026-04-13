/**
 * @busirocket/prettier-config — Frontend (Tailwind)
 *
 * Extends base with prettier-plugin-tailwindcss (must load last).
 * Use in any project that uses Tailwind CSS.
 */

import base from './base.mjs'

/** @type {import('prettier').Config} */
export default {
  ...base,
  plugins: [...(base.plugins ?? []), 'prettier-plugin-tailwindcss'],
}
