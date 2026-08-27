import unicorn from 'eslint-plugin-unicorn'
import globals from 'globals'

export const createNodeConfig = () => [
  {
    // A CLI's stdout is its product, and a maintenance script's output is the
    // reason it is run. `no-console` is an error everywhere else - a
    // `console.log` in application code is a debugging statement that reached
    // production - but forbidding it here would only produce a file of
    // suppressions. Scoped by directory rather than by preset: a NestJS
    // service composes this same config and its request handlers must not
    // print to stdout.
    files: ['**/bin/**/*.{ts,js,mjs,cjs}', '**/scripts/**/*.{ts,js,mjs,cjs}'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['**/*.{ts,js,mjs,cjs}'],
    languageOptions: {
      globals: { ...globals.node },
    },
    plugins: { unicorn },
    rules: {
      'unicorn/prefer-node-protocol': 'error',
    },
  },
]
