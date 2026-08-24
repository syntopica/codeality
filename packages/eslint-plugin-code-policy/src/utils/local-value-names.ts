import type { TSESTree } from '@typescript-eslint/utils'

import { boundIdentifierNames } from '@/utils/bound-identifier-names.js'

/**
 * Names of the values a module declares at its top level, exported or not.
 *
 * Types are excluded on purpose: this answers "is there a value called X in
 * this file", which is what a `typeof X` reference needs to resolve.
 */
export function localValueNames(program: TSESTree.Program): Set<string> {
  const names = new Set<string>()

  for (const statement of program.body) {
    const declaration =
      (statement.type === 'ExportNamedDeclaration' ||
        statement.type === 'ExportDefaultDeclaration') &&
      statement.declaration
        ? statement.declaration
        : statement

    if (declaration.type === 'VariableDeclaration') {
      for (const declarator of declaration.declarations) {
        for (const name of boundIdentifierNames(declarator.id)) names.add(name)
      }
    } else if (
      (declaration.type === 'FunctionDeclaration' ||
        declaration.type === 'ClassDeclaration') &&
      declaration.id
    ) {
      names.add(declaration.id.name)
    }
  }

  return names
}
