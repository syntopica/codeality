/**
 * @repo/eslint-config — Code quality enforcement
 *
 * Scope: structural correctness, complexity limits, duplication prevention.
 * Framework-agnostic. Compose AFTER base and your framework extension.
 *
 * Rules covered:
 *   atomic-file               — one top-level export per file
 *   no-inline-types           — interfaces/types in dedicated files, not mixed with logic
 *   view-logic-separation     — no hooks or inline handlers in .tsx view components
 *   public-api-imports        — import from the module's public index, not deep paths
 *   no-cross-module-deep-imports — no deep cross-module path violations
 *   max-lines                 — files over 150 meaningful lines are a smell
 *   max-lines-per-function    — functions over 40 lines should be extracted
 *   complexity                — cyclomatic complexity > 10
 *   max-depth                 — nesting > 4 levels
 *   max-params                — more than 4 params → use an options object
 *   sonarjs/no-identical-functions  — hard error on copy-pasted functions
 *   sonarjs/no-duplicated-branches  — hard error on identical if/else branches
 *   sonarjs/no-duplicate-string     — warn on repeated string literals
 *
 * Usage:
 *   import { createBaseConfig } from '@repo/eslint-config/base'
 *   import { createNextjsConfig } from '@repo/eslint-config/nextjs'
 *   import { createCodeQualityConfig } from '@repo/eslint-config/code-quality'
 *
 *   export default [
 *     ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
 *     ...createNextjsConfig(),
 *     ...createCodeQualityConfig(),
 *   ]
 *
 * To tighten a rule in your project, override it as a fourth layer:
 *   { rules: { 'max-lines': ['error', { max: 100 }] } }
 */

import codePolicy from 'eslint-plugin-code-policy'
import sonarjs from 'eslint-plugin-sonarjs'

export const createCodeQualityConfig = () => [
  // ---------------------------------------------------------------------------
  // eslint-plugin-code-policy — structural / architectural enforcement
  //
  // atomic-file:
  //   One top-level declaration per file. Forces small, single-responsibility
  //   modules. index.ts, config files, and Next.js routing files are exempt.
  //
  // no-inline-types:
  //   interface/type declarations must live in dedicated files (types/ folder or
  //   pure-type files). Prevents types from being buried inside implementation.
  //
  // view-logic-separation:
  //   .tsx view components must NOT contain useState, useEffect, useReducer, etc.
  //   or inline handler declarations. All logic must live in a custom hook.
  //   This is the primary AI-generated-code quality gate.
  //
  // public-api-imports:
  //   Modules are consumed through their index.ts public surface, not by reaching
  //   into subdirectories. Enforces the encapsulation contract.
  //
  // no-cross-module-deep-imports:
  //   Prevents bypassing module boundaries via deep relative paths.
  // ---------------------------------------------------------------------------
  codePolicy.configs.recommended,

  // ---------------------------------------------------------------------------
  // Complexity limits
  // These start as 'warn' so you can observe violations before enforcing hard.
  // To make them errors in your project, override in eslint.architecture.ts:
  //   { rules: { 'max-lines': ['error', { max: 120 }] } }
  // ---------------------------------------------------------------------------
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    rules: {
      // A file over 150 meaningful lines almost always contains too many concerns.
      'max-lines': [
        'warn',
        { max: 150, skipBlankLines: true, skipComments: true },
      ],

      // A function over 40 lines is doing too much. Extract helpers or a hook.
      'max-lines-per-function': [
        'warn',
        { max: 40, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],

      // Cyclomatic complexity > 10 is hard to test and reason about.
      complexity: ['warn', { max: 10 }],

      // Deeply nested code: extract to an early-return or a helper.
      'max-depth': ['warn', { max: 4 }],

      // More than 4 params is a sign the function should take an options object.
      'max-params': ['warn', { max: 4 }],
    },
  },

  // ---------------------------------------------------------------------------
  // Duplication — identical code is always a hard error; string repetition is a warn
  // ---------------------------------------------------------------------------
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: { sonarjs },
    rules: {
      // Two functions with identical implementation — extract to a shared util.
      'sonarjs/no-identical-functions': 'error',

      // Two branches with identical bodies — dead code or logic error.
      'sonarjs/no-duplicated-branches': 'error',

      // The same string literal used 4+ times — extract to a constant.
      'sonarjs/no-duplicate-string': ['warn', { threshold: 4 }],
    },
  },
]

export default createCodeQualityConfig
