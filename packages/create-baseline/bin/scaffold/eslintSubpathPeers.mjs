// Which packages each `@busirocket/eslint-config` subpath imports by bare
// specifier. The config ships TypeScript source rather than a build, so these
// resolve from the consuming project: one missing here fails ESLint before a
// rule runs, with a message that names neither the baseline nor the subpath
// that wanted it.
//
// Mirrors the stacks table in the eslint-config README.
export const ESLINT_SUBPATH_PEERS = {
  base: [
    '@eslint/js',
    'eslint-config-prettier',
    'eslint-plugin-import',
    'eslint-import-resolver-typescript',
    'eslint-plugin-promise',
    'eslint-plugin-security',
    'eslint-plugin-unused-imports',
    'typescript-eslint',
  ],
  nextjs: [
    '@next/eslint-plugin-next',
    'eslint-plugin-react',
    'eslint-plugin-react-hooks',
    'eslint-plugin-boundaries',
  ],
  'vite-react': [
    'eslint-plugin-react',
    'eslint-plugin-react-hooks',
    'eslint-plugin-react-refresh',
    'eslint-plugin-boundaries',
  ],
  'vite-vue': [
    'eslint-plugin-vue',
    'eslint-plugin-vuejs-accessibility',
    'vue-eslint-parser',
    'eslint-plugin-unused-imports',
    'typescript-eslint',
  ],
  astro: [
    'eslint-plugin-astro',
    'typescript-eslint',
    'eslint-plugin-boundaries',
  ],
  node: ['eslint-plugin-unicorn', 'globals'],
  'data-files': [
    '@eslint/markdown',
    'eslint-plugin-jsonc',
    'eslint-plugin-yml',
  ],
  nestjs: ['eslint-plugin-unicorn', 'globals'],
  'code-quality': [
    'eslint-plugin-code-policy',
    'eslint-plugin-sonarjs',
    'eslint-plugin-testing-library',
    '@vitest/eslint-plugin',
  ],
  testing: ['@vitest/eslint-plugin', 'eslint-plugin-testing-library'],
  accessibility: ['eslint-plugin-jsx-a11y'],
  tailwind: ['eslint-plugin-tailwindcss'],
  'frontend-boundaries': ['eslint-plugin-boundaries'],
}
