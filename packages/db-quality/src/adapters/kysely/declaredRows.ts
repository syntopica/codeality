import type { CompilingStep } from '@/adapters/kysely/CompilingStep.js'
import type { KyselyQueryResponse } from '@/config/KyselyQueryResponse.js'

// The first declared response that applies wins; without one, no rows, as
// before responses could be declared, so undeclared hashes never change.
/** The rows declared for `sql` in the current step; none when nothing matches. */
export const declaredRows = (
  responses: readonly KyselyQueryResponse[],
  current: CompilingStep,
  sql: string,
): Record<string, unknown>[] =>
  responses.find(
    (response) =>
      sql.includes(response.match) &&
      (response.migration === undefined ||
        response.migration === current.migration) &&
      (response.step === undefined || response.step === current.step),
  )?.rows ?? []
