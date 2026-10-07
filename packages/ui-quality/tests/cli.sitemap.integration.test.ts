import { copyFileSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { describe, expect, it } from 'vitest'

import { runCli } from '@/cli/runCli.js'

const fixed = fileURLToPath(
  new URL('fixtures/site/fixed.html', import.meta.url),
)

// A site whose sitemap publishes artist pages and a legal page that the
// configuration, listing the home page alone, never renders.
const uncoveredOf = async (argv: string[]): Promise<string[]> => {
  const site = mkdtempSync(join(tmpdir(), 'uiq-site-'))
  copyFileSync(fixed, join(site, 'index.html'))
  const base = pathToFileURL(site).href
  writeFileSync(
    join(site, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${base}/index.html</loc></url>
  <url><loc>${base}/artistas/alba.html</loc></url>
  <url><loc>${base}/artistas/bruno.html</loc></url>
  <url><loc>${base}/legal.html?lang=es&amp;v=2</loc></url>
</urlset>
`,
  )
  const root = mkdtempSync(join(tmpdir(), 'uiq-'))
  writeFileSync(
    join(root, 'codeality-ui.json'),
    JSON.stringify({
      baseUrl: base,
      routes: ['/index.html'],
      viewports: [{ width: 1440, height: 900 }],
      colorSchemes: ['light'],
    }),
  )
  const out: string[] = []
  await runCli(['check', '--json', ...argv], {
    root,
    stdout: (text: string) => out.push(text),
    stderr: () => undefined,
  })
  const { findings } = JSON.parse(out.join('')) as {
    findings: { rule: string; route: string; message: string }[]
  }
  return findings
    .filter((finding) => finding.rule === 'route-uncovered')
    .map((finding) => `${finding.route} ${finding.message}`)
}

describe('codeality-ui sitemap coverage', () => {
  it('warns once per sitemap template no configured route renders', async () => {
    const uncovered = await uncoveredOf([])
    expect(uncovered.map((line) => line.split(' ')[0])).toEqual([
      '/artistas/*',
      '/legal.html',
    ])
    expect(uncovered[0]).toContain('lists 2 page(s) under /artistas/*')
  }, 120_000)
  it('leaves a run of selected routes alone', async () => {
    expect(await uncoveredOf(['--routes', '/index.html'])).toEqual([])
  }, 120_000)
})
