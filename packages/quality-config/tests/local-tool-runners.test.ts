import { spawnSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('consumer-local quality tools', () => {
  it.each([
    ['baseline-dupes', 'jscpd', 0],
    ['baseline-dupes', 'jscpd', 7],
    ['baseline-type-coverage', 'type-coverage', 0],
    ['baseline-type-coverage', 'type-coverage', 7],
  ] as const)(
    '%s runs the installed %s with tool exit %s without a package manager',
    (runner, tool, status) => {
      const root = mkdtempSync(join(tmpdir(), 'quality consumer '))
      try {
        const workspace = join(root, 'packages/app')
        const installed = join(root, 'node_modules', tool)
        mkdirSync(workspace, { recursive: true })
        mkdirSync(installed, { recursive: true })
        writeFileSync(join(workspace, 'tsconfig.json'), '{}')
        writeFileSync(
          join(installed, 'package.json'),
          JSON.stringify({
            name: tool,
            bin: status === 0 ? 'cli.cjs' : { [tool]: 'cli.cjs' },
          }),
        )
        const record = join(root, 'record.json')
        writeFileSync(
          join(installed, 'cli.cjs'),
          `require('node:fs').writeFileSync(${JSON.stringify(record)}, JSON.stringify({args:process.argv.slice(2),cwd:process.cwd()})); process.exit(${String(status)})`,
        )
        const trap = join(root, 'manager.mjs')
        writeFileSync(trap, 'process.exit(79)')
        const run = spawnSync(
          process.execPath,
          [join(import.meta.dirname, '../bin', `${runner}.mjs`)],
          {
            cwd: workspace,
            encoding: 'utf8',
            env: { ...process.env, PATH: '', npm_execpath: trap },
          },
        )
        expect(run.status, run.stdout + run.stderr).toBe(
          status === 0 ? 0 : runner === 'baseline-dupes' ? status : 1,
        )
        const invoked = JSON.parse(readFileSync(record, 'utf8')) as {
          args: string[]
          cwd: string
        }
        expect(invoked.cwd).toBe(realpathSync(workspace))
        expect(invoked.args).not.toContain('exec')
        expect(invoked.args).toContain(
          runner === 'baseline-dupes' ? '--config' : '--strict',
        )
      } finally {
        rmSync(root, { recursive: true, force: true })
      }
    },
  )
})
