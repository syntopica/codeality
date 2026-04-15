import type { Rule } from 'eslint'

import { DOCS_BASE_URL } from '@/utils/docs-base-url.js'

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow barrel files (index.*) that mix re-exports from other modules with inline declarations.',
      recommended: true,
      url: `${DOCS_BASE_URL}/no-mixed-barrel.md`,
    },
    fixable: undefined,
    schema: [],
    messages: {
      mixedBarrel:
        'Barrel file mixes re-exports from other modules with inline {{kind}} declarations. ' +
        'Either keep this file as a pure barrel (re-exports only) or move inline declarations to their own files.',
    },
  },
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
      Program(node) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const inlineDeclarations: { node: any; kind: string }[] = []
        let hasRemoteReexport = false

        for (const stmt of node.body) {
          if (stmt.type === 'ExportNamedDeclaration') {
            if (stmt.source) {
              // export { X } from '...' or export type { X } from '...'
              hasRemoteReexport = true
            } else if (stmt.declaration) {
              // export type Foo = { ... } or export const x = ...
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const declAny = stmt.declaration as any
              const declType: string = declAny.type
              let kind: string
              if (declType === 'TSTypeAliasDeclaration' || declType === 'TSInterfaceDeclaration') {
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
} as Rule.RuleModule
