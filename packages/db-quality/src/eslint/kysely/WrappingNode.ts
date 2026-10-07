import type { Expression } from 'estree'

/** Any of WRAPPER_TYPES, seen through the one field they share. */
export type WrappingNode = { expression: Expression }
