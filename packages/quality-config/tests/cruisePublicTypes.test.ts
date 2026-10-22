import { spawnSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { copyCruiseRuntime } from './copyCruiseRuntime'
import { createCruiseFixture } from './createCruiseFixture'

describe('strict standalone public runtime declaration', () => {
  it.each([false, true])(
    'checks callback and generic result types: invalid %s',
    (invalid) => {
      const root = createCruiseFixture({
        'tsconfig.json':
          '{"compilerOptions":{"strict":true,"noEmit":true,"module":"NodeNext","moduleResolution":"NodeNext","target":"ESNext","types":[],"skipLibCheck":true},"files":["consumer.mts"]}',
        'consumer.mts': `import { withCruiseTsconfig } from '@syntopica/quality-config/cruise-tsconfig'; const result: ${invalid ? 'string' : 'number'} = withCruiseTsconfig('tsconfig.json', (selected) => selected.toUpperCase().length, { requirePaths: true }); export { result };`,
      })
      try {
        copyCruiseRuntime(root)
        const compiler = fileURLToPath(
          new URL(
            '../node_modules/@typescript/native/bin/tsc',
            import.meta.url,
          ),
        )
        const run = spawnSync(
          process.execPath,
          [compiler, '--noEmit', '-p', 'tsconfig.json'],
          { cwd: root, encoding: 'utf8', timeout: 10_000 },
        )
        const output = run.stdout + run.stderr
        expect(run.error).toBeUndefined()
        expect(run.signal).toBeNull()
        if (invalid) {
          expect(run.status, output).not.toBeNull()
          expect(run.status, output).not.toBe(0)
          expect(output.trim()).toMatch(
            /^consumer\.mts\(\d+,\d+\): error TS2322: Type 'number' is not assignable to type 'string'\.$/u,
          )
        } else {
          expect(run.status, output).toBe(0)
          expect(output).toBe('')
        }
        expect(output).not.toContain('TS7016')
      } finally {
        rmSync(root, { recursive: true, force: true })
      }
    },
  )
})
