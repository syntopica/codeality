import type { Scope } from 'eslint'

/** A variable definition from a declarator, narrowed by constDefinition to `const`. */
export type ConstVariableDefinition = Extract<
  Scope.Definition,
  { type: 'Variable' }
>
