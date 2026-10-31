import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { CLI_CONFIG } from './CLI_CONFIG.js'

const site = fileURLToPath(new URL('fixtures/site', import.meta.url))

/**
 * A fresh project over the fixture site checking `routes` at two desktop
 * viewports, returned as its root directory.
 */
export const cliProject = (
  routes: unknown[],
  colorSchemes = ['light'],
): string => {
  const root = mkdtempSync(join(tmpdir(), 'uiq-'))
  writeFileSync(
    join(root, CLI_CONFIG),
    JSON.stringify({
      baseUrl: `file://${site}`,
      routes,
      colorSchemes,
      viewports: [
        { width: 1920, height: 1080 },
        { width: 1440, height: 900 },
      ],
      palette: {
        variablePrefixes: ['--brand-'],
        colors: ['#ffffff', '#000000'],
      },
    }),
  )
  return root
}
