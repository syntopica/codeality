import { withoutWhereRule } from '@/eslint/kysely/withoutWhereRule.js'

export const updateWithoutWhere = withoutWhereRule(
  'updateTable',
  'updateTable(...) reaches execute without .where(): it updates every row of the table',
)
