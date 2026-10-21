import { describe, expect, it } from 'vitest'

import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Exercise Knip's CSS compiler: imported styles must belong to the project in
// both modes, rather than producing a compiled-extension exclusion hint.
describe('framework CSS project scope', () => {
  it.each(['vite-react', 'vite-vue', 'tauri', 'nuxt'])(
    'includes imported CSS in %s in normal and production modes',
    (framework) => {
      const dir = mkdtempSync(join(tmpdir(), 'qc-knip-css-'))
      const source = framework === 'nuxt' ? 'app' : 'src'
      try {
        mkdirSync(join(dir, source))
        writeFileSync(
          join(dir, 'package.json'),
          JSON.stringify({
            name: 'css-project',
            type: 'module',
            dependencies: {
              tailwindcss: '*',
              ...(framework === 'vite-vue' || framework === 'nuxt'
                ? { vue: '*' }
                : {}),
            },
          }),
        )
        writeFileSync(
          join(dir, source, 'main.ts'),
          `import './styles.css'\nimport 'tailwindcss'\n${framework === 'vite-vue' || framework === 'nuxt' ? "import 'vue'\n" : ''}console.log('styled')\n`,
        )
        if (framework === 'nuxt') {
          mkdirSync(join(dir, 'server'))
          writeFileSync(join(dir, 'server/api.ts'), 'console.log("server")\n')
        }
        writeFileSync(join(dir, source, 'styles.css'), 'body { color: red; }\n')
        writeFileSync(
          join(dir, 'knip.config.ts'),
          `import { FRAMEWORK_ENTRIES } from ${JSON.stringify(join(import.meta.dirname, '../src/knip-framework.ts'))}
export default { ...FRAMEWORK_ENTRIES[${JSON.stringify(framework)}], entry: [${JSON.stringify(`${source}/main.ts!`)}, ...("${framework}" === 'nuxt' ? ['server/api.ts!'] : [])] }
`,
        )
        for (const mode of [[], ['--production']]) {
          const run = spawnSync(
            process.execPath,
            [
              join(import.meta.dirname, '../node_modules/knip/bin/knip.js'),
              '--treat-config-hints-as-errors',
              ...mode,
            ],
            { cwd: dir, encoding: 'utf8' },
          )
          expect(run.stdout + run.stderr).not.toContain('Configuration hints')
          expect(run.status, run.stdout + run.stderr).toBe(0)
        }
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    },
  )
})
