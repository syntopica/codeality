import type { TSESTree } from '@typescript-eslint/utils'

/**
 * Whether a node sits at module scope: directly under Program or an export, or
 * as the initializer of a module-scope variable.
 */
export function isTopLevelPosition(node: TSESTree.Node): boolean {
  const parent = node.parent
  if (!parent) return false
  return (
    parent.type === 'Program' ||
    parent.type === 'ExportNamedDeclaration' ||
    parent.type === 'ExportDefaultDeclaration' ||
    (parent.type === 'VariableDeclarator' &&
      (parent.parent?.parent?.type === 'Program' ||
        parent.parent?.parent?.type === 'ExportNamedDeclaration'))
  )
}
