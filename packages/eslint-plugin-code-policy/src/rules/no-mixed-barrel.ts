import type { TSESTree } from '@typescript-eslint/utils'

import { createRule } from '@/utils/create-rule.js'

type Options = []

type MessageIds = 'mixedBarrel'

export default createRule<Options, MessageIds>({
  name: 'no-mixed-barrel',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow barrel files (index.*) that mix re-exports from other modules with inline declarations.',
    },
    schema: [],
    messages: {
      mixedBarrel:
        'Barrel file mixes re-exports from other modules with inline {{kind}} declarations. ' +
        'Either keep this file as a pure barrel (re-exports only) or move inline declarations to their own files.',
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = context.filename || context.physicalFilename || ''

    // Only applies to barrel/index files
    if (
      !filename.endsWith('index.ts') &&
      !filename.endsWith('index.tsx') &&
      !filename.endsWith('index.js')
    ) {
      return {}
    }

    return {
      Program(node: TSESTree.Program) {
        const inlineDeclarations: {
          node: TSESTree.ProgramStatement
          kind: string
        }[] = []
        let hasRemoteReexport = false

        for (const stmt of node.body) {
          if (stmt.type === 'ExportNamedDeclaration') {
            if (stmt.source) {
              // export { X } from '...' or export type { X } from '...'
              hasRemoteReexport = true
            } else if (stmt.declaration) {
              // export type Foo = { ... } or export const x = ...
              const declType = stmt.declaration.type
              let kind: string
              if (
                declType === 'TSTypeAliasDeclaration' ||
                declType === 'TSInterfaceDeclaration'
              ) {
                kind = 'type'
              } else if (declType === 'FunctionDeclaration') {
                kind = 'function'
              } else if (declType === 'ClassDeclaration') {
                kind = 'class'
              } else {
                kind = 'value'
              }

              inlineDeclarations.push({ node: stmt, kind })
            }
          } else if (stmt.type === 'ExportAllDeclaration') {
            // export * from '...' — source is always present on ExportAllDeclaration
            hasRemoteReexport = true
          } else if (stmt.type === 'ExportDefaultDeclaration') {
            inlineDeclarations.push({ node: stmt, kind: 'default' })
          }
        }

        if (hasRemoteReexport && inlineDeclarations.length > 0) {
          for (const decl of inlineDeclarations) {
            context.report({
              node: decl.node,
              messageId: 'mixedBarrel',
              data: { kind: decl.kind },
            })
          }
        }
      },
    }
  },
})
