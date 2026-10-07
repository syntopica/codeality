import type { Expression, Super } from 'estree'

/** The method names of a call chain in source order, and the expression it starts from. */
export type MethodChain = { methods: string[]; base: Expression | Super }
