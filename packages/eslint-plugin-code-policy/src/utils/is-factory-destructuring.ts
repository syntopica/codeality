import type { TSESTree } from '@typescript-eslint/utils'

// Whether a declarator destructures the result of a single call.
//
// `export const { handlers, auth, signIn, signOut } = NextAuth(config)` binds
// four names, but they are one unit: the library returns one object and the
// destructuring is how it hands the pieces over. Splitting it is not possible
// without calling the factory twice. next-intl's
// `createNavigation(routing)` and NextAuth v5 are the canonical cases, both
// straight out of their official setup guides; found in two adopting repos.
//
// The case `one-primary-unit` targets is unaffected, because its init is a
// plain reference rather than a call: `export const { first, second } = source`
// really is re-exporting two things from an object, and still counts as two.
export function isFactoryDestructuring(
  declarator: TSESTree.VariableDeclarator,
): boolean {
  if (
    declarator.id.type !== 'ObjectPattern' &&
    declarator.id.type !== 'ArrayPattern'
  ) {
    return false
  }
  const init =
    declarator.init?.type === 'AwaitExpression'
      ? declarator.init.argument
      : declarator.init
  return init?.type === 'CallExpression' || init?.type === 'NewExpression'
}
