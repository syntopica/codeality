#!/usr/bin/env node
// The licences a package would ship, checked against an allowlist.
//
// Usage:
//   baseline-licenses [dir]
//
// Scoped to one package's *production* closure - its `dependencies`, and
// theirs, transitively. Development dependencies are excluded on purpose: a
// copyleft test runner is not distributed and is not a licence question, while
// a copyleft transitive runtime dependency of an MIT package is.
//
// `pnpm licenses list` is not the data source. Inside a workspace it reports
// the whole store - 986 packages for a config package with eight direct
// dependencies - so it cannot answer the only question that matters here.
// Walking the closure from the manifest can.
//
// Six packages in this repository publish to npm under MIT. Nothing verified
// that a transitive dependency had not introduced a copyleft licence into that
// tree. It had not, today: the four copyleft packages in the workspace
// (sharp-libvips, axe-core, lightningcss, node-forge) are all reached through
// templates and dev tooling. Nothing would have noticed if that changed.
import { readFile, realpath } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { argv, cwd, exit } from 'node:process'

// SPDX identifiers that permit redistribution inside an MIT-licensed package
// without imposing terms on the consumer. Anything outside this set is not
// automatically wrong - it is a decision, and it has to be recorded as one.
const PERMISSIVE = new Set([
  '0BSD',
  'Apache-2.0',
  'BlueOak-1.0.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'CC0-1.0',
  'ISC',
  'MIT',
  'MIT-0',
  'Python-2.0',
  'Unlicense',
  'WTFPL',
  'Zlib',
])

const ALLOWLIST_FILE = '.baseline-licenses.json'
const root = resolve(cwd(), argv[2] ?? '.')
const today = new Date().toISOString().slice(0, 10)

const allowlist = await readAllowlist(resolve(root, ALLOWLIST_FILE))
const seen = new Map()
await walk(root, true)

const findings = []
const waived = []
const stale = []

for (const [name, info] of seen) {
  if (isPermissive(info.license)) continue
  const entry = allowlist[name]
  if (!entry) findings.push({ name, ...info })
  else if (entry.expires < today) stale.push({ name, ...info, entry })
  else waived.push({ name, ...info, entry })
}

for (const item of waived) {
  console.log(
    `waived   ${item.license} ${item.name}  (expires ${item.entry.expires})\n` +
      `         ${item.entry.reason}`,
  )
}
for (const item of stale) {
  console.error(
    `EXPIRED  ${item.license} ${item.name}  (expired ${item.entry.expires})\n` +
      `         ${item.entry.reason}\n         Re-check it, then renew or remove it.`,
  )
}
for (const item of findings) {
  console.error(
    `FAIL     ${item.license} ${item.name}\n` +
      `         reached via ${item.via}\n` +
      `         Not a permissive licence. Replace the dependency, or record ` +
      `the decision in ${ALLOWLIST_FILE} with a reason and an expiry.`,
  )
}

console.log(
  `\nbaseline-licenses: ${seen.size} production dependencies, ` +
    `${findings.length} unreviewed, ${stale.length} expired, ${waived.length} waived.`,
)
if (findings.length + stale.length) exit(1)

// An SPDX expression, not just an identifier: `MIT OR Apache-2.0` is
// permissive because one of its options is, and `(BSD-3-Clause OR GPL-2.0)`
// is too - the consumer picks. `AND` is the opposite: every term binds.
function isPermissive(license) {
  if (!license) return false
  const expression = license.replace(/[()]/g, '').trim()
  if (/\bAND\b/i.test(expression)) {
    return expression
      .split(/\s+AND\s+/i)
      .every((term) => isPermissive(term.trim()))
  }
  if (/\bOR\b/i.test(expression)) {
    return expression
      .split(/\s+OR\s+/i)
      .some((term) => isPermissive(term.trim()))
  }
  return PERMISSIVE.has(expression.replace(/\+$/, ''))
}

async function walk(dir, isRoot, via = '') {
  let manifest
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    manifest = JSON.parse(await readFile(resolve(dir, 'package.json'), 'utf8'))
  } catch {
    return
  }

  if (!isRoot) {
    if (seen.has(manifest.name)) return
    seen.set(manifest.name, { license: licenseOf(manifest), via })
  }

  for (const name of Object.keys(manifest.dependencies ?? {})) {
    const target = await resolvePackage(dir, name)
    if (!target) continue
    await walk(target, false, isRoot ? name : `${via} > ${name}`)
  }
}

function licenseOf(manifest) {
  if (typeof manifest.license === 'string') return manifest.license
  if (typeof manifest.license?.type === 'string') return manifest.license.type
  if (Array.isArray(manifest.licenses)) {
    return manifest.licenses.map((l) => l.type ?? l).join(' OR ')
  }
  return undefined
}

// Node's own resolution order, walked by hand: `require.resolve` refuses
// packages whose `exports` map has no `./package.json` entry, which is most of
// them, and would report a package that is installed and working as missing.
async function resolvePackage(from, name) {
  let dir = from
  for (;;) {
    const candidate = resolve(dir, 'node_modules', name)
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      await readFile(resolve(candidate, 'package.json'), 'utf8')
      // Resolved through the symlink, not to it. Under pnpm's isolated layout
      // every installed package is a link into `.pnpm/<hash>/node_modules/`,
      // and its own dependencies are siblings *there*. Climbing from the link
      // path instead walks back out to the workspace root and finds none of
      // them - which is why this reported eight dependencies for a package
      // whose real closure is in the hundreds.
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      return await realpath(candidate)
    } catch {
      /* keep climbing */
    }
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

async function readAllowlist(path) {
  let raw
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    raw = await readFile(path, 'utf8')
  } catch {
    return {}
  }
  const parsed = JSON.parse(raw)
  for (const [name, entry] of Object.entries(parsed)) {
    if (!entry?.reason || !entry?.expires) {
      console.error(
        `baseline-licenses: allowlist entry ${name} needs both \`reason\` and \`expires\`.`,
      )
      exit(2)
    }
  }
  return parsed
}
