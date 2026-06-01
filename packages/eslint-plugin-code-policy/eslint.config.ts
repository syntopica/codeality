import { createBaseConfig } from '@busirocket/eslint-config/base'
import { createCodeQualityConfig } from '@busirocket/eslint-config/code-quality'
import { createNodeConfig } from '@busirocket/eslint-config/node'

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
