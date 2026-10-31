import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { runCli } from '@/cli/runCli.js'

import { CLI_CONFIG } from './CLI_CONFIG.js'
import { captureCli } from './captureCli.js'
import { cliProject } from './cliProject.js'

// The slow capture scenarios live in their own cli.*.integration.test.ts
// files so Vitest can run them on separate workers.
describe('codeality-ui', () => {
  it('prints the version and the usage, and rejects an unknown command', async () => {
    const run = captureCli(tmpdir())
    expect(await runCli(['--version'], run.io)).toBe(0)
    expect(run.out.join('')).toMatch(/^codeality-ui \d+\.\d+\.\d+\n$/)
    expect(await runCli(['--help'], run.io)).toBe(0)
    expect(await runCli(['nope'], run.io)).toBe(2)
    expect(await runCli([], run.io)).toBe(2)
  })
  it('init writes the configuration and ignores the state directory once', async () => {
    const root = mkdtempSync(join(tmpdir(), 'uiq-'))
    const run = captureCli(root)
    expect(await runCli(['init'], run.io)).toBe(0)
    expect(
      await runCli(['--project', root, 'init'], captureCli(tmpdir()).io),
    ).toBe(0)
    expect(readFileSync(join(root, '.gitignore'), 'utf8')).toBe(
      '/.codeality-ui/\n',
    )
    expect(existsSync(join(root, CLI_CONFIG))).toBe(true)
  })
  it('reads tokens stored as bare HSL triplets into the palette', async () => {
    const run = captureCli(cliProject(['/triplets.html']))
    expect(await runCli(['check', '--json'], run.io)).toBe(0)
    expect(run.out.join('')).not.toContain('"rule": "palette"')
  })
  it('writes the localStorage of a route before the page reads it', async () => {
    const bare = captureCli(cliProject(['/storage.html']))
    expect(await runCli(['check'], bare.io)).toBe(1)
    expect(bare.out.join('')).toContain('blank-route')
    const seeded = captureCli(
      cliProject([{ path: '/storage.html', localStorage: { view: 'sales' } }]),
    )
    expect(await runCli(['check'], seeded.io)).toBe(0)
  })
  it('clicks through to a screen, and reports a click with no target', async () => {
    const reached = captureCli(
      cliProject([{ path: '/click.html', click: ['#customers'] }]),
    )
    expect(await runCli(['check'], reached.io)).toBe(0)
    const missed = captureCli(
      cliProject([{ path: '/click.html', click: ['#suppliers'] }]),
    )
    expect(await runCli(['check'], missed.io)).toBe(1)
    expect(missed.out.join('')).toContain('click-failed')
  })
  it('fails with exit 2 on a login it cannot perform', async () => {
    const root = cliProject(['/fixed.html'])
    const config = JSON.parse(
      readFileSync(join(root, CLI_CONFIG), 'utf8'),
    ) as Record<string, unknown>
    writeFileSync(
      join(root, CLI_CONFIG),
      JSON.stringify({
        ...config,
        auth: {
          loginPath: '/fixed.html',
          usernameEnv: 'UIQ_TEST_MISSING_USER',
        },
      }),
    )
    const run = captureCli(root)
    expect(await runCli(['check'], run.io)).toBe(2)
    expect(run.err.join('')).toContain('UIQ_TEST_MISSING_USER is not set')
  })
})
