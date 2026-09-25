import type ts from 'typescript'

import type { TypeScriptModule } from '@/postgrest/TypeScriptModule.js'

/** A string literal verbatim, an object literal as `{key:value}` pairs, anything else as `?`. */
export const literalArgument = (
  compiler: TypeScriptModule,
  node: ts.Expression,
): string => {
  if (
    compiler.isStringLiteral(node) ||
    compiler.isNoSubstitutionTemplateLiteral(node)
  )
    return node.text
  if (!compiler.isObjectLiteralExpression(node)) return '?'
  const pairs = node.properties.map((property) => {
    if (!compiler.isPropertyAssignment(property)) return '?'
    const key =
      compiler.isIdentifier(property.name) ||
      compiler.isStringLiteral(property.name)
        ? property.name.text
        : '?'
    const value = property.initializer
    const text =
      compiler.isStringLiteral(value) || compiler.isNumericLiteral(value)
        ? value.text
        : value.kind === compiler.SyntaxKind.TrueKeyword
          ? 'true'
          : value.kind === compiler.SyntaxKind.FalseKeyword
            ? 'false'
            : '?'
    return `${key}:${text}`
  })
  return `{${pairs.join(',')}}`
}
