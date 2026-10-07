import type ts from 'typescript'

/** A string, number or bigint literal type (enum members included), or a union of only those. */
export const isLiteralType = (type: ts.Type): boolean =>
  type.isUnion() ? type.types.every(isLiteralType) : type.isLiteral()
