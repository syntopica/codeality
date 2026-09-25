import {
  execFileSync,
  spawnSync,
  type SpawnSyncReturns,
} from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { beforeAll, describe, expect, it } from 'vitest'

const bin = new URL('../bin/codeality-db.mjs', import.meta.url).pathname
const run = (args: string[], cwd: string): SpawnSyncReturns<string> =>
  spawnSync('node', [bin, ...args], { cwd, encoding: 'utf8' })

describe('codeality-db', () => {
  beforeAll(() => {
    execFileSync('pnpm', ['build'], {
      cwd: new URL('..', import.meta.url).pathname,
      stdio: 'ignore',
    })
  }, 60_000)
  it('prints the version and the usage', () => {
    expect(run(['--version'], tmpdir()).stdout).toMatch(
      /^codeality-db \d+\.\d+\.\d+\n$/,
    )
    const help = run(['--help'], tmpdir())
    expect(help.status).toBe(0)
    expect(help.stdout).toMatch(/init.*check.*audit.*gate.*baseline/s)
    expect(run([], tmpdir()).status).toBe(2)
  })
  it('runs init then check on a fresh project with a permissive policy', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, 'supabase/migrations'), { recursive: true })
    writeFileSync(
      join(root, 'supabase/migrations/1.sql'),
      'create table public.t (id bigint primary key);\nalter table public.t enable row level security;\ncreate policy "p" on public.t for select using (true);',
    )
    expect(run(['init', '--apply'], root).status).toBe(0)
    const check = run(['--project', root, 'check'], tmpdir())
    expect(check.status).toBe(1)
    expect(check.stdout).toMatch(/BDB001/)
  })
})
