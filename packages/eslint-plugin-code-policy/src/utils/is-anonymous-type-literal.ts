import type { TSESTree } from '@typescript-eslint/utils'

// A literal under one of these is either reported with its declaration
// (`type Foo = { ... }`), part of an outer literal already reported, or an
// ambient augmentation (`declare global { ... }`) that has no file to move to.
const OWNING_ANCESTORS = new Set<string>([
  'TSTypeLiteral',
  'TSTypeAliasDeclaration',
  'TSInterfaceDeclaration',
  'TSModuleDeclaration',
])

/**
 * Whether an object type literal is an anonymous shape written straight into
 * runtime code: `const rows: { a: string }[] = []`, `value as { a: string }`,
 * `(props: { a: string }) => ...`. Only the outermost literal counts, so one
 * shape is one finding.
 */
export function isAnonymousTypeLiteral(
  ancestors: readonly TSESTree.Node[],
): boolean {
  return !ancestors.some((ancestor) => OWNING_ANCESTORS.has(ancestor.type))
}
