import { afterEach, describe, expect, it, vi } from 'vitest'

import { kyselyCompileMain } from '@/adapters/kysely/kyselyCompileMain.js'
import { runKyselyCompile } from '@/adapters/kysely/runKyselyCompile.js'
import type { CommandRunner } from '@/tools/CommandRunner.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

const FIXTURE = new URL('../../fixtures/kysely', import.meta.url).pathname
const request = {
  root: FIXTURE,
  folder: 'folder',
  export: 'migrations',
  dialects: ['sqlite' as const],
}
const answering =
  (status: number, stdout: string, stderr = ''): CommandRunner =>
  () => ({ status, stdout, stderr, missing: false })

describe('the compiler process', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })
  it('prints the compiled migrations as JSON and exits 0', async () => {
    const out: string[] = []
    vi.spyOn(process.stdout, 'write').mockImplementation((text) => {
      out.push(String(text))
      return true
    })
    expect(await kyselyCompileMain([JSON.stringify(request)])).toBe(0)
    expect(
      (JSON.parse(out.join('')) as { name: string }[]).map((m) => m.name),
    ).toEqual(['2026_01_01_first', '2026_01_02_second'])
  })
  it('exits 2 on a configuration error and 3 on anything else', async () => {
    const err: string[] = []
    vi.spyOn(process.stderr, 'write').mockImplementation((text) => {
      err.push(String(text))
      return true
    })
    expect(
      await kyselyCompileMain([
        JSON.stringify({ ...request, folder: 'missing' }),
      ]),
    ).toBe(2)
    expect(await kyselyCompileMain(['not json'])).toBe(3)
    expect(err[0]).toMatch(/^configuration error: kysely.migrations: "missing"/)
  })
  it('is run with node and the shipped asset, and its JSON is parsed', () => {
    let seen: { command: string; args: string[] } | undefined
    const runner: CommandRunner = (command, args) => {
      seen = { command, args }
      return { status: 0, stdout: '[]', stderr: '', missing: false }
    }
    expect(runKyselyCompile(runner, request)).toEqual([])
    expect(seen?.command).toBe(process.execPath)
    expect(seen?.args[0]).toMatch(/assets\/kysely-compile\.mjs$/)
    expect(JSON.parse(seen?.args[1] ?? '')).toEqual(request)
  })
  it('maps exit 2 to a ConfigError and any other failure to an Error', () => {
    expect(() =>
      runKyselyCompile(
        answering(
          2,
          '',
          'configuration error: kysely.migrations: "x" does not exist\n',
        ),
        request,
      ),
    ).toThrow(new ConfigError('kysely.migrations: "x" does not exist'))
    expect(() =>
      runKyselyCompile(
        answering(3, '', 'error: kysely is not installed'),
        request,
      ),
    ).toThrow(/compiler exited 3: error: kysely is not installed/)
    expect(() => runKyselyCompile(answering(0, 'oops'), request)).toThrow(
      /printed no JSON/,
    )
  })
})
