// eslint-disable-next-line @typescript-eslint/no-require-imports
const tailwindcss = require('eslint-plugin-tailwindcss') as {
  // v4 stable exposes a single flat-config object (v4 beta had 'flat/recommended' as an array).
  configs: { recommended: object }
}

/**
 * Tailwind CSS lint rules.
 * Enforces class ordering, detects contradicting classes (e.g. `flex block`),
 * promotes shorthands (e.g. `pt-4 pb-4` → `py-4`).
 *
 * `cssConfigPath` is MANDATORY since eslint-plugin-tailwindcss v4 stable: the
 * plugin resolves the design system from the Tailwind v4 CSS entry file (the
 * one with `@import "tailwindcss"`), e.g. `./src/styles.css`.
 *
 * `no-custom-classname` is intentionally disabled: real apps routinely mix
 * Tailwind utilities with their own CSS layer (BEM-style classes, component
 * classes) and custom prefixes, which this rule cannot distinguish from typos.
 * On those codebases it produces overwhelming false-positive noise with no
 * reliable signal, so it is off by default. Re-enable per-project with an
 * allowlist (`settings.tailwindcss.whitelist`) if a project is utility-only.
 *
 * Requires `tailwindcss` to be installed in the consuming project.
 * Only add this to projects that use Tailwind CSS.
 */
export const createTailwindConfig = (options: { cssConfigPath: string }) => [
  tailwindcss.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx,vue,astro,html}'],
    settings: {
      tailwindcss: { cssConfigPath: options.cssConfigPath },
    },
    rules: {
      'tailwindcss/no-custom-classname': 'off',
    },
  },
]

export default createTailwindConfig
