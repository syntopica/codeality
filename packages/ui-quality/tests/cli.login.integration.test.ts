import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, describe, expect, it } from 'vitest'

import { runCli } from '@/cli/runCli.js'

const site = fileURLToPath(new URL('fixtures/site', import.meta.url))

describe('codeality-ui login', () => {
  afterEach(() => {
    delete process.env['UIQ_TEST_USER']
    delete process.env['UIQ_TEST_PASSWORD']
  })
  it('fills the email field rather than a hidden text field before it', async () => {
    process.env['UIQ_TEST_USER'] = 'reader@example.com'
    process.env['UIQ_TEST_PASSWORD'] = 'not-a-secret'
    const root = mkdtempSync(join(tmpdir(), 'uiq-'))
    writeFileSync(
      join(root, 'codeality-ui.json'),
      JSON.stringify({
        baseUrl: `file://${site}`,
        routes: ['/gate.html'],
        viewports: [{ width: 1440, height: 900 }],
        colorSchemes: ['light'],
        auth: {
          loginPath: '/login.html',
          usernameEnv: 'UIQ_TEST_USER',
          passwordEnv: 'UIQ_TEST_PASSWORD',
        },
      }),
    )
    const err: string[] = []
    const code = await runCli(['check'], {
      root,
      stdout: () => undefined,
      stderr: (text: string) => err.push(text),
    })
    expect(err.join('')).not.toContain('error:')
    expect(code).toBe(0)
  }, 120_000)
})
