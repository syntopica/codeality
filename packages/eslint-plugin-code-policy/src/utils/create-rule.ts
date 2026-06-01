import { ESLintUtils } from '@typescript-eslint/utils'

import { DOCS_BASE_URL } from '@/utils/docs-base-url.js'

// Typed rule factory: gives every rule TSESTree-typed nodes, typed messageIds
// and options, and a generated docs URL. Replaces the loose `eslint`
// `Rule.RuleModule` shape that forced `any` casts across AST traversal.
export const createRule = ESLintUtils.RuleCreator(
  (name) => `${DOCS_BASE_URL}/${name}.md`,
)
