import boundaries from 'eslint-plugin-boundaries'

export default [
  {
    plugins: {
      boundaries,
    },
    settings: {
      'boundaries/elements': [
        { type: 'components', pattern: 'src/components/**/*' },
        { type: 'formatters', pattern: 'src/formatters/**/*' },
        { type: 'hooks', pattern: 'src/hooks/**/*' },
        { type: 'mappers', pattern: 'src/mappers/**/*' },
        { type: 'validators', pattern: 'src/validators/**/*' },
        { type: 'selectors', pattern: 'src/selectors/**/*' },
      ],
    },
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'allow',
          rules: [
            {
              from: ['formatters', 'mappers', 'validators', 'selectors'],
              disallow: ['components', 'hooks'],
              message:
                'Domain logic (formatters/mappers/validators) must be pure and decoupled from React views.',
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
