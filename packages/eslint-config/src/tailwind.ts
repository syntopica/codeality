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
 * `classnames-order` is intentionally disabled too: `prettier-plugin-tailwindcss`
 * (shipped in `@busirocket/prettier-config/frontend`) is the class sorter of
 * record and orders classes differently from this rule. A project running
 * both `eslint --fix` and `prettier --write` would see each pass fight the
 * other's ordering, so `lint` and `format:check` could never agree at the
 * same time. Prettier owns class ordering; this rule stays off to avoid the
 * conflict.
 *
 * Requires `tailwindcss` to be installed in the consuming project.
 * Only add this to projects that use Tailwind CSS.
 */
export const createTailwindConfig = (options: { cssConfigPath: string }) => {
  // eslint.config.ts is loaded by jiti at runtime, which does not type-check
  // the call, so a missing option surfaces as a bare
  // "Cannot read properties of undefined" thrown from inside ESLint with no
  // hint about which factory asked for what. Say it plainly instead.
  // The type says `options` is required, and for a TypeScript caller it is.
  // At runtime it is whatever the config file passed, so the check is real.
  const given = options as { cssConfigPath?: string } | undefined
  if (!given?.cssConfigPath) {
    throw new Error(
      'createTailwindConfig requires { cssConfigPath }. ' +
        'eslint-plugin-tailwindcss v4 resolves the design system from your ' +
        'Tailwind CSS entry file - the one with `@import "tailwindcss"` - so ' +
        "pass it: createTailwindConfig({ cssConfigPath: './src/styles.css' }).",
    )
  }

  return [
    tailwindcss.configs.recommended,
    {
      files: ['**/*.{js,jsx,ts,tsx,vue,astro,html}'],
      settings: {
        tailwindcss: { cssConfigPath: options.cssConfigPath },
      },
      rules: {
        'tailwindcss/no-custom-classname': 'off',
        'tailwindcss/classnames-order': 'off',
      },
    },
  ]
}
