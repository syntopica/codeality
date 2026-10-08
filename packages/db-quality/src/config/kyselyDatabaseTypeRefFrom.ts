import type { DatabaseTypeRef } from '@/config/DatabaseTypeRef.js'
import { ConfigError } from '@syntopica/gate-kit/ConfigError'

// `kysely.databaseType` is "<root-relative module path>#<export name>"; the
// export name defaults to "Database" when there is no "#". Both end up in a
// generated import, so the export must be an identifier and the path must not
// carry quotes or line breaks.
export const kyselyDatabaseTypeRefFrom = (value: string): DatabaseTypeRef => {
  const hash = value.indexOf('#')
  const path = hash === -1 ? value : value.slice(0, hash)
  const exportName = hash === -1 ? 'Database' : value.slice(hash + 1)
  if (
    path === '' ||
    /['"`\\\n\r]/.test(path) ||
    !/^[A-Z_$][\w$]*$/i.test(exportName)
  )
    throw new ConfigError(
      `kysely.databaseType: invalid value "${value}", expected "<path>#<export>"`,
    )
  return { path, exportName }
}
