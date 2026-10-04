import { cliTestAliases } from '@syntopica/gate-kit/cliTestAliases'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // The argv entry and the real process work (spawning node and vitest,
      // reading `ps`) are exercised by the integration test rather than
      // measured; PascalCase files hold types or constants.
      exclude: ['src/cli.ts', 'src/tools/*.ts', 'src/**/[A-Z]*.ts'],
      thresholds: { lines: 85, functions: 85, branches: 80, statements: 85 },
    },
  },
  resolve: { alias: cliTestAliases(import.meta.dirname) },
})
