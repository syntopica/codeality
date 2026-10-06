import { existsSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { runCli } from '@/cli/runCli.js'

const site = fileURLToPath(new URL('fixtures/site', import.meta.url))

// A page that switches layout on the user agent: only the emulated phone, not
// a desktop window of the same size, sees the phone layout.
describe('codeality-ui with a phone viewport', () => {
  it('emulates an iPhone for a mobile viewport only', async () => {
    const root = mkdtempSync(join(tmpdir(), 'uiq-'))
    writeFileSync(
      join(root, 'codeality-ui.json'),
      JSON.stringify({
        baseUrl: `file://${site}`,
        routes: ['/phone.html'],
        viewports: [
          { width: 390, height: 844 },
          { width: 390, height: 844, mobile: true },
        ],
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
      findings: { rule: string; screens: string[]; message: string }[]
    }
    const bare = findings.filter((finding) => finding.rule === 'bare-url')
    expect(bare).toHaveLength(1)
    expect(bare[0]?.screens).toEqual(['390x844 phone light'])
    expect(bare[0]?.message).toContain('phone dpr3 touchtrue')
    const screens = join(root, '.codeality-ui', 'screens')
    expect(
      existsSync(join(screens, 'phone_html.390x844-phone.light.png')),
    ).toBe(true)
    expect(existsSync(join(screens, 'phone_html.390x844.light.png'))).toBe(true)
  })
})
