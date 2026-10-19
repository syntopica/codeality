import SwiftSyntax

/// The units one top-level declaration contributes; `#if` blocks contribute
/// those of every clause.
func declarationUnits(_ decl: DeclSyntax, line: Int) -> [Unit] {
    func unit(
        _ name: TokenSyntax, _ attributes: AttributeListSyntax,
        _ inheritance: InheritanceClauseSyntax? = nil
    )
        -> [Unit]
    {
        let kind: UnitKind = conformsTo(inheritance, "PreviewProvider") ? .preview : .declaration
        return [Unit(name: name.text, kind: kind, line: line, isMain: hasAttribute(attributes, "main"))]
    }
    if let d = decl.as(StructDeclSyntax.self) {
        return unit(d.name, d.attributes, d.inheritanceClause)
    }
    if let d = decl.as(ClassDeclSyntax.self) {
        return unit(d.name, d.attributes, d.inheritanceClause)
    }
    if let d = decl.as(EnumDeclSyntax.self) { return unit(d.name, d.attributes, d.inheritanceClause) }
    if let d = decl.as(ActorDeclSyntax.self) {
        return unit(d.name, d.attributes, d.inheritanceClause)
    }
    if let d = decl.as(ProtocolDeclSyntax.self) { return unit(d.name, d.attributes) }
    if let d = decl.as(TypeAliasDeclSyntax.self) { return unit(d.name, d.attributes) }
    if let d = decl.as(FunctionDeclSyntax.self) { return unit(d.name, d.attributes) }
    if let d = decl.as(MacroDeclSyntax.self) { return unit(d.name, d.attributes) }
    if let d = decl.as(VariableDeclSyntax.self) {
        return d.bindings.compactMap { binding in
            binding.pattern.as(IdentifierPatternSyntax.self).map {
                Unit(name: $0.identifier.text, kind: .declaration, line: line, isMain: false)
            }
        }
    }
    if let d = decl.as(ExtensionDeclSyntax.self) {
        return [Unit(name: extendedTypeName(d), kind: .extension, line: line, isMain: false)]
    }
    if let d = decl.as(MacroExpansionDeclSyntax.self), d.macroName.text == "Preview" {
        return [Unit(name: "Preview", kind: .preview, line: line, isMain: false)]
    }
    return []
}
