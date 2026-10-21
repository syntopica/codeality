import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { cwd, execPath } from 'node:process'

/** Resolve a Node CLI from the consumer, including hoisted workspace installs. */
export function localNodeToolCommand(name, directory = cwd()) {
  const require = createRequire(resolve(directory, 'package.json'))
  const manifestPath = require.resolve(`${name}/package.json`)
  // The manifest belongs to the explicitly selected, installed tool.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const entry =
    typeof manifest.bin === 'string' ? manifest.bin : manifest.bin?.[name]
  if (typeof entry !== 'string')
    throw new Error(`No installed CLI entry for ${name}`)
  return [execPath, resolve(dirname(manifestPath), entry)]
}
