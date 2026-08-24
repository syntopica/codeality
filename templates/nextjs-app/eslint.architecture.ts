/**
 * Project-specific architecture boundaries (eslint-plugin-boundaries v7).
 *
 * Intent: domain-logic folders (formatters, mappers, validators, selectors) must
 * NOT import from components or hooks. They must remain pure and decoupled from
 * React views so they are testable without a DOM and reusable outside React.
 *
 * Notes:
 * - partialMatch: false matches patterns against the full relative file path
 *   (e.g. "src/formatters/x.ts"). Partial matching, the default, silently
 *   failed to fire for direct children of src/<layer>/. It replaces the v6
 *   spelling of the same option, which v7 still honours but warns about on
 *   every run.
 * - Rule renamed in v6: boundaries/element-types -> boundaries/dependencies.
 * - from/disallow/allow now use object-selector syntax.
 * - Per-rule `message` is supported.
 */
export default [
  {
    // The plugin itself is registered once, by `createFrontendBoundariesConfig`
    // inside `createNextjsConfig`, which this file is spread after. Registering
    // it again here is not a no-op: ESLint accepts a repeated plugin key only
    // when both entries are the same object, and pnpm resolves a peer-dependent
    // plugin to a different physical copy per consumer whenever their peer sets
    // differ, which fails the whole config with "Cannot redefine plugin".
    settings: {
      'import/resolver': { typescript: true },
      'boundaries/elements': [
        {
          type: 'components',
          partialMatch: false,
          pattern: ['src/components/**/*'],
        },
        { type: 'hooks', partialMatch: false, pattern: ['src/hooks/**/*'] },
        {
          type: 'formatters',
          partialMatch: false,
          pattern: ['src/formatters/**/*'],
        },
        { type: 'mappers', partialMatch: false, pattern: ['src/mappers/**/*'] },
        {
          type: 'validators',
          partialMatch: false,
          pattern: ['src/validators/**/*'],
        },
        {
          type: 'selectors',
          partialMatch: false,
          pattern: ['src/selectors/**/*'],
        },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'allow',
          rules: [
            {
              from: {
                type: ['formatters', 'mappers', 'validators', 'selectors'],
              },
              disallow: { to: { type: ['components', 'hooks'] } },
              message:
                'Domain logic (formatters/mappers/validators/selectors) must be pure and decoupled from React views.',
            },
          ],
        },
      ],
      'max-lines': [
        'warn',
        { max: 200, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  {
    files: ['src/components/**/*.tsx', 'app/**/*.tsx'],
    rules: {
      'max-lines': [
        'warn',
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
    },
  },
]
