/**
 * @vibracomet/prettier-config — Base
 *
 * Universal formatting defaults plus import and CSS ordering plugins shared with
 * most portfolio projects. No Tailwind or Astro plugins here — use /frontend or /astro.
 */

/** @type {import('prettier').Config} */
export default {
  trailingComma: 'all',
  tabWidth: 2,
  useTabs: false,
  semi: false,
  singleQuote: true,
  plugins: ['prettier-plugin-organize-imports', 'prettier-plugin-css-order'],
  overrides: [
    {
      files: '*.md',
      options: { proseWrap: 'always' },
    },
  ],
}
