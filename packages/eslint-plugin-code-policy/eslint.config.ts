// Relative imports, not the `@busirocket/eslint-config` package specifier:
// eslint-config's own code-quality.ts imports this package (eslint-plugin-code-policy)
// as a real runtime dependency, so a package.json edge back to eslint-config
// here would be a workspace cycle. Reaching its source by path (the same
// trick eslint-config's own eslint.config.ts uses on itself) avoids the cycle
// without needing a declared dependency for a dev-only self-lint config.
import { createBaseConfig } from '../eslint-config/src/base.ts'
import { createCodeQualityConfig } from '../eslint-config/src/code-quality.ts'
import { createNodeConfig } from '../eslint-config/src/node.ts'

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createNodeConfig(),
  ...createCodeQualityConfig(),
  {
    // This package IS an ESLint plugin: its source traverses the TSESTree AST and
    // follows the typescript-eslint rule-authoring conventions. A few baseline
    // rules target application code and do not fit rule-authoring code, so they
    // are relaxed here (and only here, scoped to src):
    files: ['src/**/*.ts'],
    rules: {
      // `node.type` is the AST_NODE_TYPES string enum; comparing it to string
      // literals ('Program', 'ImportDeclaration', ...) is the canonical, safe
      // ESLint-rule idiom, not an unsafe enum comparison.
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      // TSESTree types assert non-null `parent`/`id` for lint-time convenience;
      // the runtime guards against root/edge nodes are still correct, not dead.
      '@typescript-eslint/no-unnecessary-condition': 'off',
      // Inline `Options`/`MessageIds` type aliases beside createRule() are the
      // idiomatic typescript-eslint rule shape. Do not dogfood the app-oriented
      // atomic-file / placement rules on the plugin's own internals.
      'code-policy/no-inline-types-in-runtime-files': 'off',
      'code-policy/no-hidden-top-level-declarations': 'off',
      'code-policy/file-kind-placement': 'off',
      // Rule modules are cohesive units; AST visitor functions are naturally
      // long and branchy. Size/complexity budgets do not apply here.
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      complexity: 'off',
      'max-depth': 'off',
    },
  },
  { ignores: ['dist/**'] },
]
