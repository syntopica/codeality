import type { TSESTree } from '@typescript-eslint/utils'

// `z.infer<typeof schema>` and its siblings. `TypeOf` is zod's own alias for
// `infer`; `input`/`output` are the pre- and post-transform shapes.
const ZOD_DERIVERS = new Set(['infer', 'input', 'output', 'TypeOf'])

// drizzle exposes a table's row shapes as properties on the table object.
const DRIZZLE_DERIVERS = new Set(['$inferSelect', '$inferInsert'])

/**
 * Whether a type alias is the signature of a value declared in the same file.
 *
 * `export const fooSchema = z.object(...)` plus
 * `export type Foo = z.infer<typeof fooSchema>` is one unit, not two: the type
 * cannot move to a file of its own without importing the schema straight back,
 * so splitting produces a two-line file and no separation at all. The same
 * holds for a drizzle table and the row types derived from it.
 *
 * Only a base declared in this file counts. A type derived from an imported
 * schema is an ordinary inline type and stays reportable.
 */
export function isSchemaDerivedType(
  node: TSESTree.Node,
  localValueNames: ReadonlySet<string>,
): boolean {
  if (node.type !== 'TSTypeAliasDeclaration') return false
  const annotation = node.typeAnnotation

  // typeof table.$inferSelect
  if (annotation.type === 'TSTypeQuery') {
    const { exprName } = annotation
    return (
      exprName.type === 'TSQualifiedName' &&
      exprName.left.type === 'Identifier' &&
      DRIZZLE_DERIVERS.has(exprName.right.name) &&
      localValueNames.has(exprName.left.name)
    )
  }

  // z.infer<typeof schema>
  if (annotation.type !== 'TSTypeReference') return false
  const { typeName } = annotation
  if (
    typeName.type !== 'TSQualifiedName' ||
    !ZOD_DERIVERS.has(typeName.right.name)
  ) {
    return false
  }

  const [argument] = annotation.typeArguments?.params ?? []
  return (
    argument?.type === 'TSTypeQuery' &&
    argument.exprName.type === 'Identifier' &&
    localValueNames.has(argument.exprName.name)
  )
}
