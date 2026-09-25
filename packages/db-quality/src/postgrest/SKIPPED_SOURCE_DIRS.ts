/** Directories never worth walking for application source: build output, dependencies, test doubles. */
export const SKIPPED_SOURCE_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.next',
  'coverage',
  '__tests__',
  '__mocks__',
])
