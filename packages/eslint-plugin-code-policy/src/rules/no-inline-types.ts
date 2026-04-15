import type { Rule } from 'eslint'

import { NEXT_RESERVED_EXPORTS } from '@/utils/next-reserved-exports.js'
import { ROUTE_METHODS } from '@/utils/route-methods.js'
import { DOCS_BASE_URL } from '@/utils/docs-base-url.js'

/**
 * @fileoverview ESLint rule: no inline type or interface declarations.
 *
 * Enforces the atomic file rule: every `type` alias and `interface` declaration
 * must live in its own dedicated file (inside a `types/` folder OR as a
 * standalone "pure type file" that contains nothing but type declarations).
 *
 * ✅ Correct:  import type { Foo } from '@/types/Foo'
 * ✅ Correct:  FooProps.ts containing only `export interface FooProps { ... }`
 * ❌ Wrong:    type Foo = { ... }  declared inside an implementation file
 *
 * Exemptions:
 * - Files inside `types/` or `types/**` folders
 * - Files ending in `.d.ts`
 * - "Pure type files": files whose entire body consists only of
 *   import declarations + type/interface declarations (possibly exported)
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce that type aliases and interfaces live in dedicated files, not inline with implementation code.',
      recommended: true,
      url: `${DOCS_BASE_URL}/no-inline-types.md`,
    },
    fixable: undefined,
    schema: [],
    messages: {
      singleDeclaration:
        'Atomic File Rule violation: file contains multiple declarations. Extract "{{name}}" into its own file.',
    },
  },
  create(context) {
    // Allow multiple declarations in ambient definition files
    if (context.filename.endsWith('.d.ts')) return {}

    return {
      Program(node) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const units: { node: any; name: string }[] = []

        for (const stmt of node.body) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let decl: any = stmt
          let isExport = false

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (stmt.type === 'ExportNamedDeclaration' && (stmt as any).declaration) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            decl = (stmt as any).declaration
            isExport = true
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } else if (stmt.type === 'ExportDefaultDeclaration' && (stmt as any).declaration) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            decl = (stmt as any).declaration ?? stmt
            isExport = true
          }

          const isRouteFile =
            context.filename.endsWith('/route.ts') || context.filename.endsWith('/route.js')
          const declType = decl.type

          if (
            declType === 'FunctionDeclaration' ||
            declType === 'ClassDeclaration' ||
            declType === 'TSTypeAliasDeclaration' ||
            declType === 'TSInterfaceDeclaration' ||
            declType === 'TSEnumDeclaration'
          ) {
            const name = decl.id?.name ?? 'default'
            if (
              isRouteFile &&
              isExport &&
              declType === 'FunctionDeclaration' &&
              ROUTE_METHODS.has(name)
            ) {
              continue
            }
            units.push({ node: decl, name })
          } else if (declType === 'VariableDeclaration') {
            for (const d of decl.declarations) {
              const name = d.id?.name
              if (isExport && NEXT_RESERVED_EXPORTS.has(name)) {
                continue
              }
              if (isRouteFile && isExport && ROUTE_METHODS.has(name)) {
                continue
              }
              units.push({ node: decl, name: name ?? 'unknown' })
            }
          }
        }

        if (units.length > 1) {
          for (let i = 1; i < units.length; i++) {
            const unit = units[i]
            if (!unit) continue
            context.report({
              node: unit.node,
              messageId: 'singleDeclaration',
              data: { name: unit.name },
            })
          }
        }
      },
    }
  },
} as Rule.RuleModule
