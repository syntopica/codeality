import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { runCli } from '@/cli/runCli.js'

const site = fileURLToPath(new URL('fixtures/site', import.meta.url))

// A login is configured but its credentials are not set, as on a machine that
// only checks the public pages.
const project = (): string => {
  const root = mkdtempSync(join(tmpdir(), 'uiq-'))
  writeFileSync(
    join(root, 'codeality-ui.json'),
    JSON.stringify({
      baseUrl: `file://${site}`,
      routes: ['/fixed.html', '/gate.html'],
      viewports: [{ width: 1440, height: 900 }],
      colorSchemes: ['light'],
      auth: {
        loginPath: '/login.html',
        usernameEnv: 'UIQ_UNSET_USER',
        passwordEnv: 'UIQ_UNSET_PASSWORD',
      },
    }),
  )
  return root
}

const check = async (
  argv: string[],
): Promise<{ code: number; err: string }> => {
  const err: string[] = []
  const code = await runCli(['check', ...argv], {
    root: project(),
    stdout: () => undefined,
    stderr: (text: string) => err.push(text),
  })
  return { code, err: err.join('') }
}

describe('codeality-ui check --routes', () => {
  it('stops before the browser when the full run lacks credentials', async () => {
    const { code, err } = await check([])
    expect(code).toBe(2)
    expect(err).toContain('UIQ_UNSET_USER is not set')
  })
  it('measures public routes without credentials', async () => {
    const { code, err } = await check(['--routes', '/fixed*'])
    expect(err).not.toContain('error:')
    expect(code).toBe(0)
  }, 120_000)
  it('still fails on a selected route that bounces to the login', async () => {
    const { code, err } = await check(['--routes', '/gate.html'])
    expect(code).toBe(2)
    expect(err).toContain('UIQ_UNSET_USER is not set')
  }, 120_000)
  it('refuses a glob that selects nothing', async () => {
    const { code, err } = await check(['--routes', '/admin/**'])
    expect(code).toBe(2)
    expect(err).toContain(
      '--routes /admin/** matches none of the configured routes',
    )
  })
})
