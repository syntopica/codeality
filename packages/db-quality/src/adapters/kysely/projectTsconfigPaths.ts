import { existsSync } from 'node:fs'
import { join } from 'node:path'

// Passed to jiti as `tsconfigPaths`, which reads the file with get-tsconfig
// (comments, `extends` chains and `baseUrl` included) and resolves the
// project's `compilerOptions.paths` aliases, so a migrations module may import
// `@/db/migrations/...` exactly as the application does. Only the project's
// own tsconfig.json: walking further up could pick up an unrelated one.
/** The project's tsconfig.json for jiti's path-alias resolution, or false when it has none. */
export const projectTsconfigPaths = (root: string): string | false => {
  const path = join(root, 'tsconfig.json')
  return existsSync(path) ? path : false
}
