/**
 * @repo/prettier-config — Base
 *
 * Universal formatting defaults. No framework plugins.
 * Import this in any project that doesn't need Tailwind or Astro formatting.
 */

/** @type {import('prettier').Config} */
export default {
  trailingComma: "all",
  tabWidth: 2,
  useTabs: false,
  semi: false,
  singleQuote: true,
  printWidth: 100,
};
