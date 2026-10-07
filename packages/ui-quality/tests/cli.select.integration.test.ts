import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { runCli } from '@/cli/runCli.js'

const site = fileURLToPath(new URL('fixtures/site', import.meta.url))

describe('codeality-ui select text', () => {
  it('reports the select too short for its line and passes the roomy one', async () => {
    const root = mkdtempSync(join(tmpdir(), 'uiq-'))
    writeFileSync(
      join(root, 'codeality-ui.json'),
      JSON.stringify({
        baseUrl: `file://${site}`,
        routes: ['/select.html'],
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
      findings: { rule: string; message: string }[]
    }
    const clipped = findings.filter(
      (finding) =>
        finding.rule === 'text-clipped' && finding.message.includes('select'),
    )
    expect(clipped).toHaveLength(1)
    expect(clipped[0]?.message).toMatch(/10px content box/)
  }, 120_000)
})
