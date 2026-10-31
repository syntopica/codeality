import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { runCli } from '@/cli/runCli.js'

import { captureCli } from './captureCli.js'
import { cliProject } from './cliProject.js'

describe('codeality-ui on the broken inbox', () => {
  it('finds every planted defect on the broken inbox', async () => {
    const root = cliProject(['/broken.html'], ['light', 'dark'])
    const run = captureCli(root)
    expect(await runCli(['check', '--json'], run.io)).toBe(1)
    const { findings } = JSON.parse(run.out.join('')) as {
      findings: { rule: string }[]
    }
    expect(
      [...new Set(findings.map((finding) => finding.rule))].sort(),
    ).toEqual([
      'a11y/color-contrast',
      'bare-url',
      'console-error',
      'content-width',
      'control-inset',
      'edge-misaligned',
      'fixed-overflow',
      'icon-contrast',
      'palette',
      'raw-placeholder',
      'row-misaligned',
      'text-clipped',
      'text-hard-cut',
    ])
    expect(existsSync(join(root, '.codeality-ui', 'report.json'))).toBe(true)
    expect(
      existsSync(
        join(
          root,
          '.codeality-ui',
          'screens',
          'broken_html.1920x1080.dark.png',
        ),
      ),
    ).toBe(true)
  })
})
