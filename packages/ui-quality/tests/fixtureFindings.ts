import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runCli } from '@/cli/runCli.js'

import type { FixtureFinding } from './FixtureFinding.js'

const site = fileURLToPath(new URL('fixtures/site', import.meta.url))

/**
 * The findings of `check --json` over the fixture site, in a fresh project at
 * `root`: one 1440x900 light screen unless `config` says otherwise.
 */
export const fixtureFindings = async (
  config: Record<string, unknown>,
  root: string = mkdtempSync(join(tmpdir(), 'uiq-')),
): Promise<FixtureFinding[]> => {
  writeFileSync(
    join(root, 'codeality-ui.json'),
    JSON.stringify({
      baseUrl: `file://${site}`,
      viewports: [{ width: 1440, height: 900 }],
      colorSchemes: ['light'],
      ...config,
    }),
  )
  const out: string[] = []
  await runCli(['check', '--json'], {
    root,
    stdout: (text: string) => out.push(text),
    stderr: () => undefined,
  })
  return (JSON.parse(out.join('')) as { findings: FixtureFinding[] }).findings
}
