import { rmSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createCruiseFixture } from './createCruiseFixture'
import { runCruiseProbe } from './runCruiseProbe'

describe('real detector alias and orphan authority', () => {
  it.each([false, true])('preserves genuine orphan detection: %s', (orphan) => {
    const root = createCruiseFixture({
      'tsconfig.json': '{"extends":"./generated/config.json"}',
      'generated/config.json':
        '{"compilerOptions":{"paths":{"~/*":["../app/*"]}}}',
      'app/index.ts':
        'import type { Counter } from "~/Counter"; export const value: Counter = { count: 1 };',
      'app/Counter.ts': 'export type Counter = { count: number };',
      ...(orphan
        ? {
            'app/Unreferenced.ts':
              'export type Unreferenced = { neverUsed: boolean };',
          }
        : {}),
      '.dependency-cruiser.cjs':
        'module.exports = { forbidden: [{ name: "no-orphans", severity: "error", from: { orphan: true }, to: {} }], options: { tsPreCompilationDeps: true } };',
    })
    try {
      const run = runCruiseProbe(
        root,
        `
        const result = withCruiseTsconfig(config, (selected) => spawnSync(process.execPath, [detector, 'app', '--config', '.dependency-cruiser.cjs', '--ts-config', selected, '--output-type', 'json'], { cwd: root, encoding: 'utf8' }));
        if (result.error || result.status !== 0) throw Error(result.stderr || String(result.error));
        const graph = JSON.parse(result.stdout);
        const source = graph.modules.find((entry) => entry.source === 'app/index.ts');
        const edge = source?.dependencies.find((entry) => entry.module === '~/Counter');
        process.stdout.write(JSON.stringify({ errors: graph.summary.error, advised: graph.summary.advisedExitCode, resolved: edge?.resolved, unresolved: edge?.couldNotResolve, orphan: graph.summary.violations.some((entry) => entry.rule.name === 'no-orphans' && entry.from === 'app/Unreferenced.ts') }));
      `,
      )
      expect(run.status, run.stderr).toBe(0)
      expect(run.stdout).toBe(
        JSON.stringify({
          errors: orphan ? 1 : 0,
          advised: orphan ? 1 : 0,
          resolved: 'app/Counter.ts',
          unresolved: false,
          orphan,
        }),
      )
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
