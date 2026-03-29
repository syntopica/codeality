import { readFileSync, writeFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const content = `export const PLUGIN_VERSION = '${pkg.version}' as const\n`

writeFileSync('src/version.ts', content)
