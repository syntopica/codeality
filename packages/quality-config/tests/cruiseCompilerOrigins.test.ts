import { rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createCruiseFixture } from './createCruiseFixture'
import { runCruiseProbe } from './runCruiseProbe'

describe('compiler-owned alias origins', () => {
  it.each([
    [
      'declaring config',
      '{"extends":"./base/aliases.json"}',
      {
        'base/aliases.json':
          '{"compilerOptions":{"paths":{"~/*":["../app/*","../fallback/*"]}}}',
      },
      ['app/*', 'fallback/*'],
    ],
    [
      'inherited baseUrl',
      '{"extends":["./base/url.json","./other/aliases.json"]}',
      {
        'base/url.json': '{"compilerOptions":{"baseUrl":"../target"}}',
        'other/aliases.json': '{"compilerOptions":{"paths":{"~/*":["src/*"]}}}',
      },
      ['target/src/*'],
    ],
    [
      'child override',
      '{"extends":"./base/aliases.json","compilerOptions":{"paths":{"~/*":["local/*"]}}}',
      {
        'base/aliases.json':
          '{"compilerOptions":{"paths":{"~/*":["wrong/*"]}}}',
      },
      ['local/*'],
    ],
    [
      'package extends and JSONC',
      '{/* comment */"extends":"fixture-config",}',
      {
        'node_modules/fixture-config/package.json':
          '{"name":"fixture-config","tsconfig":"base.json"}',
        'node_modules/fixture-config/base.json':
          '{"compilerOptions":{"paths":{"~/*":["../../app/*"]}}}',
      },
      ['app/*'],
    ],
  ] as const)(
    '%s resolves semantic targets',
    (_label, config, inherited, targets) => {
      const root = createCruiseFixture({
        ...inherited,
        'tsconfig.json': config,
        'app/input.ts': 'export {}',
      })
      try {
        const run = runCruiseProbe(
          root,
          'process.stdout.write(JSON.stringify(rebaseCruisePaths(readCruiseCompilerOptions(config)).paths["~/*"]))',
        )
        expect(run.status, run.stderr).toBe(0)
        expect(run.stdout).toBe(
          JSON.stringify(targets.map((target) => resolve(root, target))),
        )
      } finally {
        rmSync(root, { recursive: true, force: true })
      }
    },
  )

  it.each([
    ['missing extends', '{"extends":"./absent.json"}'],
    ['cycle', '{"extends":"./tsconfig.json"}'],
  ])('rejects %s', (_label, config) => {
    const root = createCruiseFixture({
      'tsconfig.json': config,
      'input.ts': 'export {}',
    })
    try {
      const run = runCruiseProbe(root, 'readCruiseCompilerOptions(config)')
      expect(run.status).not.toBe(0)
      expect(run.stderr).not.toBe('')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
