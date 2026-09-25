import { createRequire } from 'node:module'

import type { TypeScriptModule } from '@/postgrest/TypeScriptModule.js'
import { ToolMissingError } from '@/tools/ToolMissingError.js'

/**
 * The project's typescript, else the one installed next to this package.
 * An optional peer: only the PostgREST rules need it, so it is never imported
 * statically and its absence is exit 3, not a crash of every command.
 */
export const loadTypeScript = (bases: string[]): TypeScriptModule => {
  for (const base of bases) {
    try {
      return createRequire(base)('typescript') as TypeScriptModule
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'MODULE_NOT_FOUND')
        throw error
    }
  }
  throw new ToolMissingError(
    'typescript',
    'install typescript in the project to run the PostgREST rules',
  )
}
