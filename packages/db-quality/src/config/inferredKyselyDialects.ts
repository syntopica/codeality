import { KYSELY_DRIVER_DIALECTS } from '@/config/KYSELY_DRIVER_DIALECTS.js'
import type { KyselyDialect } from '@/config/KyselyDialect.js'
import { manifestDependencies } from '@/config/manifestDependencies.js'

/** Every dialect whose driver package the project depends on, in the KYSELY_DRIVER_DIALECTS order. */
export const inferredKyselyDialects = (root: string): KyselyDialect[] => {
  const dependencies = manifestDependencies(root)
  return [...KYSELY_DRIVER_DIALECTS].flatMap(([driver, dialect]) =>
    driver in dependencies ? [dialect] : [],
  )
}
