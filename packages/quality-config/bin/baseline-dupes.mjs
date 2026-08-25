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
//   baseline-dupes                                scan the current directory
//   baseline-dupes packages scripts               scan only these paths
//   baseline-dupes . --min-tokens 120             any jscpd flag, passed through
//   baseline-dupes . --also-ignore "**/gen/**"    keep the shared ignores, add these
//
// Arguments are forwarded to jscpd in the order given, untouched apart from
// `--also-ignore`. This runner deliberately does not try to tell a path from a
// flag's value: `--min-tokens 120` and `--config x.json` carry a value that
// looks like neither, and a runner that guesses turns `120` into a scan path.
// The only argument it adds is `--config`, and only when the caller did not
// pass one. Pass an explicit path when you pass flags; a bare
// `baseline-dupes` scans `.`.
//
// `--also-ignore` exists because jscpd's own `--ignore` REPLACES the config's
// list rather than merging into it. Measured on this repo: a config that also
// ignored `**/cargo-baseline/**` scanned 61 files and found 1 clone; adding an
// unrelated `--ignore` took it to 109 files and 4 clones, the shared patterns
// gone. So an adopter with one generated directory to exclude (committed
// Supabase types, a migrations folder, a cpanel build - five of nine repos
// surveyed) had no way to say so without restating every shared pattern in
// their own package.json, which is the duplication this runner exists to
// remove. This flag merges instead, through a generated config deleted again
// on the way out.
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { argv, exit } from 'node:process'
import { fileURLToPath } from 'node:url'

const PACKAGED_CONFIG = fileURLToPath(new URL('../jscpd.json', import.meta.url))

// Splits `--also-ignore a,b` and `--also-ignore=a,b` out, leaving every other
// argument in its original position.
function takeAlsoIgnore(args) {
  const patterns = []
  const rest = []
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--also-ignore') {
      index += 1
      patterns.push(...String(args[index] ?? '').split(','))
      continue
    }
    if (arg.startsWith('--also-ignore=')) {
      patterns.push(...arg.slice('--also-ignore='.length).split(','))
      continue
    }
    rest.push(arg)
  }
  return { patterns: patterns.map((p) => p.trim()).filter(Boolean), rest }
}

// Where the caller's own `--config` sits, if they passed one. `value` is the
// index of the path argument; `inline` is the index of a `--config=x` form.
function findConfig(args) {
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '-c' || args[index] === '--config')
      return { value: index + 1, inline: -1 }
    if (args[index].startsWith('--config=')) return { value: -1, inline: index }
  }
  return { value: -1, inline: -1 }
}

const { patterns, rest } = takeAlsoIgnore(argv.slice(2))
const args = rest.length ? [...rest] : ['.']
const found = findConfig(args)
const sourceConfig =
  found.value !== -1
    ? args[found.value]
    : found.inline !== -1
      ? args[found.inline].slice('--config='.length)
      : PACKAGED_CONFIG

let config = sourceConfig
let scratch
if (patterns.length) {
  let parsed
  try {
    // The config is this package's own file, or a path the caller chose.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    parsed = JSON.parse(readFileSync(sourceConfig, 'utf8'))
  } catch (error) {
    console.error(
      `baseline-dupes: could not read ${sourceConfig} - ${error.message}`,
    )
    exit(1)
  }
  parsed.ignore = [...(parsed.ignore ?? []), ...patterns]
  scratch = mkdtempSync(join(tmpdir(), 'baseline-dupes-'))
  config = join(scratch, 'jscpd.json')
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  writeFileSync(config, JSON.stringify(parsed))
}

if (found.value !== -1) args[found.value] = config
else if (found.inline !== -1) args[found.inline] = `--config=${config}`
else args.push('--config', config)

const result = spawnSync('pnpm', ['exec', 'jscpd', ...args], {
  stdio: 'inherit',
})

if (scratch) rmSync(scratch, { recursive: true, force: true })

if (result.error) {
  console.error(`baseline-dupes: could not run jscpd - ${result.error.message}`)
  exit(1)
}
exit(result.status ?? 1)
