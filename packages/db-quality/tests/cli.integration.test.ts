import {
  execFileSync,
  spawnSync,
  type SpawnSyncReturns,
} from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
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
  it('runs without typescript until the PostgREST rules need it', () => {
    // A copy of the published files with no node_modules anywhere above it:
    // the bundle's own imports must all resolve, and typescript must not.
    const copy = mkdtempSync(join(tmpdir(), 'dbq-nots-'))
    for (const entry of ['bin', 'dist', 'package.json'])
      cpSync(new URL(`../${entry}`, import.meta.url), join(copy, entry), {
        recursive: true,
      })
    const bare = (args: string[], cwd: string): SpawnSyncReturns<string> =>
      spawnSync('node', [join(copy, 'bin/codeality-db.mjs'), ...args], {
        cwd,
        encoding: 'utf8',
      })
    expect(bare(['--help'], copy).status).toBe(0)
    const root = mkdtempSync(join(tmpdir(), 'dbq-nots-project-'))
    mkdirSync(join(root, 'src'))
    const config = join(root, 'codeality-db.json')
    writeFileSync(config, JSON.stringify({ schemaVersion: 2 }))
    expect(bare(['check'], root).status).toBe(0)
    writeFileSync(
      config,
      JSON.stringify({ schemaVersion: 2, postgrest: { roots: ['src'] } }),
    )
    const postgrest = bare(['check'], root)
    expect(postgrest.status).toBe(3)
    expect(postgrest.stderr).toMatch(/typescript.*PostgREST rules/)
  })
})
