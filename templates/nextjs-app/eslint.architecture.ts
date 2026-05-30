import boundaries from 'eslint-plugin-boundaries'

/**
 * Project-specific architecture boundaries (eslint-plugin-boundaries v6).
 *
 * Intent: domain-logic folders (formatters, mappers, validators, selectors) must
 * NOT import from components or hooks. They must remain pure and decoupled from
 * React views so they are testable without a DOM and reusable outside React.
 *
 * v6 migration notes:
 * - mode: 'full' — patterns are matched against the full relative file path
 *   (e.g. "src/formatters/x.ts"). The old default "folder" mode silently failed
 *   to fire for direct children of src/<layer>/.
 * - Rule renamed: boundaries/element-types -> boundaries/dependencies.
 * - from/disallow/allow now use object-selector syntax.
 * - Per-rule `message` is supported.
 */
export default [
  {
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: true },
      'boundaries/elements': [
        { type: 'components', mode: 'full', pattern: ['src/components/**/*'] },
        { type: 'hooks', mode: 'full', pattern: ['src/hooks/**/*'] },
        { type: 'formatters', mode: 'full', pattern: ['src/formatters/**/*'] },
        { type: 'mappers', mode: 'full', pattern: ['src/mappers/**/*'] },
        { type: 'validators', mode: 'full', pattern: ['src/validators/**/*'] },
        { type: 'selectors', mode: 'full', pattern: ['src/selectors/**/*'] },
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
