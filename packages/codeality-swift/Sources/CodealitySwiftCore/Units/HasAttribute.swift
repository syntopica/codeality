import SwiftSyntax

/// Whether [attributes] holds `@name`.
func hasAttribute(_ attributes: AttributeListSyntax, _ name: String) -> Bool {
  attributes.contains { element in
    element.as(AttributeSyntax.self)?.attributeName.trimmedDescription == name
  }
}
