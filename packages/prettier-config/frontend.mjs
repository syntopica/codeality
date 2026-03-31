/**
 * @repo/prettier-config — Frontend (Tailwind)
 *
 * Extends base with prettier-plugin-tailwindcss.
 * Use in any project that uses Tailwind CSS.
 * Do NOT add organize-imports here — that concern lives in ESLint.
 */

import base from './base.mjs'

/** @type {import('prettier').Config} */
export default {
  ...base,
  plugins: ['prettier-plugin-tailwindcss'],
}
