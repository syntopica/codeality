import { authUidNotWrapped } from '@/rules/authUidNotWrapped.js'
import { definerWithoutSearchPath } from '@/rules/definerWithoutSearchPath.js'
import { permissivePolicy } from '@/rules/permissivePolicy.js'
import { rlsEnabledNoPolicy } from '@/rules/rlsEnabledNoPolicy.js'
import type { SqlRule } from '@/rules/SqlRule.js'
import { tableWithoutRls } from '@/rules/tableWithoutRls.js'

export const SQL_RULES: SqlRule[] = [
  permissivePolicy,
  rlsEnabledNoPolicy,
  tableWithoutRls,
  authUidNotWrapped,
  definerWithoutSearchPath,
]
