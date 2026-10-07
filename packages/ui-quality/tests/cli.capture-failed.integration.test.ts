import { mkdtempSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { runCli } from '@/cli/runCli.js'

const site = fileURLToPath(new URL('fixtures/site', import.meta.url))

describe('codeality-ui with a route that cannot load', () => {
  it('reports the route and still measures the rest', async () => {
    const root = mkdtempSync(join(tmpdir(), 'uiq-'))
    writeFileSync(
      join(root, 'codeality-ui.json'),
      JSON.stringify({
        baseUrl: `file://${site}`,
        routes: ['/missing.html', '/fixed.html'],
        viewports: [{ width: 1440, height: 900 }],
        colorSchemes: ['light'],
      }),
    )
    const out: string[] = []
    const code = await runCli(['check', '--json'], {
      root,
      stdout: (text: string) => out.push(text),
      stderr: () => undefined,
    })
    expect(code).toBe(1)
    const report = JSON.parse(out.join('')) as {
      findings: { rule: string; route: string }[]
    }
    expect(
      report.findings.map((finding) => `${finding.rule} ${finding.route}`),
    ).toEqual(['capture-failed /missing.html'])
    expect(readdirSync(join(root, '.codeality-ui', 'screens'))).toEqual([
      'fixed_html.1440x900.light.png',
    ])
  }, 120_000)
})
