import type { TSESTree } from '@typescript-eslint/utils'

import { createRule } from '@/utils/create-rule.js'
import { isSchemaDerivedType } from '@/utils/is-schema-derived-type.js'
import { localValueNames } from '@/utils/local-value-names.js'

type Options = []

type MessageIds = 'inlineTypeInRuntimeFile'

export default createRule<Options, MessageIds>({
  name: 'no-inline-types-in-runtime-files',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow inline interfaces and type aliases inside runtime files when they are not the primary unit.',
    },
    schema: [],
    messages: {
      inlineTypeInRuntimeFile:
        'Inline types (interfaces or type aliases) are not permitted within runtime files. Please extract this type into its own dedicated file (e.g., {{name}}Props.ts or {{name}}State.ts) according to the Atomic File architecture.',
    },
  },
  defaultOptions: [],
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
      Program(node: TSESTree.Program) {
        let hasRuntimeCode = false
        const valueNames = localValueNames(node)

        const types: Array<{
          node:
            TSESTree.TSTypeAliasDeclaration | TSESTree.TSInterfaceDeclaration
          name: string
        }> = []

        for (const stmt of node.body) {
          let decl: TSESTree.Node = stmt
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
            // `type Foo = z.infer<typeof fooSchema>` beside its schema is the
            // schema's signature, not a second unit: moving it out would
            // import the schema straight back.
            if (!isSchemaDerivedType(decl, valueNames)) {
              types.push({ node: decl, name: decl.id?.name ?? 'unknown' })
            }
          } else if (
            stmt.type !== 'ImportDeclaration' &&
            stmt.type !== 'ExportAllDeclaration' &&
            stmt.type !== 'EmptyStatement' &&
            stmt.type !== 'TSImportEqualsDeclaration' &&
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
})
