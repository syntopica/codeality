import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Direct runtime dependencies owned by an installed package; unknown metadata gives none. */
export function readInstalledDependencyNames(
  cwd: string,
  name: string,
): string[] {
  try {
    const manifest = JSON.parse(
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- a listed dependency's manifest under the project's node_modules
      readFileSync(join(cwd, 'node_modules', name, 'package.json'), 'utf8'),
    ) as { dependencies?: Record<string, unknown> }
    const dependencies = manifest.dependencies
    if (
      !dependencies ||
      typeof dependencies !== 'object' ||
      Array.isArray(dependencies)
    )
      return []
    const names: string[] = []
    for (const [dependency, version] of Object.entries(dependencies)) {
      if (typeof version === 'string' && version.trim().length > 0)
        names.push(dependency)
    }
    return names
  } catch {
    return []
  }
}
