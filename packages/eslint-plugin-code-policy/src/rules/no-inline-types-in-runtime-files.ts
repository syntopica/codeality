import type { Rule } from 'eslint'

import { DOCS_BASE_URL } from '@/utils/docs-base-url.js'

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow inline interfaces and type aliases inside runtime files when they are not the primary unit.',
      recommended: true,
      url: `${DOCS_BASE_URL}/no-inline-types-in-runtime-files.md`,
    },
    fixable: undefined,
    schema: [],
    messages: {
      inlineTypeInRuntimeFile:
        'Inline types (interfaces or type aliases) are not permitted within runtime files. Please extract this type into its own dedicated file (e.g., {{name}}Props.ts or {{name}}State.ts) according to the Atomic File architecture.',
    },
  },
  create(context) {
    const filename = context.filename || context.physicalFilename || ''

    if (
      filename.endsWith('.config.ts') ||
      filename.endsWith('.config.js') ||
      filename.endsWith('.config.mjs') ||
      filename.endsWith('.config.cjs') ||
      filename.endsWith('.d.ts') ||
      filename.endsWith('proxy.ts')
    ) {
      return {}
    }

    return {
      Program(node) {
        let hasRuntimeCode = false

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const types: any[] = []

        for (const stmt of node.body) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let decl: any = stmt
          if (
            (stmt.type === 'ExportNamedDeclaration' ||
              stmt.type === 'ExportDefaultDeclaration') &&
            stmt.declaration
          ) {
            decl = stmt.declaration
          }

          if (
            decl.type === 'TSTypeAliasDeclaration' ||
            decl.type === 'TSInterfaceDeclaration'
          ) {
            types.push({ node: decl, name: decl.id?.name ?? 'unknown' })
          } else if (
            stmt.type !== 'ImportDeclaration' &&
            stmt.type !== 'ExportAllDeclaration' &&
            stmt.type !== 'EmptyStatement' &&
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (stmt as any).type !== 'TSImportEqualsDeclaration' &&
            !(
              (stmt.type === 'ExportNamedDeclaration' ||
                stmt.type === 'ExportDefaultDeclaration') &&
              !stmt.declaration
            )
          ) {
            hasRuntimeCode = true
          }
        }

        if (hasRuntimeCode && types.length > 0) {
          for (const t of types) {
            context.report({
              node: t.node,
              messageId: 'inlineTypeInRuntimeFile',
              data: {
                name: t.name.replace(/(Props|State|Type|Interface)$/i, ''),
              },
            })
          }
        }
      },
    }
  },
} as Rule.RuleModule
