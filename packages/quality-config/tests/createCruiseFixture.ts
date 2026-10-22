import { mkdirSync, mkdtempSync, realpathSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

export function createCruiseFixture(
  files: Readonly<Record<string, string>>,
): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'cruise-config-')))
  for (const [name, contents] of Object.entries(files)) {
    const target = join(root, name)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, contents, { mode: 0o644 })
  }
  return root
}
