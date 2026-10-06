import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { runCli } from '@/cli/runCli.js'

const site = fileURLToPath(new URL('fixtures/site', import.meta.url))

// An app that renders only under its desktop shell, with a message body in a
// sandboxed frame that runs no scripts: axe used to wait on that frame forever.
describe('codeality-ui on a desktop-shell page', () => {
  it('runs the init script and audits around a script-less frame', async () => {
    const root = mkdtempSync(join(tmpdir(), 'uiq-'))
    writeFileSync(
      join(root, 'bridge.js'),
      "window.__SHELL_BRIDGE__ = { greeting: () => 'Inbox' }\n",
    )
    writeFileSync(
      join(root, 'codeality-ui.json'),
      JSON.stringify({
        baseUrl: `file://${site}`,
        routes: [{ path: '/shell.html', waitFor: 'text=Inbox' }],
        viewports: [{ width: 1440, height: 900 }],
        colorSchemes: ['light'],
        initScripts: ['bridge.js'],
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
      'a11y/axe-timeout',
    )
  })
})
