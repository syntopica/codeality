import { createRequire } from 'node:module'
import { join } from 'node:path'

import type { JitiLoader } from '@/adapters/kysely/JitiLoader.js'
import type { KyselyModule } from '@/adapters/kysely/KyselyModule.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

// Resolved from the project explicitly: jiti would otherwise fall back to the
// copy beside this package, and the migrations must compile with the
// project's own version.
/** The project's own `kysely`, so the migrations and the compiler share one copy. */
export const loadKyselyModule = async (
  jiti: JitiLoader,
  root: string,
): Promise<KyselyModule> => {
  let resolved: string
  try {
    resolved = createRequire(join(root, 'package.json')).resolve('kysely')
  } catch {
    throw new ToolMissingError(
      'kysely',
      'add kysely as a dependency of the project',
    )
  }
  return await jiti.import<KyselyModule>(resolved)
}
