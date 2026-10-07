import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { runCli } from '@/cli/runCli.js'

const site = fileURLToPath(new URL('fixtures/site', import.meta.url))
const RULES = new Set([
  'duplicate-nav-icon',
  'mixed-icon-family',
  'transition-all',
])

describe('codeality-ui icons and transitions', () => {
  it('reports a shared nav icon, mixed icon sets and transition: all', async () => {
    const root = mkdtempSync(join(tmpdir(), 'uiq-'))
    writeFileSync(
      join(root, 'codeality-ui.json'),
      JSON.stringify({
        baseUrl: `file://${site}`,
        routes: ['/icons.html'],
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
      findings: { rule: string; subject: string }[]
    }
    expect(
      findings
        .filter((finding) => RULES.has(finding.rule))
        .map((finding) => `${finding.rule} ${finding.subject}`)
        .sort(),
    ).toEqual([
      'duplicate-nav-icon Clientes / Contactos',
      'mixed-icon-family main > ul',
      'transition-all main > div.card',
    ])
  }, 120_000)
})
