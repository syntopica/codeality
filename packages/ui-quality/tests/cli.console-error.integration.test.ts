import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { runCli } from '@/cli/runCli.js'

const site = fileURLToPath(new URL('fixtures/site', import.meta.url))

describe('codeality-ui console-error', () => {
  it('does not report what axe logs while it reads the stylesheets', async () => {
    const root = mkdtempSync(join(tmpdir(), 'uiq-'))
    writeFileSync(
      join(root, 'codeality-ui.json'),
      JSON.stringify({
        baseUrl: `file://${site}`,
        routes: ['/csp.html'],
        viewports: [{ width: 1440, height: 900 }],
        colorSchemes: ['light'],
      }),
    )
    const out: string[] = []
    await runCli(['check', '--json'], {
      root,
      stdout: (text: string) => out.push(text),
      stderr: () => undefined,
    })
    const { findings } = JSON.parse(out.join('')) as {
      findings: { rule: string }[]
    }
    expect(findings.map((finding) => finding.rule)).not.toContain(
      'console-error',
    )
  })
})
