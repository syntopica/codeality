import ts from 'typescript'

/** A string literal verbatim, an object literal as `{key:value}` pairs, anything else as `?`. */
export const literalArgument = (node: ts.Expression): string => {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    return node.text
  if (!ts.isObjectLiteralExpression(node)) return '?'
  const pairs = node.properties.map((property) => {
    if (!ts.isPropertyAssignment(property)) return '?'
    const key =
      ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
        ? property.name.text
        : '?'
    const value = property.initializer
    const text =
      ts.isStringLiteral(value) || ts.isNumericLiteral(value)
        ? value.text
        : value.kind === ts.SyntaxKind.TrueKeyword
          ? 'true'
          : value.kind === ts.SyntaxKind.FalseKeyword
            ? 'false'
            : '?'
    return `${key}:${text}`
  })
  return `{${pairs.join(',')}}`
}
