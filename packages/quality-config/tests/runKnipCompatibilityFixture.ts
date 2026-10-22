import { spawnSync } from 'node:child_process'

export function runKnipCompatibilityFixture(root: string) {
  return spawnSync(
    process.execPath,
    [
      new URL('../node_modules/knip/bin/knip.js', import.meta.url).pathname,
      '--config',
      'knip.config.ts',
      '--treat-config-hints-as-errors',
      '--reporter',
      new URL('./fixtures/reportKnipCompatibility.mjs', import.meta.url)
        .pathname,
    ],
    { cwd: root, encoding: 'utf8', timeout: 20_000 },
  )
}
