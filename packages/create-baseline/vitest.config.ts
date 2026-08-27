import { defineConfig } from 'vitest/config'

// The conformance checks are pure functions of a context object, so they need
// no filesystem and no fixtures on disk. `loadContext` and `applyFixes` are
// the two that touch the filesystem; they are covered through a temporary
// directory rather than mocked, because what they assert about is exactly the
// shape of a real repository.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.mjs'],
    coverage: {
      provider: 'v8',
      include: ['bin/**/*.mjs'],
      exclude: [
        // The CLI entrypoint is argument parsing and console output around the
        // units below, and its own behaviour is the integration test in
        // tests/cli.test.mjs rather than a coverage target.
        'bin/create-baseline.mjs',
      ],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
})
