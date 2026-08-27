import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { ciWorkflow } from './ciWorkflow.mjs'

const WORKFLOW_DIR = '.github/workflows'
const WORKFLOW_NAME = 'ci.yml'

// A workflow that already runs the baseline entrypoints, whatever it is called.
// Matching on the command rather than the filename is deliberate: a repo whose
// gate job lives in `verify.yml` or `main.yml` is wired, and writing a second
// workflow beside it would run every gate twice on every push.
const RUNS_BASELINE_GATES = /pnpm\s+(?:run\s+)?check:ci\b/

/**
 * Writes `.github/workflows/ci.yml` when nothing in the repository already
 * runs the baseline gates, and reports what it found when something does.
 *
 * Returns `{ written, existing }`: `written` is the path if one was created,
 * `existing` is the name of the workflow that made writing unnecessary, and a
 * repository with workflows that do not run the gates gets neither - the
 * caller reports that as a partial wiring rather than writing a file that
 * would duplicate an existing pipeline.
 */
export async function writeCiWorkflow(root, { hasBuild }) {
  const dir = resolve(root, WORKFLOW_DIR)
  let entries = []
  try {
    // A fixed path under the directory this CLI was invoked against.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    entries = (await readdir(dir)).filter((name) => /\.ya?ml$/.test(name))
  } catch {
    /* no workflow directory yet */
  }

  for (const name of entries) {
    let raw
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      raw = await readFile(resolve(dir, name), 'utf8')
    } catch {
      continue
    }
    if (RUNS_BASELINE_GATES.test(raw)) return { written: null, existing: name }
  }

  if (entries.length) return { written: null, existing: null, partial: entries }

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await mkdir(dir, { recursive: true })
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await writeFile(resolve(dir, WORKFLOW_NAME), ciWorkflow({ hasBuild }), 'utf8')
  return { written: `${WORKFLOW_DIR}/${WORKFLOW_NAME}`, existing: null }
}
