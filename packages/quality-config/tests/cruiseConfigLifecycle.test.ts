import { readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createCruiseFixture } from './createCruiseFixture'
import { runCruiseProbe } from './runCruiseProbe'

describe('temporary cruise config ownership', () => {
  it.each(['return', 'throw', 'thenable'])(
    'cleans after %s without altering existing files',
    (outcome) => {
      const original = '{"compilerOptions":{"paths":{"~/*":["app/*"]}}}'
      const root = createCruiseFixture({
        'tsconfig.json': original,
        'app/input.ts': 'export {}',
        '.baseline-depcruise.tsconfig.json': 'preserve',
      })
      try {
        const run = runCruiseProbe(
          root,
          `
        try {
          const result = withCruiseTsconfig(config, (temporary) => {
            const parsed = JSON.parse(readFileSync(temporary, 'utf8'));
            if ((statSync(temporary).mode & 0o777) !== 0o600) throw Error('bad permissions');
            if (parsed.extends !== config || !temporary.includes('.baseline-depcruise-')) throw Error('bad temporary');
            if (${JSON.stringify(outcome)} === 'throw') throw Error('operation failure');
            if (${JSON.stringify(outcome)} === 'thenable') return { then() {} };
            return 17;
          });
          process.stdout.write(String(result));
        } catch (error) { process.stderr.write(String(error)); process.exitCode = 1; }
      `,
        )
        expect(run.status).toBe(outcome === 'return' ? 0 : 1)
        if (outcome === 'return') expect(run.stdout).toBe('17')
        expect(readFileSync(join(root, 'tsconfig.json'), 'utf8')).toBe(original)
        expect(statSync(join(root, 'tsconfig.json')).mode & 0o777).toBe(0o644)
        expect(
          readFileSync(join(root, '.baseline-depcruise.tsconfig.json'), 'utf8'),
        ).toBe('preserve')
        expect(
          readdirSync(root).filter((name) =>
            name.startsWith('.baseline-depcruise-'),
          ),
        ).toEqual([])
      } finally {
        rmSync(root, { recursive: true, force: true })
      }
    },
  )

  it('uses the original no-alias config and enforces requirePaths', () => {
    const root = createCruiseFixture({
      'tsconfig.json': '{}',
      'input.ts': 'export {}',
    })
    try {
      const run = runCruiseProbe(
        root,
        'process.stdout.write(String(withCruiseTsconfig(config, (selected) => selected === config))); try { withCruiseTsconfig(config, () => 0, { requirePaths: true }); } catch { process.stdout.write(":required"); }',
      )
      expect(run.status, run.stderr).toBe(0)
      expect(run.stdout).toBe('true:required')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
  it('rejects asynchronous operations even without aliases', () => {
    const root = createCruiseFixture({
      'tsconfig.json': '{}',
      'input.ts': 'export {}',
    })
    try {
      const run = runCruiseProbe(
        root,
        'withCruiseTsconfig(config, () => ({ then() {} }))',
      )
      expect(run.status).not.toBe(0)
      expect(run.stderr).toContain('requires a synchronous operation')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('never removes a preexisting colliding filename', () => {
    const root = createCruiseFixture({
      'tsconfig.json': '{"compilerOptions":{"paths":{"~/*":["app/*"]}}}',
      'app/input.ts': 'export {}',
      '.baseline-depcruise-collision.json': 'preserve collision',
    })
    try {
      const run = runCruiseProbe(
        root,
        'crypto.randomUUID = () => "collision"; syncBuiltinESMExports(); withCruiseTsconfig(config, () => { throw Error("must not run"); })',
      )
      expect(run.status).not.toBe(0)
      expect(run.stderr).toContain('EEXIST')
      expect(
        readFileSync(join(root, '.baseline-depcruise-collision.json'), 'utf8'),
      ).toBe('preserve collision')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
