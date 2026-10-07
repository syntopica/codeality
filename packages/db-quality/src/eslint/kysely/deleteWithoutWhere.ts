import { withoutWhereRule } from '@/eslint/kysely/withoutWhereRule.js'

export const deleteWithoutWhere = withoutWhereRule(
  'deleteFrom',
  'deleteFrom(...) reaches execute without .where(): it deletes every row of the table',
)
