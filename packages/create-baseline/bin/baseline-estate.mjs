#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { argv, cwd, exit } from 'node:process'
import { fileURLToPath } from 'node:url'

import { runConformance } from './conformance/runConformance.mjs'
import { findConsumers } from './estate/findConsumers.mjs'
import { findPythonConsumers } from './estate/findPythonConsumers.mjs'
import { formatEstate } from './estate/formatEstate.mjs'
import { formatPythonEstate } from './estate/formatPythonEstate.mjs'
import { runPythonConformance } from './python/runPythonConformance.mjs'

// Formalises the manual pre-publish sweep. Every release of these packages was
// already being A/B'd by hand against the repositories that consume them -
// that routine caught three defects the templates and the unit tests both
// missed - and this is that routine as one command.
const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

async function main() {
  const root = resolve(cwd(), argv[2] ?? '.')
  const versions = JSON.parse(
    await readFile(resolve(PACKAGE_ROOT, 'baseline-versions.json'), 'utf8'),
  )
  const pythonVersions = JSON.parse(
    await readFile(resolve(PACKAGE_ROOT, 'python-versions.json'), 'utf8'),
  )
  const today = new Date().toISOString().slice(0, 10)

  const consumers = await findConsumers(root)
  const pythonConsumers = await findPythonConsumers(root)
  if (!consumers.length && !pythonConsumers.length) {
    console.log(`baseline-estate: no @busirocket consumers under ${root}.`)
    return
  }

  const rows = []
  for (const consumer of consumers) {
    try {
      const { findings } = await runConformance(consumer.path, versions, today)
      rows.push({ name: consumer.name, findings })
    } catch (error) {
      // One unreadable repository must not take the sweep down with it: the
      // report is most useful precisely when part of the estate is broken.
      rows.push({ name: consumer.name, error: String(error.message) })
    }
  }

  if (rows.length) console.log(formatEstate(rows))

  // The Python projects are a second table with their own columns: the
  // audit that added them found nine gates green on one laptop and running
  // nowhere else, which the JavaScript table could not see at all.
  const pythonRows = []
  for (const consumer of pythonConsumers) {
    try {
      const { findings } = await runPythonConformance(
        consumer.path,
        pythonVersions,
      )
      pythonRows.push({ name: consumer.name, findings })
    } catch (error) {
      pythonRows.push({ name: consumer.name, error: String(error.message) })
    }
  }
  if (pythonRows.length) {
    if (rows.length) console.log('')
    console.log(formatPythonEstate(pythonRows))
  }

  const failing = [...rows, ...pythonRows].filter(
    (row) => row.error || row.findings.some((f) => f.level === 'error'),
  )
  // Exit non-zero so this can gate a release the same way any other check
  // does. The estate is the release's blast radius; publishing into a red one
  // is the mistake this is meant to prevent.
  if (failing.length) exit(1)
}

try {
  await main()
} catch (err) {
  console.error(err)
  exit(1)
}
