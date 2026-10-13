import type { TSESLint, TSESTree } from '@typescript-eslint/utils'

// Every static edge a module can take to another: `import`, `export ... from`,
// `export * from`, and `import('literal')`. An import-only visitor let
// `export { x } from 'pkg/src/private'` and `import('pkg/src/private')` reach
// the same file the rule forbids importing. A computed `import(path)` names no
// module and cannot be checked statically.
export function moduleSourceVisitors(
  onSource: (node: TSESTree.Node, importPath: string) => void,
): TSESLint.RuleListener {
  return {
    ImportDeclaration(node) {
      onSource(node, node.source.value)
    },
    ExportNamedDeclaration(node) {
      if (node.source) onSource(node, node.source.value)
    },
    ExportAllDeclaration(node) {
      onSource(node, node.source.value)
    },
    ImportExpression(node) {
      if (
        node.source.type === 'Literal' &&
        typeof node.source.value === 'string'
      ) {
        onSource(node, node.source.value)
      }
    },
  }
}
