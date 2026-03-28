import type { Rule } from 'eslint'

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

const ALLOWED_NEXT_EXPORTS = new Set([
  'config',
  'metadata',
  'dynamic',
  'revalidate',
  'fetchCache',
  'runtime',
  'preferredRegion',
  'viewport',
  'generateMetadata',
  'generateViewport',
  'generateStaticParams',
])

const ROUTE_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforces the Atomic File Rule: exactly one top-level declaration (function, type, class, constant) per file.',
      recommended: true,
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
        const units: Array<{ node: any; name: string }> = []

        for (const stmt of node.body) {
          let decl: any = stmt
          let isExport = false

          if (stmt.type === 'ExportNamedDeclaration' && (stmt as any).declaration) {
            decl = (stmt as any).declaration
            isExport = true
          } else if (stmt.type === 'ExportDefaultDeclaration' && (stmt as any).declaration) {
            decl = (stmt as any).declaration
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
              if (isExport && ALLOWED_NEXT_EXPORTS.has(name)) {
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
            context.report({
              node: units[i].node,
              messageId: 'singleDeclaration',
              data: { name: units[i].name },
            })
          }
        }
      },
    }
  },
} as Rule.RuleModule
