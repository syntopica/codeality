import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { fixtureFindings } from './fixtureFindings.js'

// An app that renders only under its desktop shell, with a message body in a
// sandboxed frame that runs no scripts: axe used to wait on that frame forever.
describe('codeality-ui on a desktop-shell page', () => {
  it('runs the init script and audits around a script-less frame', async () => {
    const root = mkdtempSync(join(tmpdir(), 'uiq-'))
    writeFileSync(
      join(root, 'bridge.js'),
      "window.__SHELL_BRIDGE__ = { greeting: () => 'Inbox' }\n",
    )
    const findings = await fixtureFindings(
      {
        routes: [{ path: '/shell.html', waitFor: 'text=Inbox' }],
        initScripts: ['bridge.js'],
      },
      root,
    )
    expect(findings.map((finding) => finding.rule)).not.toContain(
      'a11y/axe-timeout',
    )
  })
})
