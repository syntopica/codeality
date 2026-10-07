import type { Rule } from 'eslint'

/** The one option every Kysely chain rule takes: the names a Kysely instance goes by. */
export const OBJECT_NAMES_SCHEMA: NonNullable<Rule.RuleMetaData['schema']> = [
  {
    type: 'object',
    properties: { objectNames: { type: 'array', items: { type: 'string' } } },
    additionalProperties: false,
  },
]
