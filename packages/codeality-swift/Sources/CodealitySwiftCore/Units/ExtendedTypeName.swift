import SwiftSyntax

/// The extended type's last name component, generic arguments dropped:
/// `Array<Beat>` is `Array`, `Foo.Bar` is `Bar`.
func extendedTypeName(_ ext: ExtensionDeclSyntax) -> String {
  let description = ext.extendedType.trimmedDescription
  let withoutGenerics =
    description.split(separator: "<", maxSplits: 1).first.map(String.init) ?? description
  return withoutGenerics.split(separator: ".").last.map(String.init) ?? withoutGenerics
}
