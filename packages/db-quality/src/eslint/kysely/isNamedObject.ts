import type { Expression, Super } from 'estree'

/** `db`, or the last member of `this.db` / `ctx.trx`, is one of the names. */
export const isNamedObject = (
  node: Expression | Super,
  names: readonly string[],
): boolean => {
  if (node.type === 'Identifier') return names.includes(node.name)
  return (
    node.type === 'MemberExpression' &&
    !node.computed &&
    node.property.type === 'Identifier' &&
    names.includes(node.property.name)
  )
}
