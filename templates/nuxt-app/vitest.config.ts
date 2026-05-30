import { defineVitestConfig } from '@nuxt/test-utils/config'

// Default to a lightweight `node` environment so pure unit tests (server route
// handlers, schemas) run fast. Tests that exercise Vue SFCs or Nuxt auto-imports
// opt into the heavier Nuxt runtime per file with `// @vitest-environment nuxt`.
export default defineVitestConfig({
  test: {
    environment: 'node',
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom',
        // Provide a valid public runtime config so the fail-fast env-validation
        // plugin (app/plugins/validateEnv.ts) passes under the Nuxt test runtime.
        overrides: {
          runtimeConfig: {
            public: { apiBaseUrl: 'https://api.example.com' },
          },
        },
      },
    },
    globals: true,
    include: ['{app,server,test}/**/*.{test,spec}.ts'],
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['app/**/*.{ts,vue}', 'server/**/*.ts'],
      exclude: [
        '**/*.{test,spec}.ts',
        'test/**',
        'app/app.vue',
        'app/pages/**',
        'app/plugins/**',
        'app/**/*.d.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
