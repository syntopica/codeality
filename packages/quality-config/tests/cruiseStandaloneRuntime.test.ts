import { spawnSync } from 'node:child_process'
import { readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { copyCruiseRuntime } from './copyCruiseRuntime'
import { createCruiseFixture } from './createCruiseFixture'

describe('standalone published cruise runtime', () => {
  it('imports the shipped subpath outside the monorepo', () => {
    const root = createCruiseFixture({
      'tsconfig.json': '{}',
      'input.ts': 'export {}',
    })
    try {
      copyCruiseRuntime(root)
      const run = spawnSync(
        process.execPath,
        [
          '--input-type=module',
          '--eval',
          'import { withCruiseTsconfig } from "@syntopica/quality-config/cruise-tsconfig"; import { resolve } from "node:path"; process.stdout.write(String(withCruiseTsconfig(resolve("tsconfig.json"), () => 23)));',
        ],
        { cwd: root, encoding: 'utf8', timeout: 10_000 },
      )
      expect(run.status, run.stderr).toBe(0)
      expect(run.stdout).toBe('23')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it.each([0, 7])(
    'passes only explicit app and propagates detector status %s',
    (status) => {
      const root = createCruiseFixture({
        'tsconfig.json': '{"compilerOptions":{"paths":{"~/*":["app/*"]}}}',
        'app/input.ts': 'export {}',
        'server/input.ts': 'export {}',
        'nested/tsconfig.json': '{}',
        'nested/app/input.ts': 'export {}',
        '.dependency-cruiser.cjs': 'module.exports = {}',
        'manager.cjs': `const fs = require('node:fs'); const args = process.argv.slice(2); fs.appendFileSync('trace.jsonl', JSON.stringify({ args, config: JSON.parse(fs.readFileSync(args[args.indexOf('--ts-config') + 1], 'utf8')) }) + "\\n"); process.exit(${String(status)});`,
      })
      try {
        const installed = copyCruiseRuntime(root)
        const run = spawnSync(
          process.execPath,
          [join(installed, 'bin/baseline-deps-graph.mjs'), '--cwd-only', 'app'],
          {
            cwd: root,
            encoding: 'utf8',
            timeout: 10_000,
            env: {
              ...process.env,
              PATH: '',
              npm_execpath: join(root, 'manager.cjs'),
            },
          },
        )
        expect(run.status, run.stdout + run.stderr).toBe(status === 0 ? 0 : 1)
        const trace = readFileSync(join(root, 'trace.jsonl'), 'utf8')
          .trim()
          .split('\n')
        expect(trace).toHaveLength(1)
        expect(trace[0]).toContain('"exec","depcruise","app","--config"')
        expect(trace[0]).not.toContain('"server"')
        expect(trace[0]).toContain('"extends":')
        expect(trace[0]).toContain(join(root, 'app/*'))
      } finally {
        rmSync(root, { recursive: true, force: true })
      }
    },
  )
  it('fails when explicit app is missing without invoking a manager', () => {
    const root = createCruiseFixture({
      'tsconfig.json': '{}',
      'input.ts': 'export {}',
      '.dependency-cruiser.cjs': 'module.exports = {}',
      'manager.cjs': 'process.exit(79)',
    })
    try {
      const installed = copyCruiseRuntime(root)
      const run = spawnSync(
        process.execPath,
        [join(installed, 'bin/baseline-deps-graph.mjs'), '--cwd-only', 'app'],
        {
          cwd: root,
          encoding: 'utf8',
          timeout: 10_000,
          env: {
            ...process.env,
            PATH: '',
            npm_execpath: join(root, 'manager.cjs'),
          },
        },
      )
      expect(run.status).toBe(1)
      expect(run.stderr).toContain('missing explicit source')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it.each([
    { args: [] as readonly string[] },
    { args: ['app'] as readonly string[] },
  ])(
    'continues legacy discovery after a workspace failure with args $args',
    ({ args }) => {
      const root = createCruiseFixture({
        'tsconfig.json': '{"extends":"./absent.json"}',
        'app/input.ts': 'export {}',
        'nested/tsconfig.json': '{}',
        'nested/app/input.ts': 'export {}',
        '.dependency-cruiser.cjs': 'module.exports = {}',
        'manager.cjs':
          'require("node:fs").writeFileSync(process.env.CRUISE_TRACE, process.cwd());',
      })
      try {
        const installed = copyCruiseRuntime(root)
        const trace = join(root, 'trace.txt')
        const run = spawnSync(
          process.execPath,
          [join(installed, 'bin/baseline-deps-graph.mjs'), ...args],
          {
            cwd: root,
            encoding: 'utf8',
            timeout: 10_000,
            env: {
              ...process.env,
              PATH: '',
              npm_execpath: join(root, 'manager.cjs'),
              CRUISE_TRACE: trace,
            },
          },
        )
        expect(run.status).toBe(1)
        expect(readFileSync(trace, 'utf8')).toBe(join(root, 'nested'))
        expect(run.stderr).toContain('failed for .')
      } finally {
        rmSync(root, { recursive: true, force: true })
      }
    },
  )
})
