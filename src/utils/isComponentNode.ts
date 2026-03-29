/**
 * Determines whether a function node is a top-level component declaration.
 * Top-level means it is directly under Program, ExportNamedDeclaration,
 * ExportDefaultDeclaration, or assigned as a top-level VariableDeclarator.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isComponentNode(node: any): boolean {
  if (!node.parent) return false
  const isTopLevel =
    node.parent.type === 'Program' ||
    node.parent.type === 'ExportNamedDeclaration' ||
    node.parent.type === 'ExportDefaultDeclaration' ||
    (node.parent.type === 'VariableDeclarator' &&
      (node.parent.parent?.parent?.type === 'Program' ||
        node.parent.parent?.parent?.type === 'ExportNamedDeclaration'))
  return isTopLevel
}
