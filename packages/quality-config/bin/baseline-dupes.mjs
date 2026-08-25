#!/usr/bin/env node
// Runs jscpd against this package's canonical `jscpd.json`.
//
// jscpd 5.x is a Rust binary that reads JSON only - it has no JS config
// loader - so this gate cannot ship as a factory the way knip,
// dependency-cruiser and lefthook do. It ships as the config file plus this
// runner instead: one file, read in place, never copied into the consuming
// repo. Before this, `.jscpd.json` was duplicated byte for byte in the repo
// root and all eight templates, and every adopter had to copy it too.
//
// Usage:
//   baseline-dupes             # scan the current directory
//   baseline-dupes packages    # scan only these paths
//
// Any further flag is passed straight through to jscpd and wins over the
// config file, so `baseline-dupes . --min-tokens 120` still works.
import { spawnSync } from 'node:child_process'
import { argv, exit } from 'node:process'
import { fileURLToPath } from 'node:url'

const config = fileURLToPath(new URL('../jscpd.json', import.meta.url))
const args = argv.slice(2)
const paths = args.length ? args : ['.']

const result = spawnSync(
  'pnpm',
  ['exec', 'jscpd', ...paths, '--config', config],
  {
    stdio: 'inherit',
  },
)

if (result.error) {
  console.error(`baseline-dupes: could not run jscpd - ${result.error.message}`)
  exit(1)
}
exit(result.status ?? 1)
