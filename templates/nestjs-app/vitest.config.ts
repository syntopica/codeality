import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.{test,spec}.ts',
        // Bootstrap and DI wiring: no branches of their own, and covering
        // them would mean booting the Nest application in a unit test.
        'src/main.ts',
        'src/**/*.module.ts',
      ],
      // No `branches` threshold here, unlike the other templates. Nest's
      // class decorators compile to code v8 attributes to the decorated
      // line, so `@Controller()` alone reports an uncovered branch that no
      // test can reach. The other three gates still measure real code.
      thresholds: { lines: 80, functions: 80, statements: 80 },
    },
  },
})
