import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { runCli } from '@/cli/runCli.js'

const CONFIG = 'codeality-ui.json'
const site = fileURLToPath(new URL('fixtures/site', import.meta.url))

const io = (root: string) => {
  const out: string[] = []
  const err: string[] = []
  return {
    out,
    err,
    io: {
      root,
      stdout: (text: string) => out.push(text),
      stderr: (text: string) => err.push(text),
    },
  }
}

const project = (routes: unknown[]): string => {
  const root = mkdtempSync(join(tmpdir(), 'uiq-'))
  writeFileSync(
    join(root, CONFIG),
    JSON.stringify({
      baseUrl: `file://${site}`,
      routes,
      viewports: [
        { width: 1920, height: 1080 },
        { width: 1440, height: 900 },
      ],
      palette: {
        variablePrefixes: ['--brand-'],
        colors: ['#ffffff', '#000000'],
      },
    }),
  )
  return root
}

describe('codeality-ui', () => {
  it('prints the version and the usage, and rejects an unknown command', async () => {
    const run = io(tmpdir())
    expect(await runCli(['--version'], run.io)).toBe(0)
    expect(run.out.join('')).toMatch(/^codeality-ui \d+\.\d+\.\d+\n$/)
    expect(await runCli(['--help'], run.io)).toBe(0)
    expect(await runCli(['nope'], run.io)).toBe(2)
    expect(await runCli([], run.io)).toBe(2)
  })
  it('init writes the configuration and ignores the state directory once', async () => {
    const root = mkdtempSync(join(tmpdir(), 'uiq-'))
    const run = io(root)
    expect(await runCli(['init'], run.io)).toBe(0)
    expect(await runCli(['--project', root, 'init'], io(tmpdir()).io)).toBe(0)
    expect(readFileSync(join(root, '.gitignore'), 'utf8')).toBe(
      '/.codeality-ui/\n',
    )
    expect(existsSync(join(root, CONFIG))).toBe(true)
  })
  it('finds every planted defect on the broken inbox', async () => {
    const root = project(['/broken.html'])
    const run = io(root)
    expect(await runCli(['check', '--json'], run.io)).toBe(1)
    const { findings } = JSON.parse(run.out.join('')) as {
      findings: { rule: string }[]
    }
    expect(
      [...new Set(findings.map((finding) => finding.rule))].sort(),
    ).toEqual([
      'a11y/color-contrast',
      'bare-url',
      'console-error',
      'content-width',
      'control-inset',
      'edge-misaligned',
      'fixed-overflow',
      'icon-contrast',
      'palette',
      'raw-placeholder',
      'row-misaligned',
      'text-clipped',
      'text-hard-cut',
    ])
    expect(existsSync(join(root, '.codeality-ui', 'report.json'))).toBe(true)
    expect(
      existsSync(
        join(
          root,
          '.codeality-ui',
          'screens',
          'broken_html.1920x1080.dark.png',
        ),
      ),
    ).toBe(true)
  })
  it('passes the fixed inbox, and the baseline carries known debt', async () => {
    const fixed = project(['/fixed.html'])
    const run = io(fixed)
    expect(await runCli(['check'], run.io)).toBe(0)
    expect(run.out.join('')).toContain('0 findings')
    const broken = project(['/broken.html'])
    expect(await runCli(['baseline', 'create'], io(broken).io)).toBe(0)
    expect(await runCli(['baseline', 'create'], io(broken).io)).toBe(2)
    const check = io(broken)
    expect(await runCli(['check'], check.io)).toBe(0)
    expect(check.out.join('')).toMatch(/0 new, \d+ known, 0 resolved/)
    expect(await runCli(['baseline', 'check'], io(broken).io)).toBe(0)
    expect(await runCli(['baseline', 'update'], io(broken).io)).toBe(0)
  })
  it('reads tokens stored as bare HSL triplets into the palette', async () => {
    const run = io(project(['/triplets.html']))
    expect(await runCli(['check', '--json'], run.io)).toBe(0)
    expect(run.out.join('')).not.toContain('"rule": "palette"')
  })
  it('writes the localStorage of a route before the page reads it', async () => {
    const bare = io(project(['/storage.html']))
    expect(await runCli(['check'], bare.io)).toBe(1)
    expect(bare.out.join('')).toContain('blank-route')
    const seeded = io(
      project([{ path: '/storage.html', localStorage: { view: 'sales' } }]),
    )
    expect(await runCli(['check'], seeded.io)).toBe(0)
  })
  it('clicks through to a screen, and reports a click with no target', async () => {
    const reached = io(
      project([{ path: '/click.html', click: ['#customers'] }]),
    )
    expect(await runCli(['check'], reached.io)).toBe(0)
    const missed = io(project([{ path: '/click.html', click: ['#suppliers'] }]))
    expect(await runCli(['check'], missed.io)).toBe(1)
    expect(missed.out.join('')).toContain('click-failed')
  })
  it('sorts and searches the main table, and reports the controls that do not work', async () => {
    const working = io(project(['/table.html']))
    expect(await runCli(['check'], working.io)).toBe(0)
    const broken = io(project(['/table.html#broken']))
    expect(await runCli(['check', '--json'], broken.io)).toBe(1)
    const { findings } = JSON.parse(broken.out.join('')) as {
      findings: { rule: string; subject: string }[]
    }
    expect(
      findings.map((finding) => `${finding.rule} ${finding.subject}`).sort(),
    ).toEqual(['filter-broken search box', 'sort-broken column "Amount"'])
    // Every control that changes nothing is waited out in full, so the
    // broken page takes longer than one that works.
  }, 120_000)
  it('searches for nothing, pages the table and fails a save, and reports what the user is not told', async () => {
    const silent = io(project(['/table.html#silent']))
    expect(await runCli(['check', '--json'], silent.io)).toBe(1)
    const { findings } = JSON.parse(silent.out.join('')) as {
      findings: { rule: string; subject: string }[]
    }
    expect(
      findings.map((finding) => `${finding.rule} ${finding.subject}`).sort(),
    ).toEqual([
      'action-silent form submit "Add"',
      'empty-state-missing search box',
      'pagination-broken next page',
    ])
  })
  it('fails with exit 2 on a login it cannot perform', async () => {
    const root = project(['/fixed.html'])
    const config = JSON.parse(
      readFileSync(join(root, CONFIG), 'utf8'),
    ) as Record<string, unknown>
    writeFileSync(
      join(root, CONFIG),
      JSON.stringify({
        ...config,
        auth: {
          loginPath: '/fixed.html',
          usernameEnv: 'UIQ_TEST_MISSING_USER',
        },
      }),
    )
    const run = io(root)
    expect(await runCli(['check'], run.io)).toBe(2)
    expect(run.err.join('')).toContain('UIQ_TEST_MISSING_USER is not set')
  })
})
