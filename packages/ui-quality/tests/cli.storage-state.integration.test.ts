import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { runCli } from '@/cli/runCli.js'

const site = fileURLToPath(new URL('fixtures/site', import.meta.url))

const check = async (root: string) => {
  const err: string[] = []
  const code = await runCli(['check'], {
    root,
    stdout: () => undefined,
    stderr: (text: string) => err.push(text),
  })
  return { code, err: err.join('') }
}

describe('codeality-ui auth.storageState', () => {
  it('uses a minted session file without credentials, and stops when it is missing', async () => {
    const root = mkdtempSync(join(tmpdir(), 'uiq-'))
    writeFileSync(
      join(root, 'codeality-ui.json'),
      JSON.stringify({
        baseUrl: `file://${site}`,
        routes: ['/fixed.html'],
        viewports: [{ width: 1440, height: 900 }],
        colorSchemes: ['light'],
        auth: {
          loginPath: '/login.html',
          usernameEnv: 'UIQ_TEST_MISSING_USER',
          storageState: 'session.json',
        },
      }),
    )
    const missing = await check(root)
    expect(missing.code).toBe(2)
    expect(missing.err).toContain(
      'auth.storageState session.json does not exist',
    )
    writeFileSync(
      join(root, 'session.json'),
      JSON.stringify({ cookies: [], origins: [] }),
    )
    const minted = await check(root)
    expect(minted.code).not.toBe(2)
    expect(minted.err).not.toContain('UIQ_TEST_MISSING_USER')
  })
})
