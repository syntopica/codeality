#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { argv, cwd, exit } from 'node:process'
import { fileURLToPath } from 'node:url'

import { runConformance } from './conformance/runConformance.mjs'
import { runDartConformance } from './dart/runDartConformance.mjs'
import { conformRows } from './estate/conformRows.mjs'
import { findConsumers } from './estate/findConsumers.mjs'
import { findDartConsumers } from './estate/findDartConsumers.mjs'
import { findPythonConsumers } from './estate/findPythonConsumers.mjs'
import { findSwiftConsumers } from './estate/findSwiftConsumers.mjs'
import { formatDartEstate } from './estate/formatDartEstate.mjs'
import { formatEstate } from './estate/formatEstate.mjs'
import { formatPythonEstate } from './estate/formatPythonEstate.mjs'
import { formatSwiftEstate } from './estate/formatSwiftEstate.mjs'
import { runPythonConformance } from './python/runPythonConformance.mjs'
import { runSwiftConformance } from './swift/runSwiftConformance.mjs'

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
  const dartVersions = JSON.parse(
    await readFile(resolve(PACKAGE_ROOT, 'dart-versions.json'), 'utf8'),
  )
  const swiftVersions = JSON.parse(
    await readFile(resolve(PACKAGE_ROOT, 'swift-versions.json'), 'utf8'),
  )
  const today = new Date().toISOString().slice(0, 10)

  const consumers = await findConsumers(root)
  const pythonConsumers = await findPythonConsumers(root)
  const dartConsumers = await findDartConsumers(root)
  const swiftConsumers = await findSwiftConsumers(root)
  if (
    !consumers.length &&
    !pythonConsumers.length &&
    !dartConsumers.length &&
    !swiftConsumers.length
  ) {
    console.log(`baseline-estate: no @syntopica consumers under ${root}.`)
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
  const pythonRows = await conformRows(pythonConsumers, (path) =>
    runPythonConformance(path, pythonVersions),
  )
  // Dart and Swift follow the same shape: their gates live in the root
  // codeality.yml, one job per project, so each table asks whether that job
  // exists and pins a released tool.
  const dartRows = await conformRows(dartConsumers, (path) =>
    runDartConformance(path, dartVersions),
  )
  const swiftRows = await conformRows(swiftConsumers, (path) =>
    runSwiftConformance(path, swiftVersions),
  )
  const tables = [
    [pythonRows, formatPythonEstate],
    [dartRows, formatDartEstate],
    [swiftRows, formatSwiftEstate],
  ]
  let printed = rows.length > 0
  for (const [tableRows, format] of tables) {
    if (!tableRows.length) continue
    if (printed) console.log('')
    console.log(format(tableRows))
    printed = true
  }

  const failing = [...rows, ...pythonRows, ...dartRows, ...swiftRows].filter(
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
